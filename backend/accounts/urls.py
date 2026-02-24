from django.urls import path,include
from .views import PharmacyViewSet,RegisterUserEmail,VerifyOtpEmail

from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'register-user', PharmacyViewSet, basename='user')


urlpatterns = [
    path('users',include(router.urls)),
    path('send-otp',RegisterUserEmail.as_view()),
    path('verify-otp',VerifyOtpEmail.as_view())
]

