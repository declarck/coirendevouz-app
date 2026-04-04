"""2-BE-09: PATCH /users/me/ profil."""

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from users.models import User


@override_settings(
    ALLOWED_HOSTS=["testserver", "localhost", "127.0.0.1"],
)
class UsersMePatchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="me-patch@test.local",
            password="x",
            full_name="Eski Ad",
            phone="+90001",
            role=User.Role.CUSTOMER,
        )

    def test_patch_name_and_phone(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.patch(
            "/api/v1/users/me/",
            {"full_name": "Yeni Ad", "phone": "+905551112233"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["user"]["full_name"], "Yeni Ad")
        self.assertEqual(r.data["user"]["displayName"], "Yeni Ad")
        self.assertEqual(r.data["user"]["phone"], "+905551112233")
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, "Yeni Ad")

    def test_empty_400(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.patch("/api/v1/users/me/", {}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_requires_auth(self):
        r = self.client.patch(
            "/api/v1/users/me/",
            {"full_name": "X"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
