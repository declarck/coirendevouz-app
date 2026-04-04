"""2-BE-01: işletme kapsamı ve panel rolleri."""

from django.test import TestCase

from api.permissions import user_has_business_access
from business.models import Business, Staff
from users.models import User


class UserHasBusinessAccessTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="owner@test.local",
            password="x",
            full_name="Owner",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.other_admin = User.objects.create_user(
            email="other@test.local",
            password="x",
            full_name="Other",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.staff_user = User.objects.create_user(
            email="staff@test.local",
            password="x",
            full_name="Staff User",
            role=User.Role.STAFF,
        )
        self.customer = User.objects.create_user(
            email="cust@test.local",
            password="x",
            full_name="Cust",
            role=User.Role.CUSTOMER,
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="Test Salon",
            category=Business.Category.BARBER,
            address_line="A",
            city="Ankara",
            working_hours={
                w: {"open": "09:00", "close": "18:00", "closed": False, "breaks": []}
                for w in (
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                )
            },
        )
        self.staff = Staff.objects.create(
            business=self.business,
            user=self.staff_user,
            display_name="Personel",
            is_active=True,
        )

    def test_owner_has_access(self):
        self.assertTrue(
            user_has_business_access(self.owner, self.business.pk),
        )

    def test_staff_linked_user_has_access(self):
        self.assertTrue(
            user_has_business_access(self.staff_user, self.business.pk),
        )

    def test_other_business_admin_denied(self):
        self.assertFalse(
            user_has_business_access(self.other_admin, self.business.pk),
        )

    def test_customer_denied(self):
        self.assertFalse(
            user_has_business_access(self.customer, self.business.pk),
        )

    def test_staff_without_user_link_denied(self):
        lone = User.objects.create_user(
            email="lone@test.local",
            password="x",
            full_name="Lone",
            role=User.Role.STAFF,
        )
        self.assertFalse(
            user_has_business_access(lone, self.business.pk),
        )
