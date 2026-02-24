from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Pharmacy, PharmacyDocument

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
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data["name"],
            phone_number=validated_data["phone_number"],
            role=CustomUser.Types.PHARMACY,
        )
        return user



class RegisterPharmacySerializer(serializers.ModelSerializer):
    user = RegisterUserSerializer()
    pharmacy_document = serializers.ImageField(write_only=True)

    class Meta:
        model = Pharmacy
        fields = ["user", "lat", "lng", "pharmacy_document"]


    def validate(self, data):
        if not data.get("lat"):
            raise serializers.ValidationError("Latitude is required")

        if not data.get("lng"):
            raise serializers.ValidationError("Longitude is required")

        return data


    def create(self, validated_data):
        user_data = validated_data.pop("user")
        document_file = validated_data.pop("pharmacy_document")


        user_serializer = RegisterUserSerializer(data=user_data)
        user_serializer.is_valid(raise_exception=True)
        user = user_serializer.save()


        pharmacy = Pharmacy.objects.create(
            user=user,
            **validated_data
        )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

        PharmacyDocument.objects.create(
            pharmacy=pharmacy,
            document=document_file
        )

        return pharmacy