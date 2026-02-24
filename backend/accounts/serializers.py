from rest_framework import serializers
from django.contrib.auth import get_user_model
# from .models import Pharmacy, PharmacyDocument

CustomUser = get_user_model()



class RegisterUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ["email", "password", "name", "phone_number"]


    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_phone_number(self, value):
        if len(value) != 10:
            raise serializers.ValidationError("Phone number must be 10 digits")
        return value


    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data["name"],
            phone_number=validated_data["phone_number"],
            role=CustomUser.Types.PHARMACY,
        )
        return user

