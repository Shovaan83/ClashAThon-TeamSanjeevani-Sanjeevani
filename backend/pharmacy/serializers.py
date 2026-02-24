from rest_framework import serializers
from accounts.serializers import RegisterUserSerializer
from pharmacy.models import Pharmacy, PharmacyDocument


class RegisterPharmacySerializer(serializers.ModelSerializer):
    user = RegisterUserSerializer()
    lat = serializers.FloatField(required=False)
    lng = serializers.FloatField(required=False)

    class Meta:
        model = Pharmacy
        fields = ["user", "lat", "lng"]

    # 🔹 Create pharmacy + document
    def create(self, validated_data):
        user_data = validated_data.pop("user")
        

        # Create user
        user_serializer = RegisterUserSerializer(data=user_data)
        user_serializer.is_valid(raise_exception=True)
        user = user_serializer.save()

        # Create pharmacy
        pharmacy = Pharmacy.objects.create(
            user=user,
            **validated_data
        )

        # Create pharmacy document
        PharmacyDocument.objects.create(
            pharmacy=pharmacy,
        )

        return pharmacy
    

class PharmacyRealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = "__all__"