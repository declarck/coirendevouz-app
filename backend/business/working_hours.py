"""
Çalışma saatleri JSON şeması — documentation/DATA-MODEL.md §4.

İşletme: tam hafta (monday…sunday) zorunlu.
Personel: None veya {} → işletme saatleri; dolu ise aynı şema (tam hafta).
"""

from __future__ import annotations

import datetime as dt
import re
from typing import Any

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

WEEKDAYS: tuple[str, ...] = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)

_HHMM = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
_DATE_ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _hhmm_to_minutes(value: str) -> int:
    h, m = value.split(":")
    return int(h) * 60 + int(m)


def _validate_hhmm(label: str, value: Any) -> str:
    if not isinstance(value, str) or not _HHMM.match(value):
        raise ValidationError(
            _("%(label)s geçerli HH:MM formatında olmalıdır (örn. 09:00).")
            % {"label": label}
        )
    return value


def _validate_breaks(
    breaks: Any,
    open_m: int,
    close_m: int,
    day_label: str,
) -> None:
    if breaks is None:
        return
    if not isinstance(breaks, list):
        raise ValidationError(
            {day_label: _("breaks bir liste olmalıdır.")}
        )
    for i, br in enumerate(breaks):
        if not isinstance(br, dict):
            raise ValidationError(
                {day_label: _("breaks[%(i)s] bir nesne olmalıdır.") % {"i": i}}
            )
        start = _validate_hhmm(_("Mola başlangıcı"), br.get("start"))
        end = _validate_hhmm(_("Mola bitişi"), br.get("end"))
        sm = _hhmm_to_minutes(start)
        em = _hhmm_to_minutes(end)
        if sm >= em:
            raise ValidationError(
                {day_label: _("Molada başlangıç bitişten önce olmalıdır.")}
            )
        if sm < open_m or em > close_m:
            raise ValidationError(
                {
                    day_label: _(
                        "Mola çalışma aralığı dışında olamaz (%(day)s)."
                    )
                    % {"day": day_label}
                }
            )


def _validate_day(day_key: str, day: Any) -> None:
    if not isinstance(day, dict):
        raise ValidationError(
            {day_key: _("Gün değeri bir nesne olmalıdır.")}
        )
    allowed = {"open", "close", "closed", "breaks"}
    extra = set(day.keys()) - allowed
    if extra:
        raise ValidationError(
            {
                day_key: _("Bilinmeyen alanlar: %(fields)s")
                % {"fields": ", ".join(sorted(extra))}
            }
        )

    if day.get("closed") is True:
        return

    open_v = _validate_hhmm(_("Açılış"), day.get("open"))
    close_v = _validate_hhmm(_("Kapanış"), day.get("close"))
    open_m = _hhmm_to_minutes(open_v)
    close_m = _hhmm_to_minutes(close_v)
    if open_m >= close_m:
        raise ValidationError(
            {day_key: _("Açılış saati kapanıştan önce olmalıdır.")}
        )
    _validate_breaks(day.get("breaks"), open_m, close_m, day_key)


def validate_working_hours(
    data: Any,
    *,
    require_full_week: bool,
) -> dict[str, Any]:
    """
    Şemayı doğrular; geçerli dict döner.

    *require_full_week*: True ise tüm gün anahtarları zorunlu (işletme).
    """
    if data is None:
        raise ValidationError(_("Çalışma saatleri (JSON) boş olamaz."))
    if not isinstance(data, dict):
        raise ValidationError(_("Çalışma saatleri bir JSON nesnesi olmalıdır."))

    extra = set(data.keys()) - set(WEEKDAYS)
    if extra:
        raise ValidationError(
            _("Bilinmeyen gün anahtarları: %(keys)s")
            % {"keys": ", ".join(sorted(extra))}
        )

    if require_full_week:
        missing = set(WEEKDAYS) - set(data.keys())
        if missing:
            raise ValidationError(
                _("Eksik günler: %(days)s")
                % {"days": ", ".join(sorted(missing))}
            )

    for key in data:
        _validate_day(key, data[key])

    return data


def validate_business_working_hours(data: Any) -> dict[str, Any]:
    """İşletme: tam hafta şeması zorunlu."""
    if data in (None, {}):
        raise ValidationError(
            _("İşletme için çalışma saatleri (tüm günler) tanımlanmalıdır.")
        )
    return validate_working_hours(data, require_full_week=True)


def validate_staff_working_hours(data: Any) -> None:
    """
    Personel: None veya {} → işletme ile devralınır (doğrulama yok).
    Dolu sözlük → tam hafta şeması.
    """
    if data is None or data == {}:
        return
    validate_working_hours(data, require_full_week=True)


def validate_staff_working_hours_exceptions(data: Any) -> None:
    """
    Personel: izin / özel gün vb. için YYYY-MM-DD bazlı istisnalar (liste).
    Boş veya None → doğrulama yok.
    """
    if data in (None, []):
        return
    if not isinstance(data, list):
        raise ValidationError(_("İstisnalar bir liste olmalıdır."))

    seen: set[str] = set()
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValidationError(_("İstisna[%(i)s] bir nesne olmalıdır.") % {"i": i})
        date_v = item.get("date")
        if not isinstance(date_v, str) or not _DATE_ISO.match(date_v):
            raise ValidationError(
                _("İstisna[%(i)s].date YYYY-MM-DD biçiminde olmalıdır.")
                % {"i": i}
            )
        if date_v in seen:
            raise ValidationError(
                _("Aynı tarih iki kez tanımlanamaz: %(d)s") % {"d": date_v}
            )
        seen.add(date_v)
        allowed = {"date", "closed", "open", "close", "breaks"}
        extra = set(item.keys()) - allowed
        if extra:
            raise ValidationError(
                _("İstisna[%(i)s]: bilinmeyen alanlar: %(fields)s")
                % {"i": i, "fields": ", ".join(sorted(extra))}
            )
        if item.get("closed") is True:
            continue
        day_payload = {k: v for k, v in item.items() if k != "date"}
        _validate_day(f"exception[{i}]", day_payload)


def resolve_effective_working_hours(staff: Any) -> dict[str, Any]:
    """
    Personelde özel saat yoksa işletme saatlerini döndürür.
    """
    from business.models import Staff

    if not isinstance(staff, Staff):
        raise TypeError("Staff örneği gerekli.")

    raw = staff.working_hours
    if raw is None or raw == {}:
        return dict(staff.business.working_hours or {})
    return dict(raw)


def get_staff_day_config_for_date(staff: Any, day: dt.date) -> dict[str, Any] | None:
    """
    Belirli bir takvim günü için etkin gün yapılandırması.

    Önce `working_hours_exceptions` içinde aynı tarih varsa o kullanılır;
    yoksa haftalık şablondan (personel veya işletme) ilgili gün seçilir.
    """
    from business.models import Staff

    if not isinstance(staff, Staff):
        raise TypeError("Staff örneği gerekli.")

    raw_exc = getattr(staff, "working_hours_exceptions", None)
    if isinstance(raw_exc, list):
        for item in raw_exc:
            if not isinstance(item, dict):
                continue
            if item.get("date") != day.isoformat():
                continue
            if item.get("closed") is True:
                return {"closed": True}
            cfg = {k: v for k, v in item.items() if k != "date"}
            if cfg.get("closed") is True:
                return {"closed": True}
            return cfg

    hours = resolve_effective_working_hours(staff)
    wkey = WEEKDAYS[day.weekday()]
    return hours.get(wkey)
