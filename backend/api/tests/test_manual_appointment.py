"""2-BE-07: POST manuel randevu."""

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
class ManualAppointmentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="man-owner@test.local",
            password="x",
            full_name="Owner",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.other = User.objects.create_user(
            email="man-other@test.local",
            password="x",
            full_name="Other",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.customer = User.objects.create_user(
            email="man-cust@test.local",
            password="x",
            full_name="Müşteri",
            role=User.Role.CUSTOMER,
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="Man Salon",
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
        self.t0 = datetime(2026, 6, 15, 11, 0, 0, tzinfo=IST)

    def _url(self, bid=None):
        b = bid if bid is not None else self.business.id
        return f"/api/v1/businesses/{b}/appointments/manual/"

    def _body(self, starts_at=None, customer_id=None):
        return {
            "staff_id": self.staff.id,
            "service_id": self.service.id,
            "starts_at": (starts_at or self.t0).isoformat(),
            "customer_user_id": customer_id or self.customer.id,
            "internal_note": "Aradı",
        }

    def test_creates_confirmed_manual(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.post(self._url(), self._body(), format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["source"], "business_manual")
        self.assertEqual(r.data["status"], "confirmed")
        self.assertEqual(r.data["internal_note"], "Aradı")
        self.assertEqual(Appointment.objects.count(), 1)

    def test_non_member_403(self):
        self.client.force_authenticate(user=self.other)
        r = self.client.post(self._url(), self._body(), format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_customer_target_400(self):
        self.client.force_authenticate(user=self.owner)
        body = self._body()
        body["customer_user_id"] = self.owner.id
        r = self.client.post(self._url(), body, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_overlap_400(self):
        Appointment.objects.create(
            business=self.business,
            customer=self.customer,
            staff=self.staff,
            service=self.service,
            starts_at=self.t0,
            ends_at=self.t0 + timedelta(minutes=30),
            status=Appointment.Status.CONFIRMED,
            source=Appointment.Source.CUSTOMER_APP,
        )
        self.client.force_authenticate(user=self.owner)
        r = self.client.post(self._url(), self._body(), format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(r.data["error"]["code"], "validation_error")
