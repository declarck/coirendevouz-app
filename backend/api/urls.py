from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    AppointmentBusinessPatchView,
    AppointmentCreateView,
    AppointmentMeListView,
    AvailableSlotsView,
    BusinessDashboardStatsView,
    BusinessManualAppointmentView,
    BusinessMineListView,
    BusinessScheduleView,
    BusinessServiceViewSet,
    BusinessStaffViewSet,
    BusinessViewSet,
    StaffServicesAssignmentView,
    RegisterView,
    UserMeView,
)

router = DefaultRouter()
router.register(r"businesses", BusinessViewSet, basename="business")

urlpatterns = [
    path("users/me/", UserMeView.as_view(), name="users-me"),
    path(
        "businesses/mine/",
        BusinessMineListView.as_view(),
        name="businesses-mine",
    ),
    path(
        "businesses/<int:business_id>/schedule/",
        BusinessScheduleView.as_view(),
        name="business-schedule",
    ),
    path(
        "businesses/<int:business_id>/dashboard-stats/",
        BusinessDashboardStatsView.as_view(),
        name="business-dashboard-stats",
    ),
    path(
        "businesses/<int:business_id>/appointments/manual/",
        BusinessManualAppointmentView.as_view(),
        name="business-appointments-manual",
    ),
    path(
        "businesses/<int:business_id>/services/",
        BusinessServiceViewSet.as_view({"get": "list", "post": "create"}),
        name="business-services-list",
    ),
    path(
        "businesses/<int:business_id>/services/<int:pk>/",
        BusinessServiceViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="business-services-detail",
    ),
    path(
        "businesses/<int:business_id>/staff/",
        BusinessStaffViewSet.as_view({"get": "list", "post": "create"}),
        name="business-staff-list",
    ),
    path(
        "businesses/<int:business_id>/staff/<int:staff_id>/services/",
        StaffServicesAssignmentView.as_view(),
        name="business-staff-services-assignment",
    ),
    path(
        "businesses/<int:business_id>/staff/<int:pk>/",
        BusinessStaffViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="business-staff-detail",
    ),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path(
        "appointments/available-slots/",
        AvailableSlotsView.as_view(),
        name="appointments-available-slots",
    ),
    path(
        "appointments/me/",
        AppointmentMeListView.as_view(),
        name="appointments-me",
    ),
    path(
        "appointments/<int:pk>/",
        AppointmentBusinessPatchView.as_view(),
        name="appointments-business-patch",
    ),
    path(
        "appointments/",
        AppointmentCreateView.as_view(),
        name="appointments-create",
    ),
    path("", include(router.urls)),
]
