from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "starts_at",
        "ends_at",
        "business",
        "staff",
        "service",
        "customer",
        "status",
        "source",
        "created_at",
    )
    list_filter = ("status", "source", "business")
    search_fields = (
        "customer__email",
        "customer__full_name",
        "staff__display_name",
        "service__name",
        "business__name",
    )
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("business", "customer", "staff", "service")
    date_hierarchy = "starts_at"
