"""
declarck@gmail.com (veya --owner-email) için zengin demo veri: müşteriler, personel,
hizmetler ve çakışmasız randevular.

Tekrar çalıştırılabilir: internal_note içinde [seed_declarck_demo] geçen randevular silinip yeniden yazılır.
"""

from __future__ import annotations

import datetime as dt
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from appointments.models import Appointment
from business.models import Business, Service, Staff, StaffService
from business.working_hours import WEEKDAYS

User = get_user_model()

DEFAULT_OWNER_EMAIL = "declarck@gmail.com"
BUSINESS_SLUG = "coirendevouz-demo-declarck"
SEED_MARK = "[seed_declarck_demo]"
CUSTOMER_PASSWORD = "DemoMusteri2026!"

IST = ZoneInfo("Europe/Istanbul")

# (e-posta, ad soyad, telefon)
DEMO_CUSTOMERS: list[tuple[str, str, str]] = [
    ("demo.musteri.01@coirendevouz.local", "Zeynep Kaya", "+905551112201"),
    ("demo.musteri.02@coirendevouz.local", "Burak Yıldız", "+905551112202"),
    ("demo.musteri.03@coirendevouz.local", "Elif Özdemir", "+905551112203"),
    ("demo.musteri.04@coirendevouz.local", "Kerem Acar", "+905551112204"),
    ("demo.musteri.05@coirendevouz.local", "Selin Ateş", "+905551112205"),
    ("demo.musteri.06@coirendevouz.local", "Onur Çelik", "+905551112206"),
    ("demo.musteri.07@coirendevouz.local", "Merve Tunç", "+905551112207"),
    ("demo.musteri.08@coirendevouz.local", "Emre Güneş", "+905551112208"),
]

STAFF_NAMES: list[str] = [
    "Ayşe Yılmaz",
    "Mehmet Kaya",
    "Zeynep Aydın",
    "Can Öztürk",
    "Elif Demir",
    "Burak Şahin",
    "Selin Koç",
    "Emre Arslan",
]

# Hizmet adı, süre (dk), fiyat — isimler StaffService eşlemesinde kullanılır
SERVICES_SPEC: list[tuple[str, int, str]] = [
    ("Saç kesimi (demo)", 30, "750.00"),
    ("Sakal tıraşı (demo)", 20, "350.00"),
    ("Saç boyama (demo)", 120, "2500.00"),
    ("Fön ve şekillendirme (demo)", 45, "600.00"),
    ("Saç yıkama ve bakım (demo)", 25, "250.00"),
    ("Kaş düzenleme (demo)", 15, "200.00"),
    ("Yüz bakımı (demo)", 40, "450.00"),
]

# Personel → verebildiği hizmet adları (gerçekçi dağılım)
STAFF_SERVICE_NAMES: dict[str, list[str]] = {
    "Ayşe Yılmaz": [
        "Saç kesimi (demo)",
        "Sakal tıraşı (demo)",
        "Fön ve şekillendirme (demo)",
        "Saç yıkama ve bakım (demo)",
    ],
    "Mehmet Kaya": ["Saç kesimi (demo)", "Sakal tıraşı (demo)", "Saç boyama (demo)"],
    "Zeynep Aydın": ["Saç kesimi (demo)", "Saç boyama (demo)", "Fön ve şekillendirme (demo)"],
    "Can Öztürk": ["Sakal tıraşı (demo)", "Kaş düzenleme (demo)", "Saç kesimi (demo)"],
    "Elif Demir": ["Saç boyama (demo)", "Fön ve şekillendirme (demo)", "Yüz bakımı (demo)"],
    "Burak Şahin": ["Saç yıkama ve bakım (demo)", "Saç kesimi (demo)", "Sakal tıraşı (demo)"],
    "Selin Koç": ["Fön ve şekillendirme (demo)", "Kaş düzenleme (demo)", "Saç kesimi (demo)"],
    "Emre Arslan": ["Saç kesimi (demo)", "Saç boyama (demo)", "Sakal tıraşı (demo)"],
}


def _week_all_open() -> dict:
    return {
        w: {"open": "09:00", "close": "19:00", "closed": False, "breaks": []}
        for w in WEEKDAYS
    }


def _collect_weekdays(start: dt.date, max_days: int, count: int) -> list[dt.date]:
    """İlk `count` iş günü (Pzt–Cum), en fazla `max_days` takvim günü ileri."""
    out: list[dt.date] = []
    d = start
    end = start + dt.timedelta(days=max_days)
    while d <= end and len(out) < count:
        if d.weekday() < 5:
            out.append(d)
        d += dt.timedelta(days=1)
    return out


def _dt(d: dt.date, hour: int, minute: int = 0) -> dt.datetime:
    return dt.datetime(d.year, d.month, d.day, hour, minute, tzinfo=IST)


class Command(BaseCommand):
    help = (
        "Zengin demo: çoklu müşteri, 8 personel, 7 hizmet, onlarca randevu — "
        f"varsayılan sahip: {DEFAULT_OWNER_EMAIL}."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--owner-email",
            default=DEFAULT_OWNER_EMAIL,
            help=f"İşletme sahibi e-posta (varsayılan: {DEFAULT_OWNER_EMAIL}).",
        )

    def handle(self, *args, **options):
        owner_email = (options["owner_email"] or DEFAULT_OWNER_EMAIL).strip().lower()
        owner = User.objects.filter(email__iexact=owner_email).first()
        if owner is None:
            self.stderr.write(
                self.style.ERROR(
                    f"Kullanıcı bulunamadı: {owner_email}\n"
                    "Önce: python manage.py createsuperuser\n"
                    "Veya: python manage.py seed_declarck_demo --owner-email sizin@eposta.com"
                )
            )
            return

        if owner.role != User.Role.BUSINESS_ADMIN:
            owner.role = User.Role.BUSINESS_ADMIN
            owner.save(update_fields=["role"])
            self.stdout.write(
                self.style.WARNING(f"Rol business_admin olarak güncellendi: {owner_email}")
            )

        with transaction.atomic():
            business = Business.objects.filter(slug=BUSINESS_SLUG).first()
            if business is None:
                business = Business(
                    owner=owner,
                    name="Coirendevouz Demo Salon",
                    slug=BUSINESS_SLUG,
                    category=Business.Category.HAIR_SALON,
                    description="Yerel test — seed_declarck_demo ile oluşturuldu.",
                    address_line="Çankaya Cd. Demo No:7",
                    city="Ankara",
                    district="Çankaya",
                    working_hours=_week_all_open(),
                    timezone="Europe/Istanbul",
                    is_active=True,
                )
                business.save()
                self.stdout.write(self.style.SUCCESS(f"İşletme oluşturuldu: id={business.pk}"))
            else:
                if business.owner_id != owner.pk:
                    business.owner = owner
                    business.save(update_fields=["owner"])
                    self.stdout.write(
                        self.style.WARNING(
                            f"İşletme sahibi {owner_email} olarak güncellendi (id={business.pk})."
                        )
                    )
                else:
                    self.stdout.write(f"İşletme mevcut: id={business.pk}")

            # --- Hizmetler ---
            name_to_service: dict[str, Service] = {}
            for name, minutes, price in SERVICES_SPEC:
                s = Service.objects.filter(business=business, name=name).first()
                if s is None:
                    s = Service.objects.create(
                        business=business,
                        name=name,
                        duration_minutes=minutes,
                        price=price,
                        is_active=True,
                    )
                    self.stdout.write(self.style.SUCCESS(f"Hizmet: {name} (id={s.pk})"))
                name_to_service[name] = s

            # --- Personel + StaffService ---
            name_to_staff: dict[str, Staff] = {}
            for display_name in STAFF_NAMES:
                st = Staff.objects.filter(business=business, display_name=display_name).first()
                if st is None:
                    st = Staff.objects.create(
                        business=business,
                        display_name=display_name,
                        is_active=True,
                        working_hours=None,
                    )
                    self.stdout.write(self.style.SUCCESS(f"Personel: {display_name} (id={st.pk})"))
                name_to_staff[display_name] = st

            for display_name, svc_names in STAFF_SERVICE_NAMES.items():
                st = name_to_staff[display_name]
                for sn in svc_names:
                    svc = name_to_service[sn]
                    if not StaffService.objects.filter(staff=st, service=svc).exists():
                        StaffService.objects.create(staff=st, service=svc, is_active=True)

            # --- Demo müşteriler ---
            customers: list[User] = []
            for email, full_name, phone in DEMO_CUSTOMERS:
                u = User.objects.filter(email__iexact=email).first()
                if u is None:
                    u = User.objects.create_user(
                        email=email,
                        password=CUSTOMER_PASSWORD,
                        full_name=full_name,
                        phone=phone,
                        role=User.Role.CUSTOMER,
                    )
                    self.stdout.write(self.style.SUCCESS(f"Müşteri: {email} — {full_name}"))
                elif u.role != User.Role.CUSTOMER:
                    u.role = User.Role.CUSTOMER
                    u.save(update_fields=["role"])
                customers.append(u)

            Appointment.objects.filter(
                business=business, internal_note__contains=SEED_MARK
            ).delete()

            staff_list = [name_to_staff[n] for n in STAFF_NAMES]
            today = dt.date.today()
            # 3 hafta iş günü + geçen haftadan birkaç gün (tamamlanmış randevu görünümü)
            past_days = _collect_weekdays(today - dt.timedelta(days=14), max_days=14, count=5)
            future_days = _collect_weekdays(today, max_days=40, count=15)
            all_days = sorted(set(past_days + future_days))

            status_cycle = [
                Appointment.Status.CONFIRMED,
                Appointment.Status.CONFIRMED,
                Appointment.Status.PENDING,
                Appointment.Status.COMPLETED,
                Appointment.Status.CONFIRMED,
                Appointment.Status.PENDING,
                Appointment.Status.NO_SHOW,
                Appointment.Status.CANCELLED,
            ]
            # Aynı personel / gün: aralarında en az ~3 saat (boyama 120 dk güvenli)
            day_slots = [(9, 0), (13, 30)]

            appt_idx = 0
            used_intervals: dict[int, list[tuple[dt.datetime, dt.datetime]]] = {}

            def overlaps(staff_id: int, a: dt.datetime, b: dt.datetime) -> bool:
                for s, e in used_intervals.setdefault(staff_id, []):
                    if a < e and b > s:
                        return True
                return False

            def book(
                staff: Staff,
                svc: Service,
                start: dt.datetime,
                customer: User,
                status: str,
                source: str,
            ) -> None:
                nonlocal appt_idx
                end = start + dt.timedelta(minutes=int(svc.duration_minutes))
                if overlaps(staff.id, start, end):
                    return
                used_intervals[staff.id].append((start, end))
                appt = Appointment(
                    business=business,
                    customer=customer,
                    staff=staff,
                    service=svc,
                    starts_at=start,
                    ends_at=None,
                    status=status,
                    source=source,
                    customer_note="Demo: özel istek." if appt_idx % 9 == 0 else "",
                    internal_note=f"{SEED_MARK} #{appt_idx + 1}",
                )
                appt.save()
                appt_idx += 1
                self.stdout.write(
                    f"  #{appt.pk} {start.strftime('%Y-%m-%d %H:%M')} "
                    f"{staff.display_name} / {svc.name} / {customer.full_name} [{status}]"
                )

            for day_i, day in enumerate(all_days):
                for si, staff in enumerate(staff_list):
                    allowed_names = STAFF_SERVICE_NAMES[staff.display_name]
                    for slot_i, (h, m) in enumerate(day_slots):
                        svc = name_to_service[
                            allowed_names[(day_i + si + slot_i) % len(allowed_names)]
                        ]
                        start = _dt(day, h, m)
                        cust = customers[(day_i + si + slot_i * 3) % len(customers)]
                        stat = status_cycle[(day_i + si + slot_i) % len(status_cycle)]
                        src = (
                            Appointment.Source.BUSINESS_MANUAL
                            if (day_i + si + slot_i) % 10 == 0
                            else Appointment.Source.CUSTOMER_APP
                        )
                        book(staff, svc, start, cust, stat, src)

        self.stdout.write("")
        self.stdout.write(self.style.NOTICE("--- Özet ---"))
        self.stdout.write(f"business_id: {business.pk}")
        self.stdout.write(f"Sahip girişi: {owner_email}")
        self.stdout.write(
            f"Demo müşteriler ({len(DEMO_CUSTOMERS)} adet), şifre (hepsi): {CUSTOMER_PASSWORD}"
        )
        for c in User.objects.filter(email__in=[e[0] for e in DEMO_CUSTOMERS]).order_by("id"):
            self.stdout.write(f"  müşteri id={c.pk}  {c.email}  ({c.full_name})")
        self.stdout.write(
            "Manuel randevu formunda müşteri kullanıcı ID olarak yukarıdaki id değerlerinden birini girin."
        )
        self.stdout.write("Ajanda: geçmiş hafta + önümüzdeki haftaları kapsayacak şekilde tarih aralığı seçin.")
