"""
Müsait slot hesaplama — işletme TZ, çalışma saatleri, molalar, mevcut randevular.
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from typing import Any
from zoneinfo import ZoneInfo

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from appointments.models import Appointment
from business.models import Service, Staff, StaffService
from business.working_hours import get_staff_day_config_for_date


def _effective_duration_minutes(staff: Staff, service: Service) -> int:
    ss = StaffService.objects.filter(
        staff=staff,
        service=service,
        is_active=True,
    ).first()
    if ss and ss.duration_minutes_override is not None:
        return int(ss.duration_minutes_override)
    return int(service.duration_minutes)


def _combine_local(
    d: dt.date,
    hhmm: str,
    tz: ZoneInfo,
) -> dt.datetime:
    h, m = map(int, hhmm.split(":"))
    return dt.datetime(d.year, d.month, d.day, h, m, tzinfo=tz)


def _subtract_block(
    start: dt.datetime,
    end: dt.datetime,
    block_start: dt.datetime,
    block_end: dt.datetime,
) -> list[tuple[dt.datetime, dt.datetime]]:
    if block_end <= start or block_start >= end:
        return [(start, end)]
    out: list[tuple[dt.datetime, dt.datetime]] = []
    if block_start > start:
        out.append((start, min(block_start, end)))
    if block_end < end:
        out.append((max(block_end, start), end))
    return [(a, b) for a, b in out if a < b]


def _segments_for_day(
    day_cfg: dict[str, Any] | None,
    d: dt.date,
    tz: ZoneInfo,
) -> list[tuple[dt.datetime, dt.datetime]]:
    if not day_cfg or day_cfg.get("closed") is True:
        return []
    open_v = day_cfg.get("open")
    close_v = day_cfg.get("close")
    if not open_v or not close_v:
        return []
    segs = [(_combine_local(d, open_v, tz), _combine_local(d, close_v, tz))]
    breaks = day_cfg.get("breaks") or []
    for br in breaks:
        if not isinstance(br, dict):
            continue
        bs = br.get("start")
        be = br.get("end")
        if not bs or not be:
            continue
        b0 = _combine_local(d, bs, tz)
        b1 = _combine_local(d, be, tz)
        new: list[tuple[dt.datetime, dt.datetime]] = []
        for s, e in segs:
            new.extend(_subtract_block(s, e, b0, b1))
        segs = new
    return segs


def _busy_intervals_for_staff_day(
    staff_id: int,
    day_start: dt.datetime,
    day_end: dt.datetime,
) -> list[tuple[dt.datetime, dt.datetime]]:
    qs = (
        Appointment.objects.filter(staff_id=staff_id)
        .exclude(status=Appointment.Status.CANCELLED)
        .filter(starts_at__lt=day_end, ends_at__gt=day_start)
        .only("starts_at", "ends_at")
    )
    return [(a.starts_at, a.ends_at) for a in qs]


def _intervals_free_of_busy(
    segments: list[tuple[dt.datetime, dt.datetime]],
    busy: list[tuple[dt.datetime, dt.datetime]],
) -> list[tuple[dt.datetime, dt.datetime]]:
    segs = segments[:]
    for b_start, b_end in busy:
        new_segs: list[tuple[dt.datetime, dt.datetime]] = []
        for s, e in segs:
            new_segs.extend(_subtract_block(s, e, b_start, b_end))
        segs = new_segs
    return segs


@dataclass(frozen=True)
class AvailableSlotsResult:
    staff_id: int
    service_id: int
    day: dt.date
    slot_minutes: int
    slots: list[dict[str, str]]


def compute_available_slots(
    *,
    staff_id: int,
    service_id: int,
    day: dt.date,
    slot_minutes: int = 15,
) -> AvailableSlotsResult:
    staff = Staff.objects.select_related("business").get(pk=staff_id)
    service = Service.objects.get(pk=service_id)

    if staff.business_id != service.business_id:
        raise ValidationError(_("Personel ve hizmet aynı işletmeye ait olmalıdır."))

    if not StaffService.objects.filter(
        staff=staff,
        service=service,
        is_active=True,
    ).exists():
        raise ValidationError(_("Bu personel bu hizmeti veremiyor veya eşleşme pasif."))

    duration_min = _effective_duration_minutes(staff, service)
    if duration_min < 1:
        raise ValidationError(_("Geçersiz hizmet süresi."))

    tz_name = staff.business.timezone or "Europe/Istanbul"
    try:
        tz = ZoneInfo(tz_name)
    except Exception as exc:
        raise ValidationError(_("Geçersiz saat dilimi.")) from exc

    day_cfg = get_staff_day_config_for_date(staff, day)

    day_start = dt.datetime.combine(day, dt.time.min, tzinfo=tz)
    day_end = day_start + dt.timedelta(days=1)

    segments = _segments_for_day(day_cfg, day, tz)
    busy = _busy_intervals_for_staff_day(staff_id, day_start, day_end)
    free = _intervals_free_of_busy(segments, busy)

    step = dt.timedelta(minutes=slot_minutes)
    dur = dt.timedelta(minutes=duration_min)

    slot_list: list[dict[str, str]] = []
    for seg_start, seg_end in free:
        t = seg_start
        while t + dur <= seg_end:
            slot_list.append(
                {
                    "starts_at": t.isoformat(),
                    "ends_at": (t + dur).isoformat(),
                }
            )
            t += step

    return AvailableSlotsResult(
        staff_id=staff_id,
        service_id=service_id,
        day=day,
        slot_minutes=slot_minutes,
        slots=slot_list,
    )
