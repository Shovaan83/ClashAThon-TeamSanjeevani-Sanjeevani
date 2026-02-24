from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from medicine.serializers import MedicineRequestSerializer, PharmacyResponseSerializer
from medicine.models import MedicineRequest, PharmacyResponse
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class MedicineRequestApiView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Create a new medicine request and notify pharmacy in real-time via WebSocket
        """
        serializer = MedicineRequestSerializer(data=request.data)
        if serializer.is_valid():
            medicine_request = serializer.save()
            
            # Send real-time notification to pharmacy via WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"pharmacy_{medicine_request.pharmacy.id}",
                {
                    'type': 'new_request',
                    'request_id': medicine_request.id,
                    'patient_name': medicine_request.patient.name,
                    'patient_phone': medicine_request.patient.phone_number,
                    'quantity': medicine_request.quantity,
                    'image_url': request.build_absolute_uri(medicine_request.image.url),
                    'timestamp': medicine_request.created_at.isoformat()
                }
            )
            
            return Response({
                'message': 'Medicine request sent successfully',
                'request_id': medicine_request.id,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        """
        Get all medicine requests for the authenticated user
        """
        if hasattr(request.user, 'pharmacy'):
            # If user is a pharmacy, get requests for their pharmacy
            requests = MedicineRequest.objects.filter(
                pharmacy=request.user.pharmacy
            ).select_related('patient').order_by('-created_at')
        else:
            # If regular user, get their own requests
            requests = MedicineRequest.objects.filter(
                patient=request.user
            ).select_related('pharmacy').order_by('-created_at')
        
        serializer = MedicineRequestSerializer(requests, many=True)
        return Response({
            'count': requests.count(),
            'requests': serializer.data
        }, status=status.HTTP_200_OK)


class PharmacyResponseApiView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Pharmacy responds to a medicine request (accept/reject) with optional audio
        This also notifies the user in real-time via WebSocket
        """
        request_id = request.data.get('request_id')
        response_status = request.data.get('status')  # ACCEPTED or REJECTED
        text_message = request.data.get('text_message', '')
        audio_file = request.FILES.get('audio')
        
        try:
            medicine_request = MedicineRequest.objects.select_related('patient').get(id=request_id)
            
            # Update request status
            medicine_request.status = response_status
            medicine_request.save()
            
            # Create pharmacy response
            pharmacy_response = PharmacyResponse.objects.create(
                request=medicine_request,
                text_message=text_message,
                audio=audio_file
            )
            
            # Send real-time notification to user via WebSocket
            channel_layer = get_channel_layer()
            audio_url = None
            if pharmacy_response.audio:
                audio_url = request.build_absolute_uri(pharmacy_response.audio.url)
            
            async_to_sync(channel_layer.group_send)(
                f"user_{medicine_request.patient.id}",
                {
                    'type': 'pharmacy_response',
                    'request_id': request_id,
                    'status': response_status,
                    'message': text_message,
                    'audio_url': audio_url,
                    'pharmacy_name': request.user.name,
                    'timestamp': pharmacy_response.responded_at.isoformat()
                }
            )
            
            return Response({
                'message': 'Response sent successfully',
                'response_id': pharmacy_response.id,
                'status': response_status
            }, status=status.HTTP_201_CREATED)
            
        except MedicineRequest.DoesNotExist:
            return Response({
                'error': 'Medicine request not found'
            }, status=status.HTTP_404_NOT_FOUND)