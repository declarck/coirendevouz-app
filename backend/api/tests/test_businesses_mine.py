"""2-BE-02: GET /api/v1/businesses/mine/"""

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from business.models import Business, Staff
from business.working_hours import WEEKDAYS
from users.models import User


def _week_all_open() -> dict:
    return {
        w: {"open": "09:00", "close": "18:00", "closed": False, "breaks": []}
        for w in WEEKDAYS
}


@override_settings(
    ALLOWED_HOSTS=["testserver", "localhost", "127.0.0.1"],
)
class BusinessesMineApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="mine-owner@test.local",
            password="x",
            full_name="Owner",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.staff_user = User.objects.create_user(
            email="mine-staff@test.local",
            password="x",
            full_name="Staff",
            role=User.Role.STAFF,
        )
        self.customer = User.objects.create_user(
            email="mine-cust@test.local",
            password="x",
            full_name="Cust",
            role=User.Role.CUSTOMER,
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="Mine Test Salon",
            category=Business.Category.BARBER,
            address_line="A",
            city="Ankara",
            working_hours=_week_all_open(),
        )
        Staff.objects.create(
            business=self.business,
            user=self.staff_user,
            display_name="Personel",
            is_active=True,
        )

    def test_requires_auth(self):
        r = self.client.get("/api/v1/businesses/mine/")
        self.assertEqual(r.status_code, 401)

    def test_customer_forbidden(self):
        self.client.force_authenticate(user=self.customer)
        r = self.client.get("/api/v1/businesses/mine/")
        self.assertEqual(r.status_code, 403)

    def test_owner_sees_business(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.get("/api/v1/businesses/mine/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["count"], 1)
        self.assertEqual(r.data["results"][0]["id"], self.business.id)
        self.assertEqual(r.data["results"][0]["name"], "Mine Test Salon")

    def test_staff_user_sees_business(self):
        self.client.force_authenticate(user=self.staff_user)
        r = self.client.get("/api/v1/businesses/mine/")
        self.assertEqual(r.status_code, 200)
        ids = [row["id"] for row in r.data["results"]]
        self.assertIn(self.business.id, ids)

    def test_business_admin_without_business_empty(self):
        lone = User.objects.create_user(
            email="lone-admin@test.local",
            password="x",
            full_name="Lone",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.client.force_authenticate(user=lone)
        r = self.client.get("/api/v1/businesses/mine/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["count"], 0)

    def test_superuser_sees_all_active_businesses(self):
        superu = User.objects.create_superuser(
            email="super-mine@test.local",
            password="x",
            full_name="Super",
        )
        other_owner = User.objects.create_user(
            email="other-owner@test.local",
            password="x",
            full_name="Other",
            role=User.Role.BUSINESS_ADMIN,
        )
        Business.objects.create(
            owner=other_owner,
            name="Başka Salon",
            category=Business.Category.BARBER,
            address_line="B",
            city="İstanbul",
            working_hours=_week_all_open(),
        )
        self.client.force_authenticate(user=superu)
        r = self.client.get("/api/v1/businesses/mine/")
        self.assertEqual(r.status_code, 200)
        ids = {row["id"] for row in r.data["results"]}
        self.assertIn(self.business.id, ids)
        self.assertGreaterEqual(r.data["count"], 2)
