from django.urls import re_path
from medicine.consumers import CustomerConsumer, PharmacyConsumer

websocket_urlpatterns = [
    # Customer WebSocket - automatically uses authenticated user
    # Connect with: ws://localhost:8000/ws/customer/?token=<jwt_token>
    re_path(r'ws/customer/$', CustomerConsumer.as_asgi()),
    
    # Pharmacy WebSocket - automatically uses authenticated pharmacy
    # Connect with: ws://localhost:8000/ws/pharmacy/?token=<jwt_token>
    re_path(r'ws/pharmacy/$', PharmacyConsumer.as_asgi()),
]
