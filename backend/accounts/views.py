from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets

from rest_framework import generics
from .models import CustomUser
# from .serializers import RegisterPharmacySerializer
from utils.response import ResponseMixin
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from utils.tokens import get_tokens_for_user
from utils.tasks import send_email_task
from utils.email import send_email
from utils.otp import generate_otp
from rest_framework.response import Response
from rest_framework import status

from .models import Otp

class RegisterUserEmail(ResponseMixin,APIView):
    def post(self,request):
        email = request.data.get('email')
        if not email:
            return self.validation_error_response(message="Please input email",errors="")
        check_email = CustomUser.objects.filter(email=email).first()
        if check_email:
            return self.validation_error_response(message="Email already exist")
        otp = generate_otp()
        
        # Update existing OTP or create new one
        store_otp, created = Otp.objects.update_or_create(
            email=email,
            defaults={'otp': otp, 'is_verified': False}
        )

        # Send email directly (synchronous) - revert back as Celery setup is complex
        # The WinError 10060 is likely a network/SMTP configuration issue, not async related
        try:
            send_email(email, "Your OTP", f"Your OTP code is: {otp}. Please use this to verify your email address. It will expire in 10 minutes.")
        except Exception as e:
            return Response({'error': f'Failed to send OTP: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'OTP sent successfully.'}, status=status.HTTP_200_OK)
    
    

class VerifyOtpEmail(ResponseMixin,APIView):
    def post(self,request):
        email = request.data.get("email")
        otp  = request.data.get("otp")

        if not email or not otp:
            return self.validation_error_response(message="Please input all the fields",errors="")
        
        check_email = Otp.objects.filter(email=email).first()
        if not check_email:
            return self.validation_error_response(message="Email Not found",errors="")
        db_otp = check_email.otp
        if (db_otp!=otp):
            return self.validation_error_response(errors="",message="Otp doesnt match")
        
        # Mark OTP as verified
        check_email.is_verified = True
        check_email.save()
        
        return self.success_response(data={
            'email':email,
            'otp':otp
        },message="Otp verified successfully")




class LoginView(ResponseMixin,APIView):
    """
    Unified login for all user types (Customer, Pharmacy, Admin)
    Returns user data with role for frontend routing
    """
    def post(self,request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return self.validation_error_response(
                message="Email and password are required"
            )

        exist_email = CustomUser.objects.filter(email=email).first()
        if not exist_email:
            return self.unauthorized_response(message="Email not found")
        
        user_ok = authenticate(username=email, password=password)
        if user_ok is None:
            return self.unauthorized_response(message="Incorrect password")
        
        token = get_tokens_for_user(user_ok)
        
        return self.success_response(
            data={
                'user': {
                    'id': user_ok.id,
                    'email': user_ok.email,
                    'name': user_ok.name,
                    'phone_number': user_ok.phone_number,
                    'role': user_ok.role  # CUSTOMER, PHARMACY, or ADMIN
                },
                'tokens': token
            },
            message="Login successful"
        )
    
