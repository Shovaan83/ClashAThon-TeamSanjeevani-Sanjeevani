from django.urls import path
from .views import (
    AdminPharmacyListView, 
    AdminPharmacyDetailView, 
    AdminPharmacyDocumentsView,
    admin_kyc_action
)

urlpatterns = [
    # Pharmacy list with pagination (supports ?page=1&page_size=10&status=PENDING&search=query)
    path('pharmacies/', AdminPharmacyListView.as_view(), name='admin-pharmacy-list'),
    
    # Pharmacy detail
    path('pharmacy/<int:id>/', AdminPharmacyDetailView.as_view(), name='admin-pharmacy-detail'),
    
    # Pharmacy documents/KYC list with pagination (supports ?page=1&status=PENDING)
    path('pharmacy-documents/', AdminPharmacyDocumentsView.as_view(), name='admin-pharmacy-documents'),
    
    # KYC action (approve/reject)
    path('pharmacy/<int:pharmacy_id>/kyc/', admin_kyc_action, name='admin-pharmacy-kyc'),
]