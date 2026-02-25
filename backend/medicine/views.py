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
            # If user is a pharmacy, get pending requests in their area
            pharmacy = request.user.pharmacy

            all_pending = MedicineRequest.objects.filter(
                status='PENDING'
            ).select_related('patient')

            # Exclude requests this pharmacy has already responded to so they
            # don't re-appear in the pending list after a reject.
            already_responded_ids = set(
                PharmacyResponse.objects.filter(pharmacy=pharmacy)
                .values_list('request_id', flat=True)
            )

            nearby_requests = []
            for req in all_pending:
                if req.id in already_responded_ids:
                    continue
                distance = MedicineRequest.calculate_distance(
                    pharmacy.lat, pharmacy.lng,
                    req.patient_lat, req.patient_lng
                )
                if distance <= req.radius_km:
                    nearby_requests.append(req)

            # Requests this pharmacy has accepted or responded to
            history_requests = MedicineRequest.objects.filter(
                pharmacy=pharmacy
            ).select_related('patient').order_by('-updated_at')[:50]

            # Real stats from PharmacyResponse records
            accepted_count = PharmacyResponse.objects.filter(
                pharmacy=pharmacy, response_type='ACCEPTED'
            ).count()
            rejected_count = PharmacyResponse.objects.filter(
                pharmacy=pharmacy, response_type='REJECTED'
            ).count()

            pending_serializer = MedicineRequestSerializer(nearby_requests, many=True)
            history_serializer = MedicineRequestSerializer(history_requests, many=True)

            return Response({
                'count': len(nearby_requests),
                'requests': pending_serializer.data,
                'history': history_serializer.data,
                'stats': {
                    'accepted': accepted_count,
                    'rejected': rejected_count,
                },
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
        Pharmacy responds to a medicine request (accept/reject/substitute) with optional audio
        Notifies the customer in real-time
        """
        request_id = request.data.get('request_id')
        response_type = request.data.get('response_type')  # ACCEPTED, REJECTED, or SUBSTITUTE
        text_message = request.data.get('text_message', '')
        audio_file = request.FILES.get('audio')
        substitute_name = request.data.get('substitute_name', '')
        substitute_price_raw = request.data.get('substitute_price')
        substitute_price = None
        if substitute_price_raw not in (None, ''):
            try:
                substitute_price = float(substitute_price_raw)
            except (ValueError, TypeError):
                substitute_price = None
        
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
                audio=audio_file,
                substitute_name=substitute_name,
                substitute_price=substitute_price,
            )

            # Request stays PENDING — the patient now picks which pharmacy to use.
            # The status will only change to ACCEPTED via POST /medicine/select/.

            # Send real-time notification to patient
            channel_layer = get_channel_layer()
            audio_url = None
            if pharmacy_response.audio:
                print(f"Audio file uploaded: {pharmacy_response.audio.url}")
                audio_url = (pharmacy_response.audio.url)
            
            async_to_sync(channel_layer.group_send)(
                f"user_{medicine_request.patient.id}",
                {
                    'type': 'pharmacy_response',
                    'response_id': pharmacy_response.id,
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
                    'substitute_name': substitute_name or None,
                    'substitute_price': str(substitute_price) if substitute_price is not None else None,
                    'timestamp': pharmacy_response.responded_at.isoformat()
                }
            )
            
            return Response({
                'message': 'Response sent successfully',
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

    def get(self, request):
        """
        Get all responses for the authenticated pharmacy
        """
        if not hasattr(request.user, 'pharmacy'):
            return Response({
                'error': 'Only pharmacies can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)
        
        pharmacy = request.user.pharmacy
        responses = PharmacyResponse.objects.filter(
            pharmacy=pharmacy
        ).select_related('request__patient').order_by('-responded_at')
        
        serializer = PharmacyResponseSerializer(responses, many=True)
        return Response({
            'count': responses.count(),
            'responses': serializer.data
        }, status=status.HTTP_200_OK)


class PatientSelectPharmacyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Patient selects one of the pharmacy offers for their active request.
        Body: { response_id: int }

        - Marks the MedicineRequest as ACCEPTED and assigns the chosen pharmacy.
        - Sends a `pharmacy_selected` WebSocket event to the chosen pharmacy.
        - Sends a `request_taken` WebSocket event to all other nearby pharmacies.
        """
        response_id = request.data.get('response_id')
        if not response_id:
            return Response({'error': 'response_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pharmacy_response = PharmacyResponse.objects.select_related(
                'request', 'request__patient', 'pharmacy', 'pharmacy__user'
            ).get(id=response_id)
        except PharmacyResponse.DoesNotExist:
            return Response({'error': 'Pharmacy response not found'}, status=status.HTTP_404_NOT_FOUND)

        medicine_request = pharmacy_response.request

        # Only the owning patient may select
        if medicine_request.patient != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        # Can only select while request is still open
        if medicine_request.status != 'PENDING':
            return Response(
                {'error': 'This request has already been fulfilled'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cannot select a pharmacy that declined
        if pharmacy_response.response_type not in ('ACCEPTED', 'SUBSTITUTE'):
            return Response(
                {'error': 'Cannot select a pharmacy that declined the request'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_pharmacy = pharmacy_response.pharmacy

        # Finalise the request
        medicine_request.status = 'ACCEPTED'
        medicine_request.pharmacy = selected_pharmacy
        medicine_request.save()

        channel_layer = get_channel_layer()

        # Tell the chosen pharmacy they were selected
        async_to_sync(channel_layer.group_send)(
            f"pharmacy_{selected_pharmacy.id}",
            {
                'type': 'pharmacy_selected',
                'request_id': medicine_request.id,
                'patient_name': request.user.name,
                'message': f'{request.user.name} has chosen you for their medicine request. Please prepare the medicine!',
            }
        )

        # Notify all other nearby pharmacies that the request is no longer available
        nearby_pharmacies = medicine_request.get_nearby_pharmacies()
        for item in nearby_pharmacies:
            other_pharmacy = item['pharmacy']
            if other_pharmacy.id != selected_pharmacy.id:
                async_to_sync(channel_layer.group_send)(
                    f"pharmacy_{other_pharmacy.id}",
                    {
                        'type': 'request_taken',
                        'request_id': medicine_request.id,
                        'message': 'This request has been accepted by another pharmacy',
                    }
                )

        return Response({
            'message': f'You have selected {selected_pharmacy.user.name}',
            'pharmacy_name': selected_pharmacy.user.name,
            'pharmacy_id': selected_pharmacy.id,
        }, status=status.HTTP_200_OK)