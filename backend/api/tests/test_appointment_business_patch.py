"""2-BE-08: PATCH randevu (işletme)."""

from datetime import datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from appointments.models import Appointment
from business.models import Business, Service, Staff, StaffService
from business.working_hours import WEEKDAYS
from users.models import User

IST = ZoneInfo("Europe/Istanbul")


def _week_all_open() -> dict:
    return {
        w: {"open": "09:00", "close": "18:00", "closed": False, "breaks": []}
        for w in WEEKDAYS
}


@override_settings(
    ALLOWED_HOSTS=["testserver", "localhost", "127.0.0.1"],
)
class AppointmentBusinessPatchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="patch-owner@test.local",
            password="x",
            full_name="Owner",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.other = User.objects.create_user(
            email="patch-other@test.local",
            password="x",
            full_name="Other",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.customer = User.objects.create_user(
            email="patch-cust@test.local",
            password="x",
            full_name="Müşteri",
            role=User.Role.CUSTOMER,
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="Patch Salon",
            category=Business.Category.BARBER,
            address_line="A",
            city="Ankara",
            working_hours=_week_all_open(),
        )
        self.service = Service.objects.create(
            business=self.business,
            name="Kesim",
            duration_minutes=30,
            price=Decimal("300.00"),
            is_active=True,
        )
        self.staff = Staff.objects.create(
            business=self.business,
            display_name="Personel",
            is_active=True,
        )
        StaffService.objects.create(
            staff=self.staff,
            service=self.service,
            is_active=True,
        )
        self.t0 = datetime(2026, 8, 1, 14, 0, 0, tzinfo=IST)
        self.appt = Appointment.objects.create(
            business=self.business,
            customer=self.customer,
            staff=self.staff,
            service=self.service,
            starts_at=self.t0,
            ends_at=self.t0 + timedelta(minutes=30),
            status=Appointment.Status.CONFIRMED,
            source=Appointment.Source.CUSTOMER_APP,
        )

    def _url(self, pk=None):
        aid = pk if pk is not None else self.appt.id
        return f"/api/v1/appointments/{aid}/"

    def test_owner_get_ok(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(self._url())
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["id"], self.appt.id)
        self.assertEqual(r.data["business_id"], self.business.id)
        self.assertEqual(r.data["status"], "confirmed")
        self.assertIn("internal_note", r.data)

    def test_owner_sets_completed(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.patch(
            self._url(),
            {"status": "completed"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["status"], "completed")
        self.assertIn("internal_note", r.data)

    def test_stranger_get_403(self):
        self.client.force_authenticate(user=self.other)
        r = self.client.get(self._url())
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_stranger_403(self):
        self.client.force_authenticate(user=self.other)
        r = self.client.patch(
            self._url(),
            {"status": "cancelled"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_customer_cannot_patch_403(self):
        self.client.force_authenticate(user=self.customer)
        r = self.client.patch(
            self._url(),
            {"status": "cancelled"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_unknown_404(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.patch(
            self._url(pk=999999),
            {"status": "cancelled"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_empty_body_400(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.patch(self._url(), {}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
