from __future__ import annotations

import datetime as dt
from datetime import date, datetime, timedelta, time
from math import asin, cos, radians, sin, sqrt
from zoneinfo import ZoneInfo

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
)
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth import get_user_model

from appointments.models import Appointment
from business.models import Business, Service, Staff, StaffService

from .permissions import (
    IsBusinessMember,
    IsBusinessMemberForAppointment,
    IsBusinessPanelUser,
    IsCustomer,
)
from .serializers import (
    AppointmentCreateResponseSerializer,
    AppointmentCreateSerializer,
    AppointmentReadSerializer,
    AvailableSlotsResponseSerializer,
    BusinessDetailSerializer,
    BusinessListSerializer,
    AppointmentBusinessPatchSerializer,
    AppointmentBusinessReadSerializer,
    ManualAppointmentResponseSerializer,
    ManualAppointmentSerializer,
    RegisterSerializer,
    ScheduleResponseSerializer,
    ServiceSerializer,
    ServiceWriteSerializer,
    StaffSerializer,
    StaffServiceAssignmentSerializer,
    StaffWriteSerializer,
    UserMeEnvelopeSerializer,
    UserMePatchSerializer,
    UserMeSerializer,
)
from .slots import compute_available_slots

_SCHEDULE_TZ = ZoneInfo("Europe/Istanbul")


def _schedule_staff_ids_from_query(p) -> tuple[list[int] | None, str | None]:
    """
    `staff_id` tekrarlanan query veya virgülle ayrılmış tek parametre (örn. staff_id=1&staff_id=2).
    Boş liste: filtre yok (tüm personel).
    """
    raw = p.getlist("staff_id")
    if len(raw) == 1 and raw[0] and "," in raw[0]:
        raw = [x.strip() for x in raw[0].split(",") if x.strip()]
    ids: list[int] = []
    for x in raw:
        try:
            ids.append(int(x))
        except (TypeError, ValueError):
            return None, "invalid"
    if not ids:
        return [], None
    seen: set[int] = set()
    out: list[int] = []
    for i in ids:
        if i < 1:
            return None, "invalid"
        if i not in seen:
            seen.add(i)
            out.append(i)
    return out, None


def _schedule_range_from_query(from_s: str | None, to_s: str | None):
    """
    `from` / `to`: YYYY-MM-DD (işletme takvim günü, Europe/Istanbul).
    Dönüş: [start, end) — end_exclusive.
    """
    if not from_s or not to_s:
        return None, None, "missing"
    try:
        d_from = date.fromisoformat(from_s.strip())
        d_to = date.fromisoformat(to_s.strip())
    except ValueError:
        return None, None, "invalid"
    if d_from > d_to:
        return None, None, "range"
    start = datetime.combine(d_from, time.min, tzinfo=_SCHEDULE_TZ)
    end_excl = datetime.combine(d_to + timedelta(days=1), time.min, tzinfo=_SCHEDULE_TZ)
    return start, end_excl, None


def _istanbul_today() -> date:
    return datetime.now(_SCHEDULE_TZ).date()


def _istanbul_day_start_end(d: date) -> tuple[datetime, datetime]:
    start = datetime.combine(d, time.min, tzinfo=_SCHEDULE_TZ)
    return start, start + timedelta(days=1)


def _appointment_status_counts(qs):
    rows = qs.values("status").annotate(c=Count("id"))
    by_status = {r["status"]: r["c"] for r in rows}
    total = sum(by_status.values())
    return by_status, total


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * r * asin(min(1.0, sqrt(a)))


@extend_schema(
    summary="İşletme paneli özet istatistikleri",
    description=(
        "Dün / son 7 gün / son 30 gün randevu sayıları (durum kırılımı), "
        "önümüzdeki 14 gün toplam ve personel bazlı sayılar, "
        "yaklaşan izin/ kapalı gün istisnaları (`working_hours_exceptions`, `closed: true`)."
    ),
    responses={200: OpenApiTypes.OBJECT},
)
class BusinessDashboardStatsView(APIView):
    """Özet ekranı: geçmiş aralıklar, gelecek randevular, yaklaşan izinler."""

    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get(self, request, business_id, *args, **kwargs):
        today = _istanbul_today()
        yesterday = today - timedelta(days=1)

        ys, ye = _istanbul_day_start_end(yesterday)
        qs_y = Appointment.objects.filter(
            business_id=business_id, starts_at__gte=ys, starts_at__lt=ye
        )
        by_status_y, total_y = _appointment_status_counts(qs_y)

        start_6 = today - timedelta(days=6)
        start_7, _ = _istanbul_day_start_end(start_6)
        end_today_next = datetime.combine(
            today + timedelta(days=1), time.min, tzinfo=_SCHEDULE_TZ
        )
        qs_7 = Appointment.objects.filter(
            business_id=business_id,
            starts_at__gte=start_7,
            starts_at__lt=end_today_next,
        )
        by_status_7, total_7 = _appointment_status_counts(qs_7)

        daily = []
        for offset in range(7):
            d = start_6 + timedelta(days=offset)
            ds, de = _istanbul_day_start_end(d)
            qd = Appointment.objects.filter(
                business_id=business_id, starts_at__gte=ds, starts_at__lt=de
            )
            bs_d, tot_d = _appointment_status_counts(qd)
            daily.append({"date": d.isoformat(), "total": tot_d, "by_status": bs_d})

        start_29 = today - timedelta(days=29)
        start_30, _ = _istanbul_day_start_end(start_29)
        qs_30 = Appointment.objects.filter(
            business_id=business_id,
            starts_at__gte=start_30,
            starts_at__lt=end_today_next,
        )
        by_status_30, total_30 = _appointment_status_counts(qs_30)

        fut_start = datetime.combine(
            today + timedelta(days=1), time.min, tzinfo=_SCHEDULE_TZ
        )
        fut_end = datetime.combine(
            today + timedelta(days=15), time.min, tzinfo=_SCHEDULE_TZ
        )
        qs_f = Appointment.objects.filter(
            business_id=business_id,
            starts_at__gte=fut_start,
            starts_at__lt=fut_end,
        )
        total_f = qs_f.count()
        staff_rows = (
            qs_f.values("staff_id", "staff__display_name")
            .annotate(c=Count("id"))
            .order_by("-c")
        )
        by_staff = [
            {
                "staff_id": r["staff_id"],
                "display_name": r["staff__display_name"],
                "count": r["c"],
            }
            for r in staff_rows
        ]

        upcoming_leave = []
        tomorrow = today + timedelta(days=1)
        leave_horizon = today + timedelta(days=30)
        for st in Staff.objects.filter(business_id=business_id, is_active=True).only(
            "id", "display_name", "working_hours_exceptions"
        ):
            raw = st.working_hours_exceptions
            if not isinstance(raw, list):
                continue
            for ex in raw:
                if not isinstance(ex, dict) or ex.get("closed") is not True:
                    continue
                ds_s = ex.get("date")
                if not isinstance(ds_s, str):
                    continue
                try:
                    ed = date.fromisoformat(ds_s.strip())
                except ValueError:
                    continue
                if tomorrow <= ed <= leave_horizon:
                    upcoming_leave.append(
                        {
                            "staff_id": st.id,
                            "display_name": st.display_name,
                            "date": ed.isoformat(),
                            "closed": True,
                        }
                    )
        upcoming_leave.sort(key=lambda x: (x["date"], x["display_name"]))

        return Response(
            {
                "business_id": int(business_id),
                "timezone": "Europe/Istanbul",
                "today": today.isoformat(),
                "past": {
                    "yesterday": {
                        "date": yesterday.isoformat(),
                        "total": total_y,
                        "by_status": by_status_y,
                    },
                    "last_7_days": {
                        "from": start_6.isoformat(),
                        "to": today.isoformat(),
                        "total": total_7,
                        "by_status": by_status_7,
                        "daily": daily,
                    },
                    "last_30_days": {
                        "from": start_29.isoformat(),
                        "to": today.isoformat(),
                        "total": total_30,
                        "by_status": by_status_30,
                    },
                },
                "future": {
                    "from": (today + timedelta(days=1)).isoformat(),
                    "to": (today + timedelta(days=14)).isoformat(),
                    "days": 14,
                    "total": total_f,
                    "by_staff": by_staff,
                },
                "upcoming_leave": upcoming_leave,
            }
        )


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    queryset = get_user_model().objects.all()


@extend_schema_view(
    get=extend_schema(
        summary="Oturumdaki kullanıcı",
        responses={200: UserMeEnvelopeSerializer},
    ),
    patch=extend_schema(
        summary="Profil güncelleme",
        description="`full_name` ve/veya `phone` (e-posta ve rol değişmez).",
        request=UserMePatchSerializer,
        responses={200: UserMeEnvelopeSerializer},
    ),
)
class UserMeView(APIView):
    """Oturumdaki kullanıcı — Minimal admin `GET .../users/me/` ile uyumlu gövde."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response({"user": UserMeSerializer(request.user).data})

    def patch(self, request, *args, **kwargs):
        serializer = UserMePatchSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"user": UserMeSerializer(serializer.instance).data})


class BusinessViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Business.objects.filter(is_active=True).order_by("name")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BusinessDetailSerializer
        return BusinessListSerializer

    def get_queryset(self):
        qs = Business.objects.filter(is_active=True).order_by("name")
        p = self.request.query_params
        category = p.get("category")
        q = p.get("q")
        lat_s, lng_s = p.get("lat"), p.get("lng")
        radius_s = p.get("radius_km", "5")

        if category:
            qs = qs.filter(category=category)
        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(city__icontains=q)
                | Q(district__icontains=q)
                | Q(address_line__icontains=q)
            )

        if lat_s is not None and lng_s is not None:
            try:
                lat_f = float(lat_s)
                lng_f = float(lng_s)
                r_km = float(radius_s)
            except ValueError:
                return qs.none()
            cand = list(
                qs.exclude(latitude__isnull=True)
                .exclude(longitude__isnull=True)
                .only("id", "latitude", "longitude")
            )
            ids = [
                b.id
                for b in cand
                if _haversine_km(lat_f, lng_f, float(b.latitude), float(b.longitude))
                <= r_km
            ]
            qs = Business.objects.filter(id__in=ids, is_active=True).order_by("name")

        return qs


@extend_schema(
    summary="İşletme paneli — bağlı işletmeler",
    description=(
        "Oturumdaki kullanıcının sahibi olduğu veya aktif personel kaydıyla bağlı olduğu "
        "işletmeler (keşif listesi ile aynı öğe şeması). "
        "Django **süper kullanıcı** için tüm aktif işletmeler listelenir (destek / geliştirme). "
        "Rol: `business_admin` veya `staff`; müşteri erişemez."
    ),
)
class BusinessMineListView(generics.ListAPIView):
    """2-BE-02: yönetici / personel için `GET /businesses/mine/`."""

    permission_classes = [IsAuthenticated, IsBusinessPanelUser]
    serializer_class = BusinessListSerializer

    def get_queryset(self):
        u = self.request.user
        if getattr(u, "is_superuser", False):
            return Business.objects.filter(is_active=True).order_by("name")
        return (
            Business.objects.filter(
                Q(owner=u)
                | Q(staff_members__user=u, staff_members__is_active=True),
            )
            .distinct()
            .order_by("name")
        )


@extend_schema_view(
    list=extend_schema(summary="İşletme hizmetleri — liste"),
    create=extend_schema(summary="İşletme hizmeti — oluştur"),
    retrieve=extend_schema(summary="İşletme hizmeti — detay"),
    partial_update=extend_schema(summary="İşletme hizmeti — güncelle"),
    update=extend_schema(summary="İşletme hizmeti — tam güncelleme"),
    destroy=extend_schema(summary="İşletme hizmeti — pasifleştir (soft delete)"),
)
class BusinessServiceViewSet(viewsets.ModelViewSet):
    """2-BE-03: `/businesses/{business_id}/services/` — sahip veya personel."""

    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get_queryset(self):
        bid = self.kwargs["business_id"]
        return Service.objects.filter(business_id=bid).order_by("name")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ServiceWriteSerializer
        return ServiceSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except IntegrityError:
            return Response(
                {
                    "error": {
                        "code": "duplicate_service_name",
                        "message": "Bu işletmede aynı isimde bir hizmet zaten var.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            ServiceSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_create(self, serializer):
        serializer.save(business_id=self.kwargs["business_id"])

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_update(serializer)
        except IntegrityError:
            return Response(
                {
                    "error": {
                        "code": "duplicate_service_name",
                        "message": "Bu işletmede aynı isimde bir hizmet zaten var.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(ServiceSerializer(serializer.instance).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_active:
            return Response(status=status.HTTP_204_NO_CONTENT)
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(summary="İşletme personeli — liste"),
    create=extend_schema(summary="Personel — oluştur"),
    retrieve=extend_schema(summary="Personel — detay"),
    partial_update=extend_schema(summary="Personel — güncelle"),
    update=extend_schema(summary="Personel — tam güncelleme"),
    destroy=extend_schema(summary="Personel — pasifleştir (soft delete)"),
)
class BusinessStaffViewSet(viewsets.ModelViewSet):
    """2-BE-04: `/businesses/{business_id}/staff/` — sahip veya personel."""

    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get_queryset(self):
        bid = self.kwargs["business_id"]
        return Staff.objects.filter(business_id=bid).select_related("user").order_by(
            "display_name"
        )

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return StaffWriteSerializer
        return StaffSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            StaffSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_create(self, serializer):
        serializer.save(business_id=self.kwargs["business_id"])

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(StaffSerializer(serializer.instance).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_active:
            return Response(status=status.HTTP_204_NO_CONTENT)
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    summary="Personel–hizmet ataması",
    description=(
        "Gövdedeki `service_ids` listesi bu işletmedeki hizmet PK'lerinin **tam kümesidir**: "
        "listede olmayan mevcut bağlar pasifleştirilir (`StaffService.is_active=False`); "
        "listedekiler aktifleştirilir veya oluşturulur."
    ),
    request=StaffServiceAssignmentSerializer,
    responses={200: StaffSerializer},
)
class StaffServicesAssignmentView(APIView):
    """2-BE-05: `PUT /businesses/{business_id}/staff/{staff_id}/services/`."""

    permission_classes = [IsAuthenticated, IsBusinessMember]

    def put(self, request, business_id, staff_id, *args, **kwargs):
        staff = get_object_or_404(Staff, pk=staff_id, business_id=business_id)
        ser = StaffServiceAssignmentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        raw_ids = ser.validated_data["service_ids"]
        ids = list(dict.fromkeys(raw_ids))

        if ids:
            valid = Service.objects.filter(business_id=business_id, pk__in=ids)
            found = set(valid.values_list("pk", flat=True))
            missing = [i for i in ids if i not in found]
            if missing:
                return Response(
                    {
                        "error": {
                            "code": "invalid_service_ids",
                            "message": "Bazı hizmetler bu işletmeye ait değil veya bulunamadı.",
                            "details": {"ids": missing},
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            if ids:
                StaffService.objects.filter(staff=staff).exclude(
                    service_id__in=ids
                ).update(is_active=False)
            else:
                StaffService.objects.filter(staff=staff).update(is_active=False)
            for sid in ids:
                link, created = StaffService.objects.get_or_create(
                    staff=staff,
                    service_id=sid,
                    defaults={"is_active": True},
                )
                if not created and not link.is_active:
                    link.is_active = True
                    link.save(update_fields=["is_active"])

        staff.refresh_from_db()
        return Response(StaffSerializer(staff).data)


@extend_schema(
    summary="İşletme ajandası",
    description=(
        "`from` ve `to` zorunludur: `YYYY-MM-DD` (dahil aralık, saat dilimi Europe/Istanbul). "
        "İsteğe bağlı `status` ile randevu durumu filtrelenir."
    ),
    parameters=[
        OpenApiParameter(
            "from",
            OpenApiTypes.DATE,
            OpenApiParameter.QUERY,
            required=True,
        ),
        OpenApiParameter(
            "to",
            OpenApiTypes.DATE,
            OpenApiParameter.QUERY,
            required=True,
        ),
        OpenApiParameter(
            "status",
            OpenApiTypes.STR,
            OpenApiParameter.QUERY,
            required=False,
        ),
        OpenApiParameter(
            "staff_id",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            required=False,
            many=True,
            description=(
                "Yalnızca bu personel kayıtlarının randevuları; tekrarlanan parametre "
                "veya virgülle liste. Verilmezse veya boşsa tüm personel."
            ),
        ),
    ],
    responses={200: ScheduleResponseSerializer},
)
class BusinessScheduleView(APIView):
    """2-BE-06: `GET /businesses/{business_id}/schedule/`."""

    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get(self, request, business_id, *args, **kwargs):
        p = request.query_params
        start, end_excl, err = _schedule_range_from_query(p.get("from"), p.get("to"))
        if err == "missing":
            return Response(
                {
                    "error": {
                        "code": "missing_query_params",
                        "message": "from ve to sorgu parametreleri zorunludur (YYYY-MM-DD).",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if err == "invalid":
            return Response(
                {
                    "error": {
                        "code": "invalid_date",
                        "message": "from ve to geçerli YYYY-MM-DD tarihleri olmalıdır.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if err == "range":
            return Response(
                {
                    "error": {
                        "code": "invalid_range",
                        "message": "from, to tarihinden sonra olamaz.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        staff_ids, staff_err = _schedule_staff_ids_from_query(p)
        if staff_err == "invalid":
            return Response(
                {
                    "error": {
                        "code": "invalid_staff_id",
                        "message": "staff_id pozitif tam sayı veya virgülle ayrılmış liste olmalıdır.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = (
            Appointment.objects.filter(
                business_id=business_id,
                starts_at__gte=start,
                starts_at__lt=end_excl,
            )
            .select_related("customer", "staff", "service")
            .order_by("starts_at")
        )
        st = p.get("status")
        if st:
            qs = qs.filter(status=st)

        if staff_ids:
            valid_ids = set(
                Staff.objects.filter(
                    business_id=business_id, id__in=staff_ids
                ).values_list("id", flat=True)
            )
            missing = set(staff_ids) - valid_ids
            if missing:
                return Response(
                    {
                        "error": {
                            "code": "unknown_staff",
                            "message": (
                                "Bu işletmeye ait olmayan veya bulunamayan personel: "
                                + ", ".join(str(i) for i in sorted(missing))
                            ),
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(staff_id__in=staff_ids)

        appointments = []
        for a in qs:
            appointments.append(
                {
                    "id": a.id,
                    "starts_at": a.starts_at,
                    "ends_at": a.ends_at,
                    "status": a.status,
                    "service": {"id": a.service_id, "name": a.service.name},
                    "staff": {
                        "id": a.staff_id,
                        "display_name": a.staff.display_name,
                    },
                    "customer": {
                        "id": a.customer_id,
                        "full_name": a.customer.full_name,
                        "phone": a.customer.phone or "",
                    },
                }
            )

        return Response(
            {
                "business_id": int(business_id),
                "appointments": appointments,
            }
        )


@extend_schema(
    summary="Müsait slotlar",
    parameters=[
        OpenApiParameter(
            "staff_id",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            required=True,
        ),
        OpenApiParameter(
            "service_id",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            required=True,
        ),
        OpenApiParameter(
            "date",
            OpenApiTypes.DATE,
            OpenApiParameter.QUERY,
            required=True,
        ),
        OpenApiParameter(
            "slot_minutes",
            OpenApiTypes.INT,
            OpenApiParameter.QUERY,
            required=False,
        ),
    ],
    responses={200: AvailableSlotsResponseSerializer},
)
class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        p = request.query_params
        staff_id = p.get("staff_id")
        service_id = p.get("service_id")
        date_s = p.get("date")
        try:
            slot_minutes = int(p.get("slot_minutes", "15"))
        except ValueError:
            return Response(
                {"error": {"code": "invalid_slot_minutes", "message": "slot_minutes sayı olmalı."}},
                status=400,
            )

        if not staff_id or not service_id or not date_s:
            return Response(
                {
                    "error": {
                        "code": "missing_params",
                        "message": "staff_id, service_id ve date zorunludur.",
                    }
                },
                status=400,
            )

        try:
            day = dt.date.fromisoformat(date_s)
        except ValueError:
            return Response(
                {"error": {"code": "invalid_date", "message": "date YYYY-MM-DD olmalıdır."}},
                status=400,
            )

        try:
            result = compute_available_slots(
                staff_id=int(staff_id),
                service_id=int(service_id),
                day=day,
                slot_minutes=slot_minutes,
            )
        except Staff.DoesNotExist:
            return Response(status=404)
        except Service.DoesNotExist:
            return Response(status=404)
        except DjangoValidationError as exc:
            msg = " ".join(getattr(exc, "messages", [])) or str(exc)
            return Response(
                {"error": {"code": "validation_error", "message": msg}},
                status=400,
            )

        return Response(
            {
                "staff_id": result.staff_id,
                "service_id": result.service_id,
                "date": result.day.isoformat(),
                "slot_minutes": result.slot_minutes,
                "slots": result.slots,
            }
        )


@extend_schema(
    summary="Manuel randevu",
    description=(
        "İşletme panelinden müşteri hesabına randevu. `customer_user_id` rolü "
        "`customer` olmalı; personel–hizmet eşleşmesi aktif olmalı."
    ),
    request=ManualAppointmentSerializer,
    responses={201: ManualAppointmentResponseSerializer},
)
class BusinessManualAppointmentView(APIView):
    """2-BE-07: `POST /businesses/{business_id}/appointments/manual/`."""

    permission_classes = [IsAuthenticated, IsBusinessMember]

    def post(self, request, business_id, *args, **kwargs):
        serializer = ManualAppointmentSerializer(
            data=request.data,
            context={"business_id": int(business_id)},
        )
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        appt = Appointment(
            business_id=int(business_id),
            customer_id=d["customer_user_id"],
            staff_id=d["staff_id"],
            service_id=d["service_id"],
            starts_at=d["starts_at"],
            internal_note=d.get("internal_note") or "",
            status=Appointment.Status.CONFIRMED,
            source=Appointment.Source.BUSINESS_MANUAL,
        )
        try:
            appt.save()
        except DjangoValidationError as exc:
            if getattr(exc, "message_dict", None):
                return Response(
                    {
                        "error": {
                            "code": "validation_error",
                            "details": exc.message_dict,
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            msg = list(getattr(exc, "messages", []) or [str(exc)])
            return Response(
                {"error": {"code": "validation_error", "message": msg}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            ManualAppointmentResponseSerializer(appt).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(
        summary="Randevu detayı (işletme)",
        description=(
            "Randevu özeti; `internal_note` dahil. Randevu bu işletmeye ait olmalı; sahip veya personel."
        ),
        responses={200: AppointmentBusinessReadSerializer},
    ),
    patch=extend_schema(
        summary="Randevu güncelleme (işletme)",
        description=(
            "Durum (`status`) ve/veya işletme içi not (`internal_note`). "
            "Randevu bu işletmeye ait olmalı; sahip veya personel."
        ),
        request=AppointmentBusinessPatchSerializer,
        responses={200: AppointmentBusinessReadSerializer},
    ),
)
class AppointmentBusinessPatchView(APIView):
    """2-BE-08: `GET`/`PATCH /appointments/{id}/` — işletme yetkisi."""

    permission_classes = [IsAuthenticated, IsBusinessMemberForAppointment]

    def get(self, request, pk, *args, **kwargs):
        appointment = get_object_or_404(
            Appointment.objects.select_related("business", "staff", "service", "customer"),
            pk=pk,
        )
        self.check_object_permissions(request, appointment)
        return Response(AppointmentBusinessReadSerializer(appointment).data)

    def patch(self, request, pk, *args, **kwargs):
        appointment = get_object_or_404(
            Appointment.objects.select_related("business", "staff", "service", "customer"),
            pk=pk,
        )
        self.check_object_permissions(request, appointment)
        serializer = AppointmentBusinessPatchSerializer(
            appointment,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except DjangoValidationError as exc:
            if getattr(exc, "message_dict", None):
                return Response(
                    {
                        "error": {
                            "code": "validation_error",
                            "details": exc.message_dict,
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            msg = list(getattr(exc, "messages", []) or [str(exc)])
            return Response(
                {"error": {"code": "validation_error", "message": msg}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(AppointmentBusinessReadSerializer(serializer.instance).data)


class AppointmentCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsCustomer]
    serializer_class = AppointmentCreateSerializer
    queryset = Appointment.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            AppointmentCreateResponseSerializer(instance).data,
            status=201,
        )


class AppointmentMeListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsCustomer]
    serializer_class = AppointmentReadSerializer

    def get_queryset(self):
        qs = (
            Appointment.objects.filter(customer=self.request.user)
            .select_related("business")
            .order_by("-starts_at")
        )
        st = self.request.query_params.get("status")
        if st:
            qs = qs.filter(status=st)
        return qs
