"""2-BE-06: GET işletme ajandası."""

from datetime import datetime
from decimal import Decimal
from urllib.parse import urlencode
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
class BusinessScheduleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="sch-owner@test.local",
            password="x",
            full_name="Owner",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.other = User.objects.create_user(
            email="sch-other@test.local",
            password="x",
            full_name="Other",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.customer = User.objects.create_user(
            email="sch-cust@test.local",
            password="x",
            full_name="Müşteri Ayşe",
            phone="+905551112233",
            role=User.Role.CUSTOMER,
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="Sch Salon",
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
            display_name="Mehmet",
            is_active=True,
        )
        StaffService.objects.create(
            staff=self.staff,
            service=self.service,
            is_active=True,
        )
        self.starts = datetime(2026, 4, 10, 10, 0, 0, tzinfo=IST)
        self.ends = datetime(2026, 4, 10, 10, 30, 0, tzinfo=IST)
        self.appt = Appointment.objects.create(
            business=self.business,
            customer=self.customer,
            staff=self.staff,
            service=self.service,
            starts_at=self.starts,
            ends_at=self.ends,
            status=Appointment.Status.CONFIRMED,
            source=Appointment.Source.CUSTOMER_APP,
        )

    def _url(self, business_id=None, extra=None):
        bid = business_id if business_id is not None else self.business.id
        extra = extra or {}
        q = urlencode(extra)
        return f"/api/v1/businesses/{bid}/schedule/?{q}"

    def test_requires_from_to(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(f"/api/v1/businesses/{self.business.id}/schedule/")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(r.data["error"]["code"], "missing_query_params")

    def test_owner_gets_appointment(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(
            self._url(extra={"from": "2026-04-10", "to": "2026-04-10"}),
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["business_id"], self.business.id)
        self.assertEqual(len(r.data["appointments"]), 1)
        row = r.data["appointments"][0]
        self.assertEqual(row["id"], self.appt.id)
        self.assertEqual(row["status"], "confirmed")
        self.assertEqual(row["service"]["name"], "Kesim")
        self.assertEqual(row["staff"]["display_name"], "Mehmet")
        self.assertEqual(row["customer"]["full_name"], "Müşteri Ayşe")
        self.assertEqual(row["customer"]["phone"], "+905551112233")

    def test_outside_range_empty(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(
            self._url(extra={"from": "2026-04-11", "to": "2026-04-12"}),
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["appointments"], [])

    def test_status_filter(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(
            self._url(
                extra={
                    "from": "2026-04-10",
                    "to": "2026-04-10",
                    "status": "cancelled",
                }
            ),
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["appointments"], [])

    def test_non_member_403(self):
        self.client.force_authenticate(user=self.other)
        r = self.client.get(
            self._url(extra={"from": "2026-04-10", "to": "2026-04-10"}),
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_id_filter(self):
        staff_other = Staff.objects.create(
            business=self.business,
            display_name="Veli",
            is_active=True,
        )
        self.client.force_authenticate(user=self.owner)
        r_empty = self.client.get(
            self._url(
                extra={
                    "from": "2026-04-10",
                    "to": "2026-04-10",
                    "staff_id": staff_other.id,
                }
            ),
        )
        self.assertEqual(r_empty.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r_empty.data["appointments"]), 0)

        r_one = self.client.get(
            self._url(
                extra={
                    "from": "2026-04-10",
                    "to": "2026-04-10",
                    "staff_id": self.staff.id,
                }
            ),
        )
        self.assertEqual(len(r_one.data["appointments"]), 1)

    def test_staff_id_unknown_400(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(
            f"/api/v1/businesses/{self.business.id}/schedule/"
            f"?from=2026-04-10&to=2026-04-10&staff_id=99999"
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(r.data["error"]["code"], "unknown_staff")
