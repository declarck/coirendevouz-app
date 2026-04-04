from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from appointments.models import Appointment
from business.models import Business, Service, Staff, StaffService

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "password", "full_name", "phone", "role")

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ("id", "name", "duration_minutes", "price", "is_active")


class StaffSerializer(serializers.ModelSerializer):
    service_ids = serializers.SerializerMethodField()

    class Meta:
        model = Staff
        fields = ("id", "display_name", "is_active", "service_ids")

    @extend_schema_field({"type": "array", "items": {"type": "integer"}})
    def get_service_ids(self, obj: Staff) -> list[int]:
        return list(
            StaffService.objects.filter(
                staff=obj, is_active=True
            ).values_list("service_id", flat=True)
        )


class BusinessListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "city",
            "district",
            "latitude",
            "longitude",
            "is_active",
        )


class BusinessDetailSerializer(serializers.ModelSerializer):
    services = serializers.SerializerMethodField()
    staff = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "description",
            "address_line",
            "city",
            "district",
            "latitude",
            "longitude",
            "working_hours",
            "timezone",
            "is_active",
            "services",
            "staff",
        )

    @extend_schema_field(ServiceSerializer(many=True))
    def get_services(self, obj: Business):
        qs = obj.services.filter(is_active=True)
        return ServiceSerializer(qs, many=True).data

    @extend_schema_field(StaffSerializer(many=True))
    def get_staff(self, obj: Business):
        qs = obj.staff_members.filter(is_active=True)
        return StaffSerializer(qs, many=True).data


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ("business", "staff", "service", "starts_at", "customer_note")

    def validate(self, attrs):
        staff = attrs["staff"]
        service = attrs["service"]
        business = attrs["business"]
        if staff.business_id != business.id or service.business_id != business.id:
            raise serializers.ValidationError(
                "İşletme, personel ve hizmet uyumsuz."
            )
        return attrs

    def create(self, validated_data):
        validated_data["customer"] = self.context["request"].user
        validated_data["status"] = Appointment.Status.CONFIRMED
        validated_data["source"] = Appointment.Source.CUSTOMER_APP
        try:
            return super().create(validated_data)
        except DjangoValidationError as exc:
            if getattr(exc, "message_dict", None):
                raise serializers.ValidationError(exc.message_dict)
            raise serializers.ValidationError(
                list(getattr(exc, "messages", []) or [str(exc)])
            )


class AppointmentReadSerializer(serializers.ModelSerializer):
    business_id = serializers.IntegerField(source="business.id", read_only=True)
    business_name = serializers.CharField(source="business.name", read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "business_id",
            "business_name",
            "staff_id",
            "service_id",
            "starts_at",
            "ends_at",
            "status",
            "source",
            "customer_note",
            "created_at",
        )


class SlotItemSerializer(serializers.Serializer):
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField()


class AvailableSlotsResponseSerializer(serializers.Serializer):
    staff_id = serializers.IntegerField()
    service_id = serializers.IntegerField()
    date = serializers.DateField()
    slot_minutes = serializers.IntegerField()
    slots = SlotItemSerializer(many=True)


class AppointmentCreateResponseSerializer(serializers.ModelSerializer):
    business_id = serializers.IntegerField(source="business.id", read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "business_id",
            "staff_id",
            "service_id",
            "starts_at",
            "ends_at",
            "status",
            "source",
        )
