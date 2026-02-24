
from rest_framework import serializers
from .models import Pharmacy,CustomUser


class RegisterUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser

    
    def validate_email(self):
        pass
    

class RegisterPharmacySerializer(serializers.ModelSerializer):
    user = RegisterUserSerializer()
    class Meta:
        model = Pharmacy
        pharmacy_document = serializers.ImageField()
        fields = ['user','lat','lng','pharmacy_document']
    
    def create(self,validated_data):
        

        pass
    

    

