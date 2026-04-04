from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    AppointmentCreateView,
    AppointmentMeListView,
    AvailableSlotsView,
    BusinessViewSet,
    RegisterView,
)

router = DefaultRouter()
router.register(r"businesses", BusinessViewSet, basename="business")

urlpatterns = [
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
        "appointments/",
        AppointmentCreateView.as_view(),
        name="appointments-create",
    ),
    path("", include(router.urls)),
]
