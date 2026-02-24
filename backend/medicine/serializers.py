from rest_framework import serializers
from medicine.models import MedicineRequest, PharmacyResponse


class MedicineRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    pharmacy_name = serializers.CharField(source='pharmacy.user.name', read_only=True)
    
    class Meta:
        model = MedicineRequest
        fields = '__all__'
        read_only_fields = ['status', 'created_at', 'updated_at']


class PharmacyResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacyResponse
        fields = '__all__'
        read_only_fields = ['responded_at']