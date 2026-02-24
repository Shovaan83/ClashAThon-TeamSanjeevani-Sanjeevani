from django.urls import path
from rest_framework.routers import DefaultRouter

from pharmacy.views import PharmacyViewSet, sse_pharmacy

router = DefaultRouter()
router.register(r'register-pharmacy', PharmacyViewSet, basename='pharmacy')

urlpatterns = [
    path("events/", sse_pharmacy, name="pharmacy-sse"),
]

urlpatterns += router.urls