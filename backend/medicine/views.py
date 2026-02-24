from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class MedicineRequestApiView(APIView):
    def post(self,request):
        serializer = MedicineRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return self.validation_error_response(errors=serializer.errors,message="something went wrong")
        
        medicine_request = serializer.save()
        notify_pharmacy(medicine_request.image.name.split("/")[-1].split(".")[0])
        return self.success_response(
            data=serializer.data,
            message="Medicine request created successfully",
            status_code=status.HTTP_201_CREATED
        )