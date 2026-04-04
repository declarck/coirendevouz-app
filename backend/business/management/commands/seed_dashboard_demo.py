"""
Seçili işletme için özet ekranı grafiklerini doldurmak amacıyla geçmiş randevular üretir
(Europe/Istanbul günleri; API ile aynı mantık).

Tekrar çalıştırılabilir: internal_note içinde [seed_dashboard_demo] geçen randevular silinip yeniden yazılır.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from appointments.models import Appointment
from business.models import Business, Staff, StaffService

User = get_user_model()

IST = ZoneInfo("Europe/Istanbul")
SEED_MARK = "[seed_dashboard_demo]"

# Son 30 gün (bugün-29 … bugün): gün başına hedef randevu sayıları — grafikte dalgalanma için
_COUNTS_30: list[int] = [
    1,
    0,
    2,
    1,
    3,
    2,
    1,
    4,
    2,
    3,
    1,
    2,
    4,
    3,
    2,
    5,
    4,
    3,
    6,
    5,
    4,
    7,
    6,
    5,
    8,
    12,
    10,
    14,
    9,
    11,
]

# Durum döngüsü: tamamlanan ağırlıklı, iptal / gelmedi / bekleyen / onaylı karışık
_STATUS_CYCLE: tuple[str, ...] = (
    Appointment.Status.COMPLETED,
    Appointment.Status.COMPLETED,
    Appointment.Status.CONFIRMED,
    Appointment.Status.COMPLETED,
    Appointment.Status.CANCELLED,
    Appointment.Status.COMPLETED,
    Appointment.Status.PENDING,
    Appointment.Status.NO_SHOW,
    Appointment.Status.COMPLETED,
    Appointment.Status.CANCELLED,
    Appointment.Status.COMPLETED,
)


def _istanbul_today() -> date:
    return datetime.now(IST).date()


def _combine_ist(d: date, hour: int, minute: int = 0) -> datetime:
    return datetime.combine(d, time(hour, minute), tzinfo=IST)


def _effective_minutes(ss: StaffService) -> int:
    if ss.duration_minutes_override is not None:
        return int(ss.duration_minutes_override)
    return int(ss.service.duration_minutes)


def _intervals_overlap(
    a_start: datetime,
    a_end: datetime,
    b_start: datetime,
    b_end: datetime,
) -> bool:
    return a_start < b_end and a_end > b_start


def _existing_intervals_by_staff_day(
    business_id: int, staff_ids: list[int], d: date
) -> dict[int, list[tuple[datetime, datetime]]]:
    """İptal edilmemiş mevcut randevular (aynı iş günü, İstanbul)."""
    day_lo = datetime.combine(d, time.min, tzinfo=IST)
    day_hi = day_lo + timedelta(days=1)
    out: dict[int, list[tuple[datetime, datetime]]] = {sid: [] for sid in staff_ids}
    qs = Appointment.objects.filter(
        business_id=business_id,
        staff_id__in=staff_ids,
        starts_at__gte=day_lo,
        starts_at__lt=day_hi,
    ).exclude(status=Appointment.Status.CANCELLED)
    qs = qs.only("staff_id", "starts_at", "ends_at")
    for a in qs:
        if a.starts_at and a.ends_at:
            out.setdefault(a.staff_id, []).append((a.starts_at, a.ends_at))
    return out


def _find_slot(
    d: date,
    duration_minutes: int,
    occupied: list[tuple[datetime, datetime]],
) -> tuple[datetime, datetime] | None:
    """09:00–20:00 arasında mevcut aralıklarla çakışmayan ilk başlangıç (5 dk adım)."""
    duration = timedelta(minutes=duration_minutes)
    day_open = _combine_ist(d, 9, 0)
    day_end = _combine_ist(d, 20, 0)
    step = timedelta(minutes=5)
    t = day_open
    while t + duration <= day_end:
        end = t + duration
        if not any(_intervals_overlap(t, end, os_, oe) for os_, oe in occupied):
            return t, end
        t += step
    return None


def _max_appointments_per_day(staff_list: list[Staff], staff_services: dict[int, StaffService]) -> int:
    """Kabaca üst sınır (dar süre varsayımı)."""
    total = 0
    for st in staff_list:
        ss = staff_services[st.pk]
        g = max(_effective_minutes(ss) + 3, 15)
        total += max(1, int(9 * 60 / g))
    return max(total, 1)


class Command(BaseCommand):
    help = (
        "Dashboard grafikleri için son ~30 gün (İstanbul) geçmiş randevuları sahte veriyle doldurur. "
        "İşletmeyi --business-id, --slug veya --owner-email ile seçin; id bilinmiyorsa --list kullanın. "
        "Önce işletmede en az bir aktif personel ve StaffService eşlemesi olmalıdır."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--list",
            action="store_true",
            help="Veritabanındaki işletmeleri id / slug / ad ile listele ve çık.",
        )
        parser.add_argument(
            "--business-id",
            type=int,
            default=None,
            help="İşletme birincil anahtarı (sayı).",
        )
        parser.add_argument(
            "--slug",
            default=None,
            help="İşletme slug (URL kısa adı), örn. coirendevouz-demo-declarck.",
        )
        parser.add_argument(
            "--owner-email",
            dest="owner_email",
            default=None,
            help="İşletme sahibi e-posta; bu kullanıcıya ait ilk işletme kullanılır.",
        )

    def _print_business_list(self) -> None:
        qs = Business.objects.select_related("owner").order_by("id")
        n = qs.count()
        if n == 0:
            self.stdout.write("Kayıtlı işletme yok.")
            return
        self.stdout.write(f"İşletmeler ({n}):")
        for b in qs:
            self.stdout.write(
                f"  id={b.pk}  slug={b.slug}  name={b.name!r}  owner={b.owner.email}"
            )
        self.stdout.write("")
        self.stdout.write(
            "Örnek: python manage.py seed_dashboard_demo --slug <slug> "
            "veya --owner-email <sahip@eposta.com>"
        )

    def _resolve_business(self, options) -> Business:
        bid = options["business_id"]
        slug = (options["slug"] or "").strip()
        owner_email = (options["owner_email"] or "").strip()

        has_bid = bid is not None
        has_slug = bool(slug)
        has_owner = bool(owner_email)
        if int(has_bid) + int(has_slug) + int(has_owner) != 1:
            raise CommandError(
                "İşletmeyi seçmek için tam birini kullanın: "
                "--business-id, --slug veya --owner-email. "
                "Tüm işletmeleri görmek için: python manage.py seed_dashboard_demo --list"
            )

        if has_bid:
            b = Business.objects.filter(pk=bid).first()
            if b is None:
                raise CommandError(f"İşletme bulunamadı: id={bid}")
            return b

        if has_slug:
            b = Business.objects.filter(slug=slug).first()
            if b is None:
                raise CommandError(f"İşletme bulunamadı: slug={slug!r}")
            return b

        owner = User.objects.filter(email__iexact=owner_email).first()
        if owner is None:
            raise CommandError(f"Kullanıcı bulunamadı: {owner_email!r}")
        qs = Business.objects.filter(owner=owner).order_by("id")
        if not qs.exists():
            raise CommandError(
                f"Bu e-postaya ait işletme yok: {owner_email!r}"
            )
        if qs.count() > 1:
            ids = list(qs.values_list("pk", flat=True))
            self.stdout.write(
                self.style.WARNING(
                    f"Bu sahip için {qs.count()} işletme var; ilki kullanılıyor (id={qs.first().pk}): {ids}"
                )
            )
        return qs.first()  # type: ignore[return-value]

    def handle(self, *args, **options):
        if options["list"]:
            self._print_business_list()
            return

        business = self._resolve_business(options)
        business_id = business.pk
        self.stdout.write(
            f"İşletme: id={business_id} slug={business.slug!r} name={business.name!r}"
        )

        staff_list = list(
            Staff.objects.filter(business_id=business_id, is_active=True).order_by("id")
        )
        if not staff_list:
            raise CommandError("Bu işletmede aktif personel yok; önce personel ekleyin.")

        staff_services: dict[int, StaffService] = {}
        for st in staff_list:
            ss = (
                StaffService.objects.filter(staff=st, is_active=True)
                .select_related("service")
                .order_by("service__duration_minutes")
                .first()
            )
            if ss is None:
                raise CommandError(
                    f"Personelin hizmet eşlemesi yok: {st.display_name!r} (id={st.pk}). "
                    "StaffService kaydı ekleyin."
                )
            staff_services[st.pk] = ss

        customer = User.objects.filter(role=User.Role.CUSTOMER).order_by("id").first()
        if customer is None:
            customer = User.objects.create_user(
                email="dashboard.seed@coirendevouz.local",
                password="DashboardSeed2026!",
                full_name="Dashboard Seed Müşteri",
                phone="",
                role=User.Role.CUSTOMER,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Demo müşteri oluşturuldu: {customer.email} (id={customer.pk})"
                )
            )

        today = _istanbul_today()
        if len(_COUNTS_30) != 30:
            raise CommandError("internal: _COUNTS_30 uzunluğu 30 olmalıdır.")

        with transaction.atomic():
            deleted, _ = Appointment.objects.filter(
                business_id=business_id,
                internal_note__contains=SEED_MARK,
            ).delete()
            if deleted:
                self.stdout.write(f"Önceki seed randevular silindi: {deleted} kayıt")

            created = 0
            global_i = 0
            cap_per_day = _max_appointments_per_day(staff_list, staff_services)
            staff_ids = [st.pk for st in staff_list]
            ns = len(staff_list)
            for idx in range(30):
                d = today - timedelta(days=29 - idx)
                raw_n = _COUNTS_30[idx]
                n = min(raw_n, cap_per_day)
                if raw_n > cap_per_day:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  {d.isoformat()}: hedef {raw_n} → {n} (günlük üst sınır {cap_per_day})"
                        )
                    )
                # DB’deki (ve bu seed ile aynı gün eklenen) dolu aralıklar — seed_declarck_demo vb. ile çakışmayı önler
                occupied_by_staff = _existing_intervals_by_staff_day(
                    business_id, staff_ids, d
                )
                for j in range(n):
                    st = staff_list[j % ns]
                    ss = staff_services[st.pk]
                    svc = ss.service
                    eff = _effective_minutes(ss)
                    occ = occupied_by_staff[st.pk]
                    slot = _find_slot(d, eff, occ)
                    if slot is None:
                        raise CommandError(
                            f"{d.isoformat()} — {st.display_name!r} için boş slot kalmadı "
                            f"(aynı günde mevcut randevularla çakışma). "
                            "İşletmedeki diğer randevuları azaltın veya seed_dashboard_demo öncesi "
                            "seed_declarck_demo ile oluşan çakışan günleri temizleyin."
                        )
                    start, end = slot
                    occ.append((start, end))
                    status = _STATUS_CYCLE[global_i % len(_STATUS_CYCLE)]
                    global_i += 1
                    appt = Appointment(
                        business=business,
                        customer=customer,
                        staff=st,
                        service=svc,
                        starts_at=start,
                        ends_at=None,
                        status=status,
                        source=(
                            Appointment.Source.BUSINESS_MANUAL
                            if global_i % 5 == 0
                            else Appointment.Source.CUSTOMER_APP
                        ),
                        customer_note="",
                        internal_note=f"{SEED_MARK} day={d.isoformat()} i={j}",
                    )
                    appt.save()
                    created += 1
                    self.stdout.write(
                        f"  + {appt.pk} {start.strftime('%Y-%m-%d %H:%M')} "
                        f"{st.display_name} [{status}]"
                    )

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Tamam: {created} randevu yazıldı (business_id={business_id})."))
        self.stdout.write(
            "Özet ekranını yenileyin; son 7 / 30 gün ve dün kartlarında veri görünmelidir."
        )
