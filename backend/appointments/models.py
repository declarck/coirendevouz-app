from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils.translation import gettext_lazy as _

from business.models import Business, Service, Staff, StaffService


class Appointment(models.Model):
    """Randevu; aynı personelde iptal edilmemiş aralıklar kesişemez."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Beklemede")
        CONFIRMED = "confirmed", _("Onaylandı")
        COMPLETED = "completed", _("Tamamlandı")
        CANCELLED = "cancelled", _("İptal")
        NO_SHOW = "no_show", _("Gelmedi")

    class Source(models.TextChoices):
        CUSTOMER_APP = "customer_app", _("Müşteri uygulaması")
        BUSINESS_MANUAL = "business_manual", _("İşletme (manuel)")

    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="appointments",
        verbose_name=_("işletme"),
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="customer_appointments",
        verbose_name=_("müşteri"),
    )
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name="appointments",
        verbose_name=_("personel"),
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="appointments",
        verbose_name=_("hizmet"),
    )
    starts_at = models.DateTimeField(_("başlangıç"), db_index=True)
    ends_at = models.DateTimeField(_("bitiş"), db_index=True)
    status = models.CharField(
        _("durum"),
        max_length=32,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    source = models.CharField(
        _("kaynak"),
        max_length=32,
        choices=Source.choices,
        default=Source.CUSTOMER_APP,
    )
    customer_note = models.TextField(_("müşteri notu"), blank=True)
    internal_note = models.TextField(_("işletme notu"), blank=True)
    created_at = models.DateTimeField(_("oluşturulma"), auto_now_add=True)
    updated_at = models.DateTimeField(_("güncellenme"), auto_now=True)

    class Meta:
        verbose_name = _("randevu")
        verbose_name_plural = _("randevular")
        ordering = ["-starts_at"]
        indexes = [
            models.Index(fields=["staff", "starts_at"]),
            models.Index(fields=["business", "starts_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.starts_at} — {self.staff.display_name} / {self.service.name}"

    def _effective_duration_minutes(self) -> int:
        if not self.staff_id or not self.service_id:
            raise ValidationError(
                _("Personel ve hizmet seçilmelidir.")
            )
        ss = StaffService.objects.filter(
            staff_id=self.staff_id,
            service_id=self.service_id,
            is_active=True,
        ).first()
        if ss and ss.duration_minutes_override is not None:
            return int(ss.duration_minutes_override)
        svc = Service.objects.filter(pk=self.service_id).first()
        if not svc:
            raise ValidationError(_("Hizmet bulunamadı."))
        return int(svc.duration_minutes)

    def _validate_fks_and_staff_service(self) -> None:
        if not all((self.business_id, self.staff_id, self.service_id)):
            return
        staff = Staff.objects.filter(pk=self.staff_id).first()
        service = Service.objects.filter(pk=self.service_id).first()
        if not staff or not service:
            raise ValidationError(_("Personel veya hizmet bulunamadı."))
        if staff.business_id != self.business_id:
            raise ValidationError(
                _("Seçilen personel bu işletmeye ait değil.")
            )
        if service.business_id != self.business_id:
            raise ValidationError(
                _("Seçilen hizmet bu işletmeye ait değil.")
            )
        if not StaffService.objects.filter(
            staff_id=self.staff_id,
            service_id=self.service_id,
            is_active=True,
        ).exists():
            raise ValidationError(
                _("Bu personel bu hizmeti veremiyor veya eşleşme pasif.")
            )

    def _ensure_ends_at(self) -> None:
        if self.ends_at is not None:
            return
        if not self.starts_at or not self.staff_id or not self.service_id:
            return
        mins = self._effective_duration_minutes()
        if mins < 1:
            raise ValidationError(
                _("Etkin süre en az 1 dakika olmalıdır.")
            )
        self.ends_at = self.starts_at + timedelta(minutes=mins)

    def _validate_time_order(self) -> None:
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError(
                {"ends_at": _("Bitiş saati başlangıçtan sonra olmalıdır.")}
            )

    def _blocking_overlap_exists(self) -> bool:
        if (
            not self.staff_id
            or not self.starts_at
            or not self.ends_at
            or self.status == self.Status.CANCELLED
        ):
            return False
        qs = Appointment.objects.filter(staff_id=self.staff_id).exclude(
            status=self.Status.CANCELLED
        )
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        return qs.filter(
            starts_at__lt=self.ends_at,
            ends_at__gt=self.starts_at,
        ).exists()

    def clean(self) -> None:
        super().clean()
        self._validate_fks_and_staff_service()
        self._ensure_ends_at()
        self._validate_time_order()
        if self._blocking_overlap_exists():
            raise ValidationError(
                _("Bu personel için seçilen aralıkta başka bir randevu var.")
            )

    def save(self, *args, **kwargs) -> None:
        with transaction.atomic():
            if self.staff_id:
                try:
                    Staff.objects.select_for_update().get(pk=self.staff_id)
                except Staff.DoesNotExist as exc:
                    raise ValidationError(_("Personel bulunamadı.")) from exc
            # full_clean öncesi alan doğrulaması ends_at ister; süre model.clean'da hesaplanır.
            self._ensure_ends_at()
            self.full_clean()
            super().save(*args, **kwargs)
