from django.shortcuts import render


# Create your views here.


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from accounts.models import CustomUser, Otp
from utils.response import ResponseMixin
from utils.tokens import get_tokens_for_user
from customer.serializers import CustomerRegistrationSerializer, CustomerProfileSerializer


class CustomerRegistrationView(ResponseMixin, APIView):
    """
    Complete customer registration after OTP verification
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        
        # Check if OTP is verified
        check_otp = Otp.objects.filter(email=email, is_verified=True).first()
        if not check_otp:
            return self.validation_error_response(
                message="Please verify your email with OTP first"
            )
        
        serializer = CustomerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            # Create customer user
            user = CustomUser.objects.create_user(
                email=serializer.validated_data['email'],
                username=serializer.validated_data['email'],
                name=serializer.validated_data['name'],
                phone_number=serializer.validated_data['phone_number'],
                password=serializer.validated_data['password'],
                role=CustomUser.Types.CUSTOMER
            )
            
            # Delete OTP record after successful registration
            check_otp.delete()
            
            # Generate tokens
            tokens = get_tokens_for_user(user)
            
            return self.success_response(
                data={
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'name': user.name,
                        'phone_number': user.phone_number,
                        'role': user.role
                    },
                    'tokens': tokens
                },
                message="Registration successful",
                status_code=status.HTTP_201_CREATED
            )
        
        return self.validation_error_response(
            errors=serializer.errors,
            message="Registration failed"
        )


class CustomerProfileView(ResponseMixin, APIView):
    """
    Get and update customer profile
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get customer profile"""
        if request.user.role != CustomUser.Types.CUSTOMER:
            return self.unauthorized_response(
                message="Only customers can access this endpoint"
            )
        
        serializer = CustomerProfileSerializer(request.user)
        return self.success_response(
            data=serializer.data,
            message="Profile retrieved successfully"
        )
    
    def put(self, request):
        """Update customer profile"""
        if request.user.role != CustomUser.Types.CUSTOMER:
            return self.unauthorized_response(
                message="Only customers can access this endpoint"
            )
        
        serializer = CustomerProfileSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return self.success_response(
                data=serializer.data,
                message="Profile updated successfully"
            )
        
        return self.validation_error_response(
            errors=serializer.errors,
            message="Profile update failed"
        )


class CustomerMedicineRequestsView(ResponseMixin, APIView):
    """
    Get all medicine requests for logged-in customer
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get customer's medicine requests"""
        from medicine.models import MedicineRequest
        from medicine.serializers import MedicineRequestSerializer
        
        if request.user.role != CustomUser.Types.CUSTOMER:
            return self.unauthorized_response(
                message="Only customers can access this endpoint"
            )
        
        requests = MedicineRequest.objects.filter(
            patient=request.user
        ).select_related('pharmacy').order_by('-created_at')
        
        serializer = MedicineRequestSerializer(requests, many=True)
        
        return self.success_response(
            data={
                'count': requests.count(),
                'requests': serializer.data
            },
            message="Medicine requests retrieved successfully"
        )

