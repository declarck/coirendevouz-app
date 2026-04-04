"""Personel çalışma saati istisnaları ve günlük çözümleme."""

import datetime as dt

from django.core.exceptions import ValidationError
from django.test import TestCase

from business.models import Business, Staff
from business.working_hours import WEEKDAYS, get_staff_day_config_for_date, validate_staff_working_hours_exceptions


def _week_all_open() -> dict:
    return {
        w: {"open": "09:00", "close": "18:00", "closed": False, "breaks": []}
        for w in WEEKDAYS
    }


class StaffWorkingHoursExceptionsTests(TestCase):
    def setUp(self):
        from users.models import User

        self.owner = User.objects.create_user(
            email="exc-owner@test.local",
            password="x",
            full_name="Owner",
            role=User.Role.BUSINESS_ADMIN,
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="Exc Salon",
            category=Business.Category.BARBER,
            address_line="A",
            city="Ankara",
            working_hours=_week_all_open(),
        )
        self.staff = Staff.objects.create(
            business=self.business,
            display_name="Veli",
            is_active=True,
        )

    def test_validate_duplicate_date_raises(self):
        with self.assertRaises(ValidationError):
            validate_staff_working_hours_exceptions(
                [
                    {"date": "2026-06-01", "closed": True},
                    {"date": "2026-06-01", "open": "10:00", "close": "12:00"},
                ]
            )

    def test_exception_closed_overrides_weekday(self):
        self.staff.working_hours_exceptions = [{"date": "2026-06-03", "closed": True}]
        self.staff.save()
        d = dt.date(2026, 6, 3)  # Wednesday
        cfg = get_staff_day_config_for_date(self.staff, d)
        self.assertEqual(cfg, {"closed": True})

    def test_exception_custom_hours(self):
        self.staff.working_hours_exceptions = [
            {"date": "2026-06-04", "open": "10:00", "close": "14:00", "closed": False, "breaks": []}
        ]
        self.staff.save()
        d = dt.date(2026, 6, 4)
        cfg = get_staff_day_config_for_date(self.staff, d)
        self.assertEqual(cfg["open"], "10:00")
        self.assertEqual(cfg["close"], "14:00")

    def test_no_exception_uses_effective_template(self):
        d = dt.date(2026, 6, 2)  # Tuesday
        cfg = get_staff_day_config_for_date(self.staff, d)
        self.assertEqual(cfg["open"], "09:00")
