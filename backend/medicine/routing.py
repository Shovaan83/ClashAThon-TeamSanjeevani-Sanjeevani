from django.urls import re_path
from medicine.consumers import MedicineRequestConsumer, PharmacyConsumer

websocket_urlpatterns = [
    # User WebSocket - for receiving pharmacy responses
    re_path(r'ws/user/(?P<user_id>\w+)/$', MedicineRequestConsumer.as_asgi()),
    
    # Pharmacy WebSocket - for receiving medicine requests and sending responses
    re_path(r'ws/pharmacy/(?P<pharmacy_id>\w+)/$', PharmacyConsumer.as_asgi()),
]
