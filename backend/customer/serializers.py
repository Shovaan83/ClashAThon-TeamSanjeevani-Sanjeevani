from rest_framework import serializers
from accounts.models import CustomUser


class CustomerRegistrationSerializer(serializers.Serializer):
    """
    Serializer for customer registration
    """
    email = serializers.EmailField()
    name = serializers.CharField(max_length=200)
    phone_number = serializers.CharField(max_length=10)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    
    def validate_email(self, value):
        """Check if email already exists"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits")
        if len(value) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits")
        return value
    
    def validate(self, data):
        """Check if passwords match"""
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })
        return data


class CustomerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for customer profile
    """
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'name', 'phone_number', 'role', 'date_joined']
        read_only_fields = ['id', 'email', 'role', 'date_joined']


class CustomerLoginSerializer(serializers.Serializer):
    """
    Serializer for customer login
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
