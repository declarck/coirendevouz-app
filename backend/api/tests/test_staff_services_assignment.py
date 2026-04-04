"""2-BE-05: PUT personel–hizmet ataması."""

from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from business.models import Business, Service, Staff, StaffService
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
class StaffServicesAssignmentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="ssa-owner@test.local",
            password="x",
            full_name="Owner",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.other = User.objects.create_user(
            email="ssa-other@test.local",
            password="x",
            full_name="Other",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="SSA Salon",
            category=Business.Category.BARBER,
            address_line="A",
            city="Ankara",
            working_hours=_week_all_open(),
        )
        self.s1 = Service.objects.create(
            business=self.business,
            name="Kesim",
            duration_minutes=30,
            price=Decimal("300.00"),
            is_active=True,
        )
        self.s2 = Service.objects.create(
            business=self.business,
            name="Sakal",
            duration_minutes=15,
            price=Decimal("150.00"),
            is_active=True,
        )
        self.staff = Staff.objects.create(
            business=self.business,
            display_name="Personel",
            is_active=True,
        )

    def _url(self):
        return f"/api/v1/businesses/{self.business.id}/staff/{self.staff.id}/services/"

    def test_put_replaces_links(self):
        StaffService.objects.create(
            staff=self.staff,
            service=self.s1,
            is_active=True,
        )
        self.client.force_authenticate(user=self.owner)
        r = self.client.put(
            self._url(),
            {"service_ids": [self.s2.id]},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(set(r.data["service_ids"]), {self.s2.id})
        self.assertFalse(
            StaffService.objects.get(staff=self.staff, service=self.s1).is_active
        )
        self.assertTrue(
            StaffService.objects.get(staff=self.staff, service=self.s2).is_active
        )

    def test_put_empty_clears(self):
        StaffService.objects.create(
            staff=self.staff,
            service=self.s1,
            is_active=True,
        )
        self.client.force_authenticate(user=self.owner)
        r = self.client.put(self._url(), {"service_ids": []}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["service_ids"], [])
        self.assertFalse(
            StaffService.objects.get(staff=self.staff, service=self.s1).is_active
        )

    def test_invalid_service_id_400(self):
        self.client.force_authenticate(user=self.owner)
        r = self.client.put(
            self._url(),
            {"service_ids": [999999]},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(r.data["error"]["code"], "invalid_service_ids")

    def test_non_member_403(self):
        self.client.force_authenticate(user=self.other)
        r = self.client.put(
            self._url(),
            {"service_ids": [self.s1.id]},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_wrong_staff_404(self):
        other_b = Business.objects.create(
            owner=self.other,
            name="Diğer",
            category=Business.Category.BARBER,
            address_line="B",
            city="İzmir",
            working_hours=_week_all_open(),
        )
        foreign_staff = Staff.objects.create(
            business=other_b,
            display_name="X",
            is_active=True,
        )
        self.client.force_authenticate(user=self.owner)
        url = f"/api/v1/businesses/{self.business.id}/staff/{foreign_staff.id}/services/"
        r = self.client.put(url, {"service_ids": [self.s1.id]}, format="json")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)
