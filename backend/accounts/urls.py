from django.urls import path,include
from .views import RegisterUserEmail,VerifyOtpEmail


urlpatterns = [
    # path('users',include(router.urls)),
    path('send-otp',RegisterUserEmail.as_view()),
    path('verify-otp',VerifyOtpEmail.as_view())
]

