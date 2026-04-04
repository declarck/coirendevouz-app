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


class UserMeSerializer(serializers.ModelSerializer):
    """Minimal/Zone şablonları `displayName` / `photoURL` bekleyebilir."""

    displayName = serializers.CharField(source="full_name", read_only=True)
    photoURL = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "displayName", "phone", "role", "photoURL")

    @extend_schema_field({"type": "string", "format": "uri", "nullable": True})
    def get_photoURL(self, obj) -> None:
        return None


class UserMePatchSerializer(serializers.ModelSerializer):
    """PATCH /users/me/ — ad ve telefon (e-posta / rol değişmez)."""

    class Meta:
        model = User
        fields = ("full_name", "phone")
        extra_kwargs = {
            "full_name": {"required": False},
            "phone": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "En az full_name veya phone gönderilmelidir."
            )
        return attrs


class UserMeEnvelopeSerializer(serializers.Serializer):
    """GET/PATCH `{"user": ...}` gövdesi — OpenAPI."""

    user = UserMeSerializer()


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ("id", "name", "duration_minutes", "price", "is_active")


class ServiceWriteSerializer(serializers.ModelSerializer):
    """Panel oluşturma/güncelleme — `business` URL ile gelir."""

    duration_minutes = serializers.IntegerField(min_value=1)

    class Meta:
        model = Service
        fields = ("name", "duration_minutes", "price", "is_active")
        extra_kwargs = {
            "is_active": {"required": False},
        }

    def create(self, validated_data):
        validated_data.setdefault("is_active", True)
        return super().create(validated_data)


class StaffSerializer(serializers.ModelSerializer):
    service_ids = serializers.SerializerMethodField()

    class Meta:
        model = Staff
        fields = (
            "id",
            "display_name",
            "is_active",
            "service_ids",
            "user_id",
            "working_hours",
            "working_hours_exceptions",
        )

    @extend_schema_field({"type": "array", "items": {"type": "integer"}})
    def get_service_ids(self, obj: Staff) -> list[int]:
        return list(
            StaffService.objects.filter(
                staff=obj, is_active=True
            ).values_list("service_id", flat=True)
        )


class StaffWriteSerializer(serializers.ModelSerializer):
    """Panel oluşturma/güncelleme — `business` URL ile gelir."""

    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Staff
        fields = (
            "display_name",
            "working_hours",
            "working_hours_exceptions",
            "is_active",
            "user",
        )
        extra_kwargs = {
            "working_hours": {"required": False, "allow_null": True},
            "working_hours_exceptions": {"required": False, "allow_null": True},
            "is_active": {"required": False},
        }

    def validate_working_hours(self, value):
        from business.working_hours import validate_staff_working_hours

        validate_staff_working_hours(value)
        return value

    def validate_working_hours_exceptions(self, value):
        from business.working_hours import validate_staff_working_hours_exceptions

        validate_staff_working_hours_exceptions(value)
        return value

    def create(self, validated_data):
        validated_data.setdefault("is_active", True)
        return super().create(validated_data)


class StaffServiceAssignmentSerializer(serializers.Serializer):
    """PUT `.../staff/{id}/services/` — listenin tamamı işletme içi hizmet PK'leri."""

    service_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=True,
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


class AppointmentBusinessPatchSerializer(serializers.ModelSerializer):
    """İşletme paneli PATCH — durum ve/veya iç not."""

    class Meta:
        model = Appointment
        fields = ("status", "internal_note")
        extra_kwargs = {
            "status": {"required": False},
            "internal_note": {"required": False},
        }

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "En az status veya internal_note gönderilmelidir."
            )
        return attrs


class AppointmentBusinessReadSerializer(serializers.ModelSerializer):
    """İşletme yanıtı — `internal_note` dahil (müşteri /me listesinde yok)."""

    business_id = serializers.IntegerField(source="business.id", read_only=True)
    business_name = serializers.CharField(source="business.name", read_only=True)
    staff_display_name = serializers.CharField(source="staff.display_name", read_only=True)
    service_name = serializers.CharField(source="service.name", read_only=True)
    customer_full_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_phone = serializers.CharField(source="customer.phone", read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "business_id",
            "business_name",
            "staff_id",
            "staff_display_name",
            "service_id",
            "service_name",
            "customer_full_name",
            "customer_phone",
            "starts_at",
            "ends_at",
            "status",
            "source",
            "customer_note",
            "internal_note",
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


class ManualAppointmentSerializer(serializers.Serializer):
    """POST .../appointments/manual/ — işletme paneli."""

    staff_id = serializers.IntegerField(min_value=1)
    service_id = serializers.IntegerField(min_value=1)
    starts_at = serializers.DateTimeField()
    customer_user_id = serializers.IntegerField(min_value=1)
    internal_note = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        business_id = self.context["business_id"]
        staff_id = attrs["staff_id"]
        service_id = attrs["service_id"]
        cust_id = attrs["customer_user_id"]

        try:
            staff = Staff.objects.get(pk=staff_id, business_id=business_id)
        except Staff.DoesNotExist:
            raise serializers.ValidationError(
                {"staff_id": "Personel bu işletmeye ait değil."}
            )
        if not staff.is_active:
            raise serializers.ValidationError({"staff_id": "Personel pasif."})

        try:
            service = Service.objects.get(pk=service_id, business_id=business_id)
        except Service.DoesNotExist:
            raise serializers.ValidationError(
                {"service_id": "Hizmet bu işletmeye ait değil."}
            )
        if not service.is_active:
            raise serializers.ValidationError({"service_id": "Hizmet pasif."})

        if not StaffService.objects.filter(
            staff_id=staff_id,
            service_id=service_id,
            is_active=True,
        ).exists():
            raise serializers.ValidationError(
                "Bu personel bu hizmeti veremiyor veya eşleşme pasif."
            )

        try:
            customer = User.objects.get(pk=cust_id)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"customer_user_id": "Kullanıcı bulunamadı."}
            )
        if customer.role != User.Role.CUSTOMER:
            raise serializers.ValidationError(
                {
                    "customer_user_id": (
                        "Randevu yalnızca müşteri rolündeki hesaba atanabilir."
                    )
                }
            )

        return attrs


class ManualAppointmentResponseSerializer(serializers.ModelSerializer):
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
            "internal_note",
        )


class ScheduleServiceNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class ScheduleStaffNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    display_name = serializers.CharField()


class ScheduleCustomerNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    phone = serializers.CharField()


class ScheduleAppointmentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField()
    status = serializers.CharField()
    service = ScheduleServiceNestedSerializer()
    staff = ScheduleStaffNestedSerializer()
    customer = ScheduleCustomerNestedSerializer()


class ScheduleResponseSerializer(serializers.Serializer):
    business_id = serializers.IntegerField()
    appointments = ScheduleAppointmentSerializer(many=True)
