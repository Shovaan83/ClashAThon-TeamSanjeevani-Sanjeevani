from django.shortcuts import render

from pharmacy.models import Pharmacy
from pharmacy.serializers import RegisterPharmacySerializer, PharmacyRealSerializer
from utils.response import ResponseMixin
from rest_framework import viewsets
from rest_framework import status
import queue
import json
from django.http import StreamingHttpResponse


event_queue = queue.Queue()


# yeslae changes haru herna ka lagi
def sse_pharmacy(request):
    def event_stream():
        while True:
            event = event_queue.get() 
            yield f"data: {json.dumps(event)}\n\n" 

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response["Cache-Control"] = "no-cache"
    return response



# yesla changes haru notify garna ka lagi
def notify_pharmacy(image_id):
    event_queue.put({
        "type": "NEW_PRESCRIPTION_IMAGE",   
        "image_id": image_id,
        "url": f"/media/prescriptions/{image_id}.jpg"
    })






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
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return self.success_response(
            data=serializer.data,
            message="Pharmacy list retrieved successfully",
            status_code=status.HTTP_200_OK
        )
    






    