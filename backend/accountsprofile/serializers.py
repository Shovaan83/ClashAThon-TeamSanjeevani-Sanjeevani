from rest_framework import serializers
from .models import PharmacyProfile, Pharmacy, PharmacyDocument

class PharmacyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacyDocument
        fields = ['id', 'document', 'status', 'is_active']

class PharmacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = ['id', 'lat', 'lng']




class PharmacyProfileSerializer(serializers.ModelSerializer):
    pharmacy = PharmacySerializer()
    pharmacy_docs = PharmacyDocumentSerializer()

    class Meta:
        model = PharmacyProfile
        fields = ['pharmacy', 'pharmacy_docs', 'phone_number', 'address']