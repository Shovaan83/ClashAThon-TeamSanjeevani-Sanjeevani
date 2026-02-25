import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from medicine.models import MedicineRequest, PharmacyResponse
from accounts.models import CustomUser
from pharmacy.models import Pharmacy


class CustomerConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for customers - automatically uses authenticated user
    Customers receive pharmacy responses here
    """
    
    async def connect(self):
        # Get authenticated user from JWT middleware
        user = self.scope.get('user')
        
        # Reject if not authenticated
        if not user or user.is_anonymous:
            await self.close(code=4001)
            return
        
        # Reject if not a customer
        if user.role != 'CUSTOMER':
            await self.close(code=4003)
            return
        
        self.user = user
        self.user_id = str(user.id)
        self.room_group_name = f'user_{self.user_id}'
        
        # Join user's personal room
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection',
            'message': 'Connected to customer channel',
            'user_id': self.user_id,
            'user_name': user.name
        }))
    
    async def disconnect(self, close_code):
        # Leave user's personal room
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """
        Handle incoming messages from user
        This is not typically used as requests come via REST API
        But kept for potential future real-time features
        """
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong',
                'message': 'Connection alive'
            }))
    
    async def pharmacy_response(self, event):
        """
        Receive pharmacy response and send to user
        """
        await self.send(text_data=json.dumps({
            'type': 'pharmacy_response',
            'request_id': event['request_id'],
            'response_type': event['response_type'],
            'pharmacy_id': event['pharmacy_id'],
            'pharmacy_name': event['pharmacy_name'],
            'pharmacy_location': event['pharmacy_location'],
            'message': event['message'],
            'audio_url': event.get('audio_url'),
            'timestamp': event['timestamp']
        }))


class PharmacyConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for pharmacy - automatically uses authenticated user
    Pharmacies receive medicine request broadcasts here
    """
    
    async def connect(self):
        # Get authenticated user from JWT middleware
        user = self.scope.get('user')
        
        # Reject if not authenticated
        if not user or user.is_anonymous:
            await self.close(code=4001)
            return
        
        # Reject if not a pharmacy
        if user.role != 'PHARMACY':
            await self.close(code=4003)
            return
        
        # Get pharmacy from user
        pharmacy = await self.get_pharmacy(user)
        if not pharmacy:
            await self.close(code=4004)
            return
        
        self.user = user
        self.pharmacy = pharmacy
        self.pharmacy_id = str(pharmacy.id)
        self.room_group_name = f'pharmacy_{self.pharmacy_id}'
        
        # Join pharmacy's room
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection',
            'message': 'Connected to pharmacy channel',
            'pharmacy_id': self.pharmacy_id,
            'pharmacy_name': user.name,
            'location': {
                'lat': pharmacy.lat,
                'lng': pharmacy.lng
            }
        }))
    
    @database_sync_to_async
    def get_pharmacy(self, user):
        """Get pharmacy object from user"""
        try:
            return Pharmacy.objects.get(user=user)
        except Pharmacy.DoesNotExist:
            return None
    
    async def disconnect(self, close_code):
        # Leave pharmacy's room
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """
        Handle incoming messages from pharmacy
        Pharmacies can acknowledge receipt or ask for clarification
        Actual accept/reject is done via REST API for better reliability
        """
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong',
                'message': 'Connection alive'
            }))
    
    async def new_request(self, event):
        """
        Receive new medicine request notification
        """
        await self.send(text_data=json.dumps({
            'type': 'new_request',
            'request_id': event['request_id'],
            'patient_name': event['patient_name'],
            'patient_phone': event['patient_phone'],
            'patient_location': event['patient_location'],
            'distance_km': event['distance_km'],
            'quantity': event['quantity'],
            'image_url': event['image_url'],
            'timestamp': event['timestamp']
        }))
    
    async def request_taken(self, event):
        """
        Notify pharmacy that request was accepted by another pharmacy
        """
        await self.send(text_data=json.dumps({
            'type': 'request_taken',
            'request_id': event['request_id'],
            'message': event['message']
        }))
    
    @database_sync_to_async
    def update_request_status(self, request_id, status):
        """Update medicine request status in database"""
        try:
            request = MedicineRequest.objects.get(id=request_id)
            request.status = status
            request.save()
            return True
        except MedicineRequest.DoesNotExist:
            return False
    
    @database_sync_to_async
    def get_request_details(self, request_id):
        """Get medicine request details"""
        try:
            request = MedicineRequest.objects.select_related('patient', 'pharmacy').get(id=request_id)
            return {
                'patient_id': request.patient.id,
                'pharmacy_name': request.pharmacy.user.name,
                'timestamp': request.created_at.isoformat()
            }
        except MedicineRequest.DoesNotExist:
            return None
