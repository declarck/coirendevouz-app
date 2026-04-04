"""
Faz 1 kapanış testi için demo işletme + hizmet + personel + personel–hizmet.

Tekrar çalıştırılabilir: aynı slug varsa mevcut kayıtların ID'leri yazdırılır.
"""

from __future__ import annotations

import datetime as dt

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from business.models import Business, Service, Staff, StaffService
from business.working_hours import WEEKDAYS

User = get_user_model()

SLUG = "demo-faz1-salon"


def _week_all_open() -> dict:
    return {
        w: {"open": "09:00", "close": "18:00", "closed": False, "breaks": []}
        for w in WEEKDAYS
    }


class Command(BaseCommand):
    help = "Faz 1 kapanış testi: demo işletme, hizmet, personel ve StaffService oluşturur."

    def add_arguments(self, parser):
        parser.add_argument(
            "--owner-email",
            default="owner@faz1-demo.local",
            help="İşletme sahibi kullanıcı e-postası (yoksa oluşturulur).",
        )
        parser.add_argument(
            "--owner-password",
            default="demoFaz1Pass1!",
            help="Yeni oluşturulacak sahip için şifre (mevcut kullanıcıda değiştirilmez).",
        )

    def handle(self, *args, **options):
        email = (options["owner_email"] or "").strip().lower()
        password = options["owner_password"]

        with transaction.atomic():
            owner = User.objects.filter(email=email).first()
            if owner is None:
                owner = User.objects.create_user(
                    email=email,
                    password=password,
                    full_name="Faz1 Demo İşletme Sahibi",
                    phone="+900000000000",
                    role=User.Role.BUSINESS_ADMIN,
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Sahip kullanıcı oluşturuldu: {email} (şifre: komutta verilen)"
                    )
                )
            elif owner.role != User.Role.BUSINESS_ADMIN:
                self.stderr.write(
                    self.style.WARNING(
                        f"{email} zaten var; rol business_admin değil ({owner.role}). "
                        "İşletme oluşturmak için admin’den rolü güncelleyin veya başka e-posta kullanın."
                    )
                )
                return

            business = Business.objects.filter(slug=SLUG).first()
            if business is None:
                business = Business(
                    owner=owner,
                    name="Demo Faz1 Salon",
                    slug=SLUG,
                    category=Business.Category.BARBER,
                    description="Faz 1 kapanış testi — otomatik oluşturuldu.",
                    address_line="Test Cad. No:1",
                    city="Ankara",
                    district="Çankaya",
                    working_hours=_week_all_open(),
                    timezone="Europe/Istanbul",
                    is_active=True,
                )
                business.save()
                self.stdout.write(self.style.SUCCESS(f"İşletme oluşturuldu: id={business.pk}"))

            service = Service.objects.filter(
                business=business, name="Saç kesimi (demo)"
            ).first()
            if service is None:
                service = Service.objects.create(
                    business=business,
                    name="Saç kesimi (demo)",
                    duration_minutes=30,
                    price="500.00",
                    is_active=True,
                )
                self.stdout.write(self.style.SUCCESS(f"Hizmet oluşturuldu: id={service.pk}"))

            staff = Staff.objects.filter(
                business=business, display_name="Demo Personel"
            ).first()
            if staff is None:
                staff = Staff.objects.create(
                    business=business,
                    display_name="Demo Personel",
                    is_active=True,
                )
                self.stdout.write(self.style.SUCCESS(f"Personel oluşturuldu: id={staff.pk}"))

            ss = StaffService.objects.filter(staff=staff, service=service).first()
            if ss is None:
                StaffService.objects.create(
                    staff=staff, service=service, is_active=True
                )
                self.stdout.write(self.style.SUCCESS("Personel–hizmet eşlemesi oluşturuldu."))

        today = dt.date.today()
        test_day = today
        for _ in range(14):
            if test_day.weekday() < 5:
                break
            test_day += dt.timedelta(days=1)
        else:
            test_day = today

        self.stdout.write("")
        self.stdout.write(self.style.NOTICE("--- Swagger / Postman için ---"))
        self.stdout.write(f"business_id: {business.pk}")
        self.stdout.write(f"service_id:  {service.pk}")
        self.stdout.write(f"staff_id:    {staff.pk}")
        self.stdout.write(
            f"Örnek test tarihi (iş günü, ISO): {test_day.isoformat()} "
            "(available-slots ve randevu için)"
        )
        self.stdout.write("")
        self.stdout.write(
            "Sonraki adımlar: documentation/FAZ1-KAPANIS-TESTI.md dosyasına bakın."
        )
