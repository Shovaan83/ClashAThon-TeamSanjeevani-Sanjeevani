from rest_framework import serializers
from medicine.models import MedicineRequest, PharmacyResponse


class MedicineRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    pharmacy_name = serializers.CharField(source='pharmacy.user.name', read_only=True, allow_null=True)
    
    class Meta:
        model = MedicineRequest
        fields = '__all__'
        read_only_fields = ['patient', 'status', 'created_at', 'updated_at', 'pharmacy']


class PharmacyResponseSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.user.name', read_only=True)
    pharmacy_location = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = PharmacyResponse
        fields = '__all__'
        read_only_fields = ['responded_at']

    def get_pharmacy_location(self, obj):
        return {'lat': obj.pharmacy.lat, 'lng': obj.pharmacy.lng}

    def get_audio_url(self, obj):
        if not obj.audio:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.audio.url)
        return obj.audio.url