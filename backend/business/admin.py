from django.contrib import admin

from .models import Business, Service, Staff, StaffService


class StaffServiceInline(admin.TabularInline):
    model = StaffService
    extra = 0
    autocomplete_fields = ("service",)


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "category", "city", "owner", "is_active", "created_at")
    list_filter = ("category", "is_active", "city")
    search_fields = ("name", "slug", "address_line", "city", "district")
    readonly_fields = ("slug", "created_at", "updated_at")
    raw_id_fields = ("owner",)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "business", "duration_minutes", "price", "is_active")
    list_filter = ("is_active", "business")
    search_fields = ("name", "business__name")
    autocomplete_fields = ("business",)


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ("display_name", "business", "user", "is_active")
    list_filter = ("is_active", "business")
    search_fields = ("display_name", "business__name")
    autocomplete_fields = ("business", "user")
    inlines = (StaffServiceInline,)


@admin.register(StaffService)
class StaffServiceAdmin(admin.ModelAdmin):
    list_display = (
        "staff",
        "service",
        "duration_minutes_override",
        "is_active",
    )
    list_filter = ("is_active",)
    autocomplete_fields = ("staff", "service")
