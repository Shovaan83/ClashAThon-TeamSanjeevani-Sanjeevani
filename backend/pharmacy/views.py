from django.shortcuts import render

from pharmacy.models import Pharmacy, PharmacyDocument
from pharmacy.serializers import (
    RegisterPharmacySerializer, 
    PharmacyRealSerializer,
    PharmacyProfileSerializer,
    PharmacyProfileCreateSerializer
)
from utils.response import ResponseMixin
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import queue
import json
from django.http import StreamingHttpResponse


event_queue = queue.Queue()
connected_pharmacies = {}



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
    authentication_classes = []
    permission_classes = [AllowAny]

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


class PharmacyProfileView(ResponseMixin, APIView):
    """
    GET: Get current user's pharmacy profile
    POST: Create pharmacy profile (if doesn't exist)
    PUT/PATCH: Update pharmacy profile
    
    Supports FormData for document upload.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        """Get the pharmacy profile for the authenticated user"""
        try:
            pharmacy = Pharmacy.objects.get(user=request.user)
            serializer = PharmacyProfileSerializer(pharmacy, context={'request': request})
            return self.success_response(
                data=serializer.data,
                message="Pharmacy profile retrieved successfully"
            )
        except Pharmacy.DoesNotExist:
            return self.not_found_response(message="Pharmacy profile not found. Please create one.")

    def post(self, request):
        """Create a new pharmacy profile for the authenticated user"""
        # Check if user already has a pharmacy
        if Pharmacy.objects.filter(user=request.user).exists():
            return self.validation_error_response(
                message="Pharmacy profile already exists. Use PUT/PATCH to update."
            )
        
        # Check if user has PHARMACY role
        if request.user.role != 'PHARMACY':
            return self.validation_error_response(
                message="Only users with PHARMACY role can create pharmacy profiles."
            )

        serializer = PharmacyProfileCreateSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return self.validation_error_response(
                errors=serializer.errors,
                message="Invalid data provided"
            )
        
        pharmacy = serializer.save()
        
        # Return full profile data
        response_serializer = PharmacyProfileSerializer(pharmacy, context={'request': request})
        return self.success_response(
            data=response_serializer.data,
            message="Pharmacy profile created successfully",
            status_code=status.HTTP_201_CREATED
        )

    def put(self, request):
        """Update the pharmacy profile (full update)"""
        return self._update_profile(request, partial=False)

    def patch(self, request):
        """Partially update the pharmacy profile"""
        return self._update_profile(request, partial=True)

    def _update_profile(self, request, partial=False):
        """Helper method to update pharmacy profile"""
        try:
            pharmacy = Pharmacy.objects.get(user=request.user)
        except Pharmacy.DoesNotExist:
            return self.not_found_response(
                message="Pharmacy profile not found. Please create one first."
            )

        serializer = PharmacyProfileSerializer(
            pharmacy,
            data=request.data,
            partial=partial,
            context={'request': request}
        )

        if not serializer.is_valid():
            return self.validation_error_response(
                errors=serializer.errors,
                message="Invalid data provided"
            )

        serializer.save()
        return self.success_response(
            data=serializer.data,
            message="Pharmacy profile updated successfully"
        )


class PharmacyDocumentUploadView(ResponseMixin, APIView):
    """
    Dedicated endpoint for document upload only.
    Use this if you want to upload document separately.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """Upload or update pharmacy document"""
        try:
            pharmacy = Pharmacy.objects.get(user=request.user)
        except Pharmacy.DoesNotExist:
            return self.not_found_response(
                message="Pharmacy profile not found. Please create one first."
            )

        document_file = request.FILES.get('document')
        if not document_file:
            return self.validation_error_response(
                message="No document file provided"
            )

        # Update or create document
        pharmacy_doc, created = PharmacyDocument.objects.get_or_create(pharmacy=pharmacy)
        pharmacy_doc.document = document_file
        pharmacy_doc.status = 'PENDING'  # Reset status when new document uploaded
        pharmacy_doc.save()

        return self.success_response(
            data={
                'document_url': request.build_absolute_uri(pharmacy_doc.document.url),
                'status': pharmacy_doc.status
            },
            message="Document uploaded successfully"
        )


class PharmacyProfilePhotoUploadView(ResponseMixin, APIView):
    """
    Dedicated endpoint for profile photo upload only.
    Use this if you want to upload profile photo separately.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """Upload or update pharmacy profile photo"""
        try:
            pharmacy = Pharmacy.objects.get(user=request.user)
        except Pharmacy.DoesNotExist:
            return self.not_found_response(
                message="Pharmacy profile not found. Please create one first."
            )

        profile_photo_file = request.FILES.get('profile_photo')
        if not profile_photo_file:
            return self.validation_error_response(
                message="No profile photo file provided"
            )

        # Update profile photo
        pharmacy.profile_photo = profile_photo_file
        pharmacy.save()

        return self.success_response(
            data={
                'profile_photo_url': request.build_absolute_uri(pharmacy.profile_photo.url)
            },
            message="Profile photo uploaded successfully"
        )

    def delete(self, request):
        """Delete/remove pharmacy profile photo"""
        try:
            pharmacy = Pharmacy.objects.get(user=request.user)
        except Pharmacy.DoesNotExist:
            return self.not_found_response(
                message="Pharmacy profile not found."
            )

        if pharmacy.profile_photo:
            pharmacy.profile_photo.delete(save=True)
            return self.success_response(
                message="Profile photo removed successfully"
            )
        
        return self.validation_error_response(
            message="No profile photo to remove"
        )
