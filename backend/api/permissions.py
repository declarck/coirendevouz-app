from rest_framework import permissions

from users.models import User


class IsCustomer(permissions.BasePermission):
    """Sadece giriş yapmış ve rolü müşteri olan kullanıcılar."""

    def has_permission(self, request, view):
        u = request.user
        return bool(
            u
            and u.is_authenticated
            and getattr(u, "role", None) == User.Role.CUSTOMER
        )
