"""
Faz 1 kapanış: kayıt → JWT → müsait slot → randevu → çakışma → /appointments/me/

Çalıştırma:
    python manage.py test api.tests.test_faz1_kapanis_e2e -v 2
"""

from __future__ import annotations

import datetime as dt
import uuid

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from business.models import Business, Service, Staff, StaffService
from business.working_hours import WEEKDAYS

User = get_user_model()


def _week_all_open() -> dict:
    return {
        w: {"open": "09:00", "close": "18:00", "closed": False, "breaks": []}
        for w in WEEKDAYS
    }


def _next_weekday_on_or_after(d: dt.date) -> dt.date:
    for _ in range(14):
        if d.weekday() < 5:
            return d
        d += dt.timedelta(days=1)
    return d


@override_settings(
    ALLOWED_HOSTS=["testserver", "localhost", "127.0.0.1"],
)
class Faz1KapanisE2ETests(TestCase):
    """Swagger/Postman kapanış senaryosunun otomatik karşılığı."""

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user(
            email="e2e-owner@test.local",
            password="ownerPass123!",
            full_name="E2E Owner",
            phone="+900000000001",
            role=User.Role.BUSINESS_ADMIN,
        )
        cls.business = Business.objects.create(
            owner=cls.owner,
            name="E2E Demo Salon",
            slug=f"e2e-demo-{uuid.uuid4().hex[:8]}",
            category=Business.Category.BARBER,
            description="E2E test",
            address_line="Test 1",
            city="Ankara",
            district="Çankaya",
            working_hours=_week_all_open(),
            timezone="Europe/Istanbul",
            is_active=True,
        )
        cls.service = Service.objects.create(
            business=cls.business,
            name="E2E Saç kesimi",
            duration_minutes=30,
            price="400.00",
            is_active=True,
        )
        cls.staff = Staff.objects.create(
            business=cls.business,
            display_name="E2E Personel",
            is_active=True,
        )
        StaffService.objects.create(
            staff=cls.staff,
            service=cls.service,
            is_active=True,
        )

    def setUp(self):
        self.client = APIClient()

    def test_faz1_kapanis_end_to_end(self):
        """Kayıt → token → slotlar → ilk randevu 201 → ikinci 400 → me listesi."""
        suf = uuid.uuid4().hex[:10]
        email = f"musteri_{suf}@e2e.test"
        password = "e2eKapanisTest123!"

        # 1) Kayıt
        r = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": email,
                "password": password,
                "full_name": "E2E Müşteri",
                "phone": "+905551112233",
                "role": "customer",
            },
            format="json",
        )
        self.assertEqual(
            r.status_code,
            status.HTTP_201_CREATED,
            f"register: {getattr(r, 'data', r.content)}",
        )

        # 2) Token
        r = self.client.post(
            "/api/v1/auth/token/",
            {"email": email, "password": password},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        access = r.data["access"]
        self.assertTrue(access)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        # 3) Müsait slotlar (gelecek iş günü)
        tz = timezone.get_current_timezone()
        today = timezone.localdate(timezone=tz)
        test_day = _next_weekday_on_or_after(today)
        date_str = test_day.isoformat()

        r = self.client.get(
            "/api/v1/appointments/available-slots/",
            {
                "staff_id": self.staff.pk,
                "service_id": self.service.pk,
                "date": date_str,
                "slot_minutes": "15",
            },
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        slots = r.data.get("slots") or []
        self.assertGreater(
            len(slots),
            0,
            "Slot listesi boş; working_hours / tarih iş günü mü kontrol edin.",
        )
        starts_at = slots[0]["starts_at"]

        # 4) İlk randevu
        r = self.client.post(
            "/api/v1/appointments/",
            {
                "business": self.business.pk,
                "staff": self.staff.pk,
                "service": self.service.pk,
                "starts_at": starts_at,
                "customer_note": "e2e kapanış",
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)
        self.assertEqual(r.data.get("status"), "confirmed")
        self.assertIn("ends_at", r.data)

        # 5) Aynı zamanda ikinci randevu → çakışma
        r2 = self.client.post(
            "/api/v1/appointments/",
            {
                "business": self.business.pk,
                "staff": self.staff.pk,
                "service": self.service.pk,
                "starts_at": starts_at,
            },
            format="json",
        )
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST, r2.data)
        err = r2.data
        self.assertTrue(
            "__all__" in err or "non_field_errors" in err or "detail" in err,
            f"Beklenen doğrulama gövdesi: {err}",
        )
        if "__all__" in err:
            self.assertIn("randevu", str(err["__all__"]).lower())

        # 6) Randevularım
        r = self.client.get("/api/v1/appointments/me/")
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        results = r.data.get("results", [])
        self.assertGreaterEqual(len(results), 1)
