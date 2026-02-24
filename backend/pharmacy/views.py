from django.shortcuts import render

from pharmacy.models import Pharmacy
from pharmacy.serializers import RegisterPharmacySerializer
from utils.response import ResponseMixin
from rest_framework import viewsets
from rest_framework import status




class PharmacyViewSet(ResponseMixin, viewsets.ModelViewSet):
    queryset = Pharmacy.objects.all()
    serializer_class = RegisterPharmacySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return self.validation_error_response(errors=serializer.errors,message="something went wrong")

        pharmacy = serializer.save()



        return self.success_response(
            data=serializer.data,
            message="Pharmacy registered successfully",
            status_code=status.HTTP_201_CREATED
        )
    
    