from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from business.working_hours import validate_business_working_hours, validate_working_hours


class WorkingHoursSchemaTests(SimpleTestCase):
    def test_valid_full_week(self):
        data = {
            "monday": {"open": "09:00", "close": "19:00", "closed": False, "breaks": []},
            "tuesday": {"open": "09:00", "close": "19:00", "closed": False, "breaks": []},
            "wednesday": {"closed": True},
            "thursday": {"open": "09:00", "close": "19:00", "closed": False, "breaks": []},
            "friday": {"open": "09:00", "close": "19:00", "closed": False, "breaks": []},
            "saturday": {"open": "10:00", "close": "18:00", "closed": False, "breaks": []},
            "sunday": {"closed": True},
        }
        out = validate_working_hours(data, require_full_week=True)
        self.assertEqual(out, data)

    def test_missing_day_raises(self):
        data = {
            "monday": {"closed": True},
        }
        with self.assertRaises(ValidationError):
            validate_working_hours(data, require_full_week=True)

    def test_business_empty_raises(self):
        with self.assertRaises(ValidationError):
            validate_business_working_hours({})
