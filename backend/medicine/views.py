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
        Customer creates a medicine request (ping)
        Broadcasts to ALL nearby pharmacies in real-time
        """
        serializer = MedicineRequestSerializer(data=request.data)
        if serializer.is_valid():
            medicine_request = serializer.save(patient=request.user)
            
            # Get all nearby pharmacies
            nearby_pharmacies = medicine_request.get_nearby_pharmacies()
            
            if not nearby_pharmacies:
                return Response({
                    'message': 'No pharmacies found in your area',
                    'request_id': medicine_request.id
                }, status=status.HTTP_201_CREATED)
            
            # Broadcast to ALL nearby pharmacies via WebSocket
            channel_layer = get_channel_layer()
            print(f"\n=== Broadcasting to {len(nearby_pharmacies)} pharmacies ===")
            for item in nearby_pharmacies:
                pharmacy = item['pharmacy']
                distance = item['distance']
                
                print(f"Sending to pharmacy_{pharmacy.id} (distance: {distance:.2f}km)")
                
                async_to_sync(channel_layer.group_send)(
                    f"pharmacy_{pharmacy.id}",
                    {
                        'type': 'new_request',
                        'request_id': medicine_request.id,
                        'patient_name': request.user.name,
                        'patient_phone': request.user.phone_number,
                        'patient_location': {
                            'lat': medicine_request.patient_lat,
                            'lng': medicine_request.patient_lng
                        },
                        'distance_km': round(distance, 2),
                        'quantity': medicine_request.quantity,
                        'image_url': request.build_absolute_uri(medicine_request.image.url),
                        'timestamp': medicine_request.created_at.isoformat()
                    }
                )
            print("=== Broadcast complete ===\n")
            
            return Response({
                'message': f'Medicine request sent to {len(nearby_pharmacies)} nearby pharmacies',
                'request_id': medicine_request.id,
                'pharmacies_notified': len(nearby_pharmacies),
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        """
        Get all medicine requests for the authenticated user
        """
        if hasattr(request.user, 'pharmacy'):
            # If user is a pharmacy, get requests in their area
            pharmacy = request.user.pharmacy
            
            # Find requests where pharmacy is within radius
            all_requests = MedicineRequest.objects.filter(
                status='PENDING'
            ).select_related('patient')
            
            nearby_requests = []
            for req in all_requests:
                distance = MedicineRequest.calculate_distance(
                    pharmacy.lat, pharmacy.lng,
                    req.patient_lat, req.patient_lng
                )
                if distance <= req.radius_km:
                    nearby_requests.append(req)
            
            serializer = MedicineRequestSerializer(nearby_requests, many=True)
            return Response({
                'count': len(nearby_requests),
                'requests': serializer.data
            }, status=status.HTTP_200_OK)
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
        Notifies the customer in real-time
        """
        request_id = request.data.get('request_id')
        response_type = request.data.get('response_type')  # ACCEPTED or REJECTED
        text_message = request.data.get('text_message', '')
        audio_file = request.FILES.get('audio')
        
        try:
            medicine_request = MedicineRequest.objects.select_related('patient').get(id=request_id)
            
            # Check if request is still pending
            if medicine_request.status != 'PENDING':
                return Response({
                    'error': 'This request has already been accepted by another pharmacy'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get pharmacy
            pharmacy = request.user.pharmacy
            
            # Check if pharmacy already responded
            existing_response = PharmacyResponse.objects.filter(
                request=medicine_request,
                pharmacy=pharmacy
            ).first()
            
            if existing_response:
                return Response({
                    'error': 'You have already responded to this request'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create pharmacy response
            pharmacy_response = PharmacyResponse.objects.create(
                request=medicine_request,
                pharmacy=pharmacy,
                response_type=response_type,
                text_message=text_message,
                audio=audio_file
            )
            
            # If accepted, assign pharmacy and update status
            if response_type == 'ACCEPTED':
                medicine_request.pharmacy = pharmacy
                medicine_request.status = 'ACCEPTED'
                medicine_request.save()
                
                # Notify other pharmacies that request is taken
                nearby_pharmacies = medicine_request.get_nearby_pharmacies()
                channel_layer = get_channel_layer()
                
                for item in nearby_pharmacies:
                    other_pharmacy = item['pharmacy']
                    if other_pharmacy.id != pharmacy.id:
                        async_to_sync(channel_layer.group_send)(
                            f"pharmacy_{other_pharmacy.id}",
                            {
                                'type': 'request_taken',
                                'request_id': request_id,
                                'message': 'This request has been accepted by another pharmacy'
                            }
                        )
            
            # Send real-time notification to patient
            channel_layer = get_channel_layer()
            audio_url = None
            if pharmacy_response.audio:
                audio_url = request.build_absolute_uri(pharmacy_response.audio.url)
            
            async_to_sync(channel_layer.group_send)(
                f"user_{medicine_request.patient.id}",
                {
                    'type': 'pharmacy_response',
                    'request_id': request_id,
                    'response_type': response_type,
                    'pharmacy_id': pharmacy.id,
                    'pharmacy_name': request.user.name,
                    'pharmacy_location': {
                        'lat': pharmacy.lat,
                        'lng': pharmacy.lng
                    },
                    'message': text_message,
                    'audio_url': audio_url,
                    'timestamp': pharmacy_response.responded_at.isoformat()
                }
            )
            
            return Response({
                'message': f'Response sent successfully',
                'response_id': pharmacy_response.id,
                'response_type': response_type,
                'request_status': medicine_request.status
            }, status=status.HTTP_201_CREATED)
            
        except MedicineRequest.DoesNotExist:
            return Response({
                'error': 'Medicine request not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)