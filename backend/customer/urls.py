from django.urls import path
from customer.views import (
    CustomerRegistrationView,
    CustomerProfileView,
    CustomerMedicineRequestsView
)

urlpatterns = [
    # Registration (OTP sending/verification handled by accounts app)
    # Login is also handled by accounts app at /login (unified for all user types)
    path('register/', CustomerRegistrationView.as_view(), name='customer-register'),
    
    # Profile management
    path('profile/', CustomerProfileView.as_view(), name='customer-profile'),
    
    # Medicine requests
    path('requests/', CustomerMedicineRequestsView.as_view(), name='customer-requests'),
]
