from django.urls import path
from .views import PharmacyProfileCreateView, PharmacyProfileUpdateView

urlpatterns = [
    path('create/', PharmacyProfileCreateView.as_view(), name='pharmacy-profile-create'),
    path('profile/<int:pk>/update/', PharmacyProfileUpdateView.as_view(), name='pharmacy-profile-update'),
]