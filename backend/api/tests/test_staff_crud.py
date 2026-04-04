"""2-BE-04: işletme kapsamlı personel CRUD."""

from django.test import TestCase, override_settings
from rest_framework import status
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
class BusinessStaffCrudTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="stf-owner@test.local",
            password="x",
            full_name="Owner",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.other = User.objects.create_user(
            email="stf-other@test.local",
            password="x",
            full_name="Other",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.customer = User.objects.create_user(
            email="stf-cust@test.local",
            password="x",
            full_name="Cust",
            role=User.Role.CUSTOMER,
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="Stf Test Salon",
            category=Business.Category.BARBER,
            address_line="A",
            city="Ankara",
            working_hours=_week_all_open(),
        )
        self.staff_row = Staff.objects.create(
            business=self.business,
            display_name="Ali",
            is_active=True,
        )

    def _url_list(self, bid=None):
        bid = bid if bid is not None else self.business.id
        return f"/api/v1/businesses/{bid}/staff/"

    def _url_detail(self, pk, bid=None):
        bid = bid if bid is not None else self.business.id
        return f"/api/v1/businesses/{bid}/staff/{pk}/"

    def test_list_requires_member(self):
        self.client.force_authenticate(user=self.other)
        r = self.client.get(self._url_list())
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_lists_staff(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(self._url_list())
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        ids = [row["id"] for row in r.data["results"]]
        self.assertIn(self.staff_row.id, ids)

    def test_customer_forbidden(self):
        self.client.force_authenticate(user=self.customer)
        r = self.client.get(self._url_list())
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_and_patch(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.post(
            self._url_list(),
            {"display_name": "Veli"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["display_name"], "Veli")
        pk = r.data["id"]

        r2 = self.client.patch(
            self._url_detail(pk),
            {"is_active": False},
            format="json",
        )
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertFalse(r2.data["is_active"])

    def test_delete_soft(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.delete(self._url_detail(self.staff_row.id))
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.staff_row.refresh_from_db()
        self.assertFalse(self.staff_row.is_active)

    def test_wrong_business_returns_404(self):
        other_b = Business.objects.create(
            owner=self.other,
            name="Başka",
            category=Business.Category.BARBER,
            address_line="B",
            city="İzmir",
            working_hours=_week_all_open(),
        )
        foreign = Staff.objects.create(
            business=other_b,
            display_name="Yabancı",
            is_active=True,
        )
        self.client.force_authenticate(user=self.owner)
        r = self.client.get(self._url_detail(foreign.id, bid=self.business.id))
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)
