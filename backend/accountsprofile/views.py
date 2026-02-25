from rest_framework import generics
from .models import PharmacyProfile
from .serializers import PharmacyProfileSerializer

class PharmacyProfileCreateView(generics.CreateAPIView):
    serializer_class = PharmacyProfileSerializer
    queryset = PharmacyProfile.objects.all()

class PharmacyProfileUpdateView(generics.UpdateAPIView):
    serializer_class = PharmacyProfileSerializer
    queryset = PharmacyProfile.objects.all()