from rest_framework import serializers
from medicine.models import MedicineRequest


class MedicineRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineRequest
        fields = "__all__"

