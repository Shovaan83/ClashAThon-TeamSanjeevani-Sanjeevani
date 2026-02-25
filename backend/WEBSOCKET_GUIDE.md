
# new update required on this

# Medicine Request WebSocket System

## Overview
Real-time bidirectional communication system for medicine requests between patients and pharmacies using WebSockets.

## Architecture

### Flow:
1. **User sends request** → REST API → **Pharmacy receives via WebSocket**
2. **Pharmacy responds** → WebSocket → **User receives via WebSocket**
3. **Pharmacy can send audio messages** along with accept/reject

---

## Setup Instructions

### 1. Install Redis (Required for WebSocket channels)

**Windows:**
Download and install Redis from: https://github.com/microsoftarchive/redis/releases
Or use Docker:
```bash
docker run -d -p 6379:6379 redis:latest
```

**Start Redis:**
```bash
redis-server
```

### 2. Start Django with Daphne (ASGI server)
```bash
cd backend
& venv\Scripts\Activate.ps1
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

**Or use manage.py:**
```bash
python manage.py runserver
```
(Django 6.0+ has built-in ASGI support)

---

## API Endpoints

### 1. Create Medicine Request (User → Pharmacy)
```http
POST /medicine/request/
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

{
  "patient": 1,
  "pharmacy": 2,
  "quantity": 5,
  "image": <prescription_image_file>
}
```

**Response:**
```json
{
  "message": "Medicine request sent successfully",
  "request_id": 123,
  "data": { ... }
}
```

### 2. Pharmacy Response (Pharmacy → User)
```http
POST /medicine/response/
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

{
  "request_id": 123,
  "status": "ACCEPTED",  // or "REJECTED"
  "text_message": "Your medicine is ready",
  "audio": <audio_file> (optional)
}
```

### 3. Get All Requests
```http
GET /medicine/request/
Authorization: Bearer <JWT_TOKEN>
```

---

## WebSocket Connections

### User WebSocket (Receive pharmacy responses)
```javascript
const userId = 123;
const ws = new WebSocket(`ws://localhost:8000/ws/user/${userId}/`);

ws.onopen = () => {
  console.log('Connected to medicine request channel');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'pharmacy_response') {
    console.log('Pharmacy responded:', data.status);
    console.log('Message:', data.message);
    
    if (data.audio_url) {
      // Play audio message
      const audio = new Audio(data.audio_url);
      audio.play();
    }
  }
};

// Send ping to keep connection alive
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
}, 30000);
```

### Pharmacy WebSocket (Receive requests & send responses)
```javascript
const pharmacyId = 456;
const ws = new WebSocket(`ws://localhost:8000/ws/pharmacy/${pharmacyId}/`);

ws.onopen = () => {
  console.log('Connected to pharmacy channel');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'new_request') {
    console.log('New medicine request received!');
    console.log('Patient:', data.patient_name);
    console.log('Phone:', data.patient_phone);
    console.log('Prescription:', data.image_url);
    
    // Display notification to pharmacy staff
    showNotification(data);
  }
};

// Send response (accept/reject) via WebSocket
function respondToRequest(requestId, status, message) {
  ws.send(JSON.stringify({
    type: 'response',
    request_id: requestId,
    status: status,  // 'ACCEPTED' or 'REJECTED'
    message: message
  }));
}
```

---

## Message Types

### User receives (from pharmacy):
```json
{
  "type": "pharmacy_response",
  "request_id": 123,
  "status": "ACCEPTED",
  "message": "Your medicine is ready for pickup",
  "audio_url": "http://localhost:8000/media/pharmacy-audio/response.mp3",
  "pharmacy_name": "LifeCare Pharmacy",
  "timestamp": "2026-02-24T18:30:00"
}
```

### Pharmacy receives (from user):
```json
{
  "type": "new_request",
  "request_id": 123,
  "patient_name": "John Doe",
  "patient_phone": "9876543210",
  "quantity": 2,
  "image_url": "http://localhost:8000/media/prescriptions/rx_123.jpg",
  "timestamp": "2026-02-24T18:25:00"
}
```

---

## Testing

### 1. Test with Browser Console
```javascript
// Connect as user
const userWs = new WebSocket('ws://localhost:8000/ws/user/1/');
userWs.onmessage = (e) => console.log('User received:', JSON.parse(e.data));

// Connect as pharmacy
const pharmaWs = new WebSocket('ws://localhost:8000/ws/pharmacy/2/');
pharmaWs.onmessage = (e) => console.log('Pharmacy received:', JSON.parse(e.data));
```

### 2. Test with Python websocket-client
```bash
pip install websocket-client
```

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Received: {data}")

ws = websocket.WebSocketApp(
    "ws://localhost:8000/ws/pharmacy/2/",
    on_message=on_message
)
ws.run_forever()
```

### 3. Test with Postman
- Create WebSocket request
- Connect to: `ws://localhost:8000/ws/user/1/`
- Send/receive messages in real-time

---

## Audio Message Handling

### Recording Audio (Frontend)
```javascript
let mediaRecorder;
let audioChunks = [];

// Start recording
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  mediaRecorder.start();
}

// Stop and send
function stopAndSend(requestId) {
  mediaRecorder.stop();
  
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('request_id', requestId);
    formData.append('status', 'ACCEPTED');
    formData.append('audio', audioBlob, 'response.webm');
    
    await fetch('/medicine/response/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    audioChunks = [];
  };
}
```

---

## Troubleshooting

### Redis Connection Error
```
channels_redis.core.ConnectionError: Error connecting to Redis
```
**Solution:** Make sure Redis is running on localhost:6379

### WebSocket Connection Refused
**Check:**
1. ASGI application is running (not WSGI)
2. ALLOWED_HOSTS includes your domain
3. CORS settings allow WebSocket connections

### No Messages Received
**Check:**
1. User/Pharmacy ID in WebSocket URL is correct
2. Request was created successfully via REST API
3. Redis is running and configured correctly

---

## Production Deployment

### Use Production ASGI Server
```bash
pip install uvicorn
uvicorn core.asgi:application --host 0.0.0.0 --port 8000 --workers 4
```

### Nginx WebSocket Configuration
```nginx
location /ws/ {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Use Redis in Production
```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis-server.example.com', 6379)],
        },
    },
}
```

---

## Security Considerations

1. **Authentication:** WebSocket connections should verify JWT tokens
2. **Authorization:** Verify user has access to the specific pharmacy/patient data
3. **Rate Limiting:** Implement rate limiting for WebSocket messages
4. **Input Validation:** Validate all incoming WebSocket messages
5. **HTTPS/WSS:** Use secure WebSocket (wss://) in production

---

## Next Steps

1. Add JWT authentication to WebSocket connections
2. Implement typing indicators
3. Add read receipts
4. Implement message history
5. Add push notifications as fallback
6. Implement connection retry logic
