from __future__ import annotations

import datetime as dt
from math import asin, cos, radians, sin, sqrt

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth import get_user_model

from appointments.models import Appointment
from business.models import Business, Service, Staff

from .permissions import IsCustomer
from .serializers import (
    AppointmentCreateResponseSerializer,
    AppointmentCreateSerializer,
    AppointmentReadSerializer,
    AvailableSlotsResponseSerializer,
    BusinessDetailSerializer,
    BusinessListSerializer,
    RegisterSerializer,
)
from .slots import compute_available_slots


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * r * asin(min(1.0, sqrt(a)))


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    queryset = get_user_model().objects.all()


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
