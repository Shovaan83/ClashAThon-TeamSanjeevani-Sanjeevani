from django.urls import path
from rest_framework.routers import DefaultRouter

from pharmacy.views import (
    PharmacyViewSet, 
    sse_pharmacy, 
    PharmacyProfileView,
    PharmacyDocumentUploadView,
    PharmacyProfilePhotoUploadView
)

router = DefaultRouter()
router.register(r'register-pharmacy', PharmacyViewSet, basename='pharmacy')

urlpatterns = [
    path("events/", sse_pharmacy, name="pharmacy-sse"),
    
    # Pharmacy Profile endpoints (auth required)
    path("pharmacy/profile/", PharmacyProfileView.as_view(), name="pharmacy-profile"),
    path("pharmacy/document/upload/", PharmacyDocumentUploadView.as_view(), name="pharmacy-document-upload"),
    path("pharmacy/profile-photo/upload/", PharmacyProfilePhotoUploadView.as_view(), name="pharmacy-profile-photo-upload"),
]

urlpatterns += router.urls