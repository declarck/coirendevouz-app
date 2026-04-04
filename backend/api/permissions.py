from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from rest_framework import permissions

from business.models import Business, Staff
from users.models import User


def user_has_business_access(user: User, business_id: int) -> bool:
    """
    İşletme paneli kapsamı: sahip veya o işletmeye bağlı (aktif) personel kullanıcısı.
    Süper kullanıcı geliştirme / destek için tam yetki (üretimde kısıtlanabilir).
    """
    if not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    if Business.objects.filter(pk=business_id, owner_id=user.pk).exists():
        return True
    return Staff.objects.filter(
        business_id=business_id,
        user_id=user.pk,
        is_active=True,
    ).exists()


class IsCustomer(permissions.BasePermission):
    """Sadece giriş yapmış ve rolü müşteri olan kullanıcılar."""

    def has_permission(self, request, view):
        u = request.user
        return bool(
            u
            and u.is_authenticated
            and getattr(u, "role", None) == User.Role.CUSTOMER
        )


class IsBusinessPanelUser(permissions.BasePermission):
    """
    İşletme paneli API'leri için giriş + rol (business_admin veya staff).
    İşletme bazlı yetki gerektirmeyen uçlarda (ör. GET /businesses/mine/) kullanılır.
    """

    message = _("İşletme paneli için yetkiniz yok.")

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if u.is_superuser:
            return True
        return u.role in (User.Role.BUSINESS_ADMIN, User.Role.STAFF)


class IsBusinessMember(permissions.BasePermission):
    """
    URL'de `business_id` (veya `business_pk`) ile işletme; kullanıcı sahip veya o işletmenin personeli.
    """

    message = _("Bu işletme için yetkiniz yok.")

    def has_permission(self, request, view):
        u = request.user
        if not u.is_authenticated:
            return False
        raw = None
        if hasattr(view, "kwargs") and view.kwargs:
            raw = view.kwargs.get("business_id") or view.kwargs.get("business_pk")
        if raw is None:
            return False
        try:
            business_id = int(raw)
        except (TypeError, ValueError):
            return False
        return user_has_business_access(u, business_id)


class IsBusinessMemberForAppointment(permissions.BasePermission):
    """
    Randevunun `business_id` için `user_has_business_access` (sahip veya personel).
    `has_object_permission` ile kullanılır.
    """

    message = _("Bu randevu için yetkiniz yok.")

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        bid = getattr(obj, "business_id", None)
        if bid is None:
            return False
        return user_has_business_access(request.user, bid)


class IsBusinessMemberForAppointment(permissions.BasePermission):
    """
    Randevunun `business_id` için `user_has_business_access` (sahip veya personel).
    `has_object_permission` ile kullanılır.
    """

    message = _("Bu randevu için yetkiniz yok.")

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        bid = getattr(obj, "business_id", None)
        if bid is None:
            return False
        return user_has_business_access(request.user, bid)
