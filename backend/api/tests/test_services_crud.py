"""2-BE-03: işletme kapsamlı hizmet CRUD."""

from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from business.models import Business, Service
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
class BusinessServicesCrudTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="svc-owner@test.local",
            password="x",
            full_name="Owner",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.other = User.objects.create_user(
            email="svc-other@test.local",
            password="x",
            full_name="Other",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.customer = User.objects.create_user(
            email="svc-cust@test.local",
            password="x",
            full_name="Cust",
            role=User.Role.CUSTOMER,
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="Svc Test Salon",
            category=Business.Category.BARBER,
            address_line="A",
            city="Ankara",
            working_hours=_week_all_open(),
        )
        self.service = Service.objects.create(
            business=self.business,
            name="Mevcut kesim",
            duration_minutes=30,
            price=Decimal("400.00"),
            is_active=True,
        )

    def _url_list(self, bid=None):
        bid = bid if bid is not None else self.business.id
        return f"/api/v1/businesses/{bid}/services/"

    def _url_detail(self, sid, bid=None):
        bid = bid if bid is not None else self.business.id
        return f"/api/v1/businesses/{bid}/services/{sid}/"

    def test_list_requires_member(self):
        self.client.force_authenticate(user=self.other)
        r = self.client.get(self._url_list())
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_lists_services(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(self._url_list())
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(r.data["count"], 1)
        ids = [row["id"] for row in r.data["results"]]
        self.assertIn(self.service.id, ids)

    def test_customer_forbidden(self):
        self.client.force_authenticate(user=self.customer)
        r = self.client.get(self._url_list())
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_and_patch(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.post(
            self._url_list(),
            {
                "name": "Yeni boya",
                "duration_minutes": 60,
                "price": "1200.50",
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["name"], "Yeni boya")
        sid = r.data["id"]

        r2 = self.client.patch(
            self._url_detail(sid),
            {"is_active": False},
            format="json",
        )
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertFalse(r2.data["is_active"])

    def test_duplicate_name_400(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.post(
            self._url_list(),
            {
                "name": self.service.name,
                "duration_minutes": 20,
                "price": "100.00",
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(r.data["error"]["code"], "duplicate_service_name")

    def test_delete_soft(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.delete(self._url_detail(self.service.id))
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.service.refresh_from_db()
        self.assertFalse(self.service.is_active)

    def test_wrong_business_returns_404(self):
        other_b = Business.objects.create(
            owner=self.other,
            name="Başka salon",
            category=Business.Category.BARBER,
            address_line="B",
            city="İzmir",
            working_hours=_week_all_open(),
        )
        foreign = Service.objects.create(
            business=other_b,
            name="Yabancı",
            duration_minutes=15,
            price=Decimal("50.00"),
        )
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(self._url_detail(foreign.id, bid=self.business.id))
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)
