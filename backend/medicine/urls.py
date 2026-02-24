from django.urls import path
from medicine.views import MedicineRequestApiView, PharmacyResponseApiView

urlpatterns = [
    path('request/', MedicineRequestApiView.as_view(), name='medicine-request'),
    path('response/', PharmacyResponseApiView.as_view(), name='pharmacy-response'),
]
