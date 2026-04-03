from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError(_("E-posta adresi zorunludur."))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.BUSINESS_ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Süper kullanıcı için is_staff=True olmalı."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Süper kullanıcı için is_superuser=True olmalı."))

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """E-posta ile giriş; rol: müşteri, işletme yöneticisi, personel."""

    class Role(models.TextChoices):
        CUSTOMER = "customer", _("Müşteri")
        BUSINESS_ADMIN = "business_admin", _("İşletme yöneticisi")
        STAFF = "staff", _("Personel")

    username = None
    email = models.EmailField(_("e-posta"), unique=True)
    full_name = models.CharField(_("ad soyad"), max_length=255)
    phone = models.CharField(_("telefon"), max_length=32, blank=True)
    role = models.CharField(
        _("rol"),
        max_length=32,
        choices=Role.choices,
        default=Role.CUSTOMER,
        db_index=True,
    )
    created_at = models.DateTimeField(_("oluşturulma"), auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = ["full_name"]

    objects = UserManager()

    class Meta:
        verbose_name = _("kullanıcı")
        verbose_name_plural = _("kullanıcılar")

    def __str__(self) -> str:
        return f"{self.email} ({self.get_role_display()})"

    def get_full_name(self) -> str:
        return self.full_name.strip() or self.email
