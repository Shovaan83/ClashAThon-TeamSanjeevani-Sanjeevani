from django.urls import path, include
from .views import RegisterUserEmail, VerifyOtpEmail, LoginView
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path('send-otp', RegisterUserEmail.as_view()),
    path('verify-otp', VerifyOtpEmail.as_view()),
    path('login', LoginView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
]

