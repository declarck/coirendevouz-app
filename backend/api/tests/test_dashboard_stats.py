"""GET işletme özet istatistikleri — dashboard-stats."""

from datetime import datetime, time, timedelta
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
class BusinessDashboardStatsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="dash-owner@test.local",
            password="x",
            full_name="Owner",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.customer = User.objects.create_user(
            email="dash-cust@test.local",
            password="x",
            full_name="Müşteri",
            role=User.Role.CUSTOMER,
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="Dash Salon",
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
            display_name="Ali",
            is_active=True,
            working_hours_exceptions=[],
        )
        StaffService.objects.create(
            staff=self.staff,
            service=self.service,
            is_active=True,
        )

    def _url(self, business_id=None):
        bid = business_id if business_id is not None else self.business.id
        return f"/api/v1/businesses/{bid}/dashboard-stats/"

    def test_requires_auth(self):
        r = self.client.get(self._url())
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_structure(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(self._url())
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.data
        self.assertEqual(data["business_id"], self.business.id)
        self.assertIn("past", data)
        self.assertIn("future", data)
        self.assertIn("upcoming_leave", data)
        self.assertIn("yesterday", data["past"])
        self.assertIn("last_7_days", data["past"])
        self.assertIn("daily", data["past"]["last_7_days"])
        self.assertEqual(len(data["past"]["last_7_days"]["daily"]), 7)
        self.assertEqual(data["future"]["days"], 14)

    def test_future_counts_appointment(self):
        tomorrow = datetime.now(IST).date() + timedelta(days=1)
        starts = datetime.combine(tomorrow, time(10, 0), tzinfo=IST)
        ends = datetime.combine(tomorrow, time(10, 30), tzinfo=IST)
        Appointment.objects.create(
            business=self.business,
            customer=self.customer,
            staff=self.staff,
            service=self.service,
            starts_at=starts,
            ends_at=ends,
            status=Appointment.Status.CONFIRMED,
            source=Appointment.Source.CUSTOMER_APP,
        )
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(self._url())
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(r.data["future"]["total"], 1)
        names = [x["display_name"] for x in r.data["future"]["by_staff"]]
        self.assertIn("Ali", names)

    def test_upcoming_leave_list(self):
        leave_day = datetime.now(IST).date() + timedelta(days=5)
        self.staff.working_hours_exceptions = [
            {"date": leave_day.isoformat(), "closed": True},
        ]
        self.staff.save(update_fields=["working_hours_exceptions"])
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(self._url())
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        dates = [x["date"] for x in r.data["upcoming_leave"]]
        self.assertIn(leave_day.isoformat(), dates)
