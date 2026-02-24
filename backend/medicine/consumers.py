import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from medicine.models import MedicineRequest, PharmacyResponse
from accounts.models import CustomUser
from pharmacy.models import Pharmacy


class MedicineRequestConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time medicine requests
    Users connect here to send requests and receive responses
    """
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
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
            'message': 'Connected to medicine request channel'
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
            'status': event['status'],
            'message': event['message'],
            'audio_url': event.get('audio_url'),
            'pharmacy_name': event['pharmacy_name'],
            'timestamp': event['timestamp']
        }))


class PharmacyConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for pharmacy to receive medicine requests
    and send responses in real-time
    """
    
    async def connect(self):
        self.pharmacy_id = self.scope['url_route']['kwargs']['pharmacy_id']
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
            'message': f'Connected to pharmacy {self.pharmacy_id} channel'
        }))
    
    async def disconnect(self, close_code):
        # Leave pharmacy's room
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """
        Handle incoming messages from pharmacy (accept/reject)
        """
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'response':
            # Pharmacy responding to a request
            request_id = data.get('request_id')
            status = data.get('status')  # ACCEPTED or REJECTED
            message = data.get('message', '')
            
            # Update request status in database
            await self.update_request_status(request_id, status)
            
            # Get request details
            request_data = await self.get_request_details(request_id)
            
            # Send response to user via their WebSocket
            await self.channel_layer.group_send(
                f"user_{request_data['patient_id']}",
                {
                    'type': 'pharmacy_response',
                    'request_id': request_id,
                    'status': status,
                    'message': message,
                    'audio_url': data.get('audio_url'),
                    'pharmacy_name': request_data['pharmacy_name'],
                    'timestamp': request_data['timestamp']
                }
            )
            
            # Confirm to pharmacy
            await self.send(text_data=json.dumps({
                'type': 'response_sent',
                'request_id': request_id,
                'status': 'success'
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
            'quantity': event['quantity'],
            'image_url': event['image_url'],
            'timestamp': event['timestamp']
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
