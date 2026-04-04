from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


class Business(models.Model):
    """Kuaför / berber / güzellik merkezi işletmesi."""

    class Category(models.TextChoices):
        BARBER = "barber", _("Berber")
        HAIR_SALON = "hair_salon", _("Kuaför")
        BEAUTY_CENTER = "beauty_center", _("Güzellik merkezi")

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owned_businesses",
        verbose_name=_("işletme yetkilisi"),
    )
    name = models.CharField(_("işletme adı"), max_length=255)
    slug = models.SlugField(_("kısa ad (URL)"), max_length=255, unique=True, blank=True)
    category = models.CharField(
        _("kategori"),
        max_length=32,
        choices=Category.choices,
        db_index=True,
    )
    description = models.TextField(_("açıklama"), blank=True)
    address_line = models.CharField(_("adres satırı"), max_length=512)
    city = models.CharField(_("il / şehir"), max_length=128, db_index=True)
    district = models.CharField(_("ilçe"), max_length=128, blank=True)
    latitude = models.DecimalField(
        _("enlem"),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        _("boylam"),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    working_hours = models.JSONField(
        _("çalışma saatleri"),
        default=dict,
        help_text=_("Haftalık şablon — documentation/DATA-MODEL.md §4"),
    )
    timezone = models.CharField(
        _("saat dilimi"),
        max_length=64,
        default="Europe/Istanbul",
        blank=True,
    )
    is_active = models.BooleanField(_("yayında"), default=True, db_index=True)
    created_at = models.DateTimeField(_("oluşturulma"), auto_now_add=True)
    updated_at = models.DateTimeField(_("güncellenme"), auto_now=True)

    class Meta:
        verbose_name = _("işletme")
        verbose_name_plural = _("işletmeler")
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def clean(self):
        super().clean()
        from .working_hours import validate_business_working_hours

        validate_business_working_hours(self.working_hours)

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)[:200] or "isletme"
            candidate = base
            n = 0
            while (
                Business.objects.filter(slug=candidate)
                .exclude(pk=self.pk)
                .exists()
            ):
                n += 1
                candidate = f"{base}-{n}"
            self.slug = candidate
        super().save(*args, **kwargs)


class Service(models.Model):
    """İşletme hizmet kataloğu (süre ve fiyat slot hesabı için kullanılır)."""

    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="services",
        verbose_name=_("işletme"),
    )
    name = models.CharField(_("hizmet adı"), max_length=255)
    duration_minutes = models.PositiveIntegerField(_("süre (dakika)"))
    price = models.DecimalField(_("fiyat"), max_digits=10, decimal_places=2)
    is_active = models.BooleanField(_("aktif"), default=True, db_index=True)

    class Meta:
        verbose_name = _("hizmet")
        verbose_name_plural = _("hizmetler")
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["business", "name"],
                name="unique_service_name_per_business",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.business.name} — {self.name}"

    def clean(self):
        super().clean()
        if self.duration_minutes is not None and self.duration_minutes < 1:
            raise ValidationError(
                {"duration_minutes": _("Süre en az 1 dakika olmalıdır.")}
            )


class Staff(models.Model):
    """İşletme personeli; isteğe bağlı kullanıcı hesabı."""

    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="staff_members",
        verbose_name=_("işletme"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_profiles",
        verbose_name=_("kullanıcı hesabı"),
    )
    display_name = models.CharField(_("görünen ad"), max_length=255)
    working_hours = models.JSONField(
        _("çalışma saatleri"),
        null=True,
        blank=True,
        help_text=_("Boşsa işletme saatleri geçerlidir."),
    )
    working_hours_exceptions = models.JSONField(
        _("çalışma saati istisnaları"),
        null=True,
        blank=True,
        default=list,
        help_text=_(
            "Belirli tarihlerde izin veya farklı saat (YYYY-MM-DD). "
            "Haftalık şablonu geçersiz kılar."
        ),
    )
    is_active = models.BooleanField(_("aktif"), default=True, db_index=True)
    services = models.ManyToManyField(
        Service,
        through="StaffService",
        related_name="staff_links",
        verbose_name=_("verebildiği hizmetler"),
    )

    class Meta:
        verbose_name = _("personel")
        verbose_name_plural = _("personel")
        ordering = ["display_name"]

    def __str__(self) -> str:
        return f"{self.display_name} ({self.business.name})"

    def clean(self):
        super().clean()
        from .working_hours import (
            validate_staff_working_hours,
            validate_staff_working_hours_exceptions,
        )

        validate_staff_working_hours(self.working_hours)
        validate_staff_working_hours_exceptions(self.working_hours_exceptions)

    def get_effective_working_hours(self) -> dict:
        from .working_hours import resolve_effective_working_hours

        return resolve_effective_working_hours(self)


class StaffService(models.Model):
    """Hangi personelin hangi hizmeti verebildiği (M2M ara tablo)."""

    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name="staff_services",
        verbose_name=_("personel"),
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="staff_services",
        verbose_name=_("hizmet"),
    )
    duration_minutes_override = models.PositiveIntegerField(
        _("süre geçersiz kılma (dakika)"),
        null=True,
        blank=True,
        help_text=_("Boşsa hizmetin varsayılan süresi kullanılır."),
    )
    is_active = models.BooleanField(_("aktif"), default=True)

    class Meta:
        verbose_name = _("personel–hizmet")
        verbose_name_plural = _("personel–hizmetler")
        constraints = [
            models.UniqueConstraint(
                fields=["staff", "service"],
                name="unique_staff_service",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.staff.display_name} ↔ {self.service.name}"

    def clean(self):
        super().clean()
        if self.staff_id and self.service_id:
            if self.staff.business_id != self.service.business_id:
                raise ValidationError(
                    _("Personel ve hizmet aynı işletmeye ait olmalıdır.")
                )
        if (
            self.duration_minutes_override is not None
            and self.duration_minutes_override < 1
        ):
            raise ValidationError(
                {
                    "duration_minutes_override": _(
                        "Geçersiz kılma süresi en az 1 dakika olmalıdır."
                    )
                }
            )
