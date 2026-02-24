# � Sanjevani - Real-Time Medicine Request Broadcast System

A location-based medicine request and pharmacy response system built with Django, Django Channels, and WebSockets. Customers can broadcast medicine requests to nearby pharmacies based on their location, and pharmacies can respond with acceptance/rejection in real-time.

[![Django](https://img.shields.io/badge/Django-6.0.2-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![Channels](https://img.shields.io/badge/Channels-4.0.0-009688?style=for-the-badge)](https://channels.readthedocs.io/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-4CAF50?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![Redis](https://img.shields.io/badge/Redis-7.2.0-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [WebSocket Documentation](#-websocket-documentation)
- [Testing](#-testing)
- [Key Concepts](#-key-concepts)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 🎯 Core Features

#### 1. **Location-Based Broadcast System**
- Customer "pings" for medicine with their location coordinates
- System calculates nearby pharmacies using **Haversine distance formula**
- Only pharmacies within **user-defined radius** receive the request
- **Flexible radius selection** (1-50 km) - customer chooses based on urgency

#### 2. **Real-Time WebSocket Communication**
- **Instant notifications** - no polling, no delays
- Customers receive pharmacy responses immediately
- Pharmacies receive new requests in real-time
- **First-to-accept-wins** mechanism with automatic notification

#### 3. **Auto-Authentication (No Manual IDs!)**
- **JWT token-based** WebSocket authentication
- System automatically identifies user from token
- No need to manually enter user/pharmacy IDs
- **Role-based access control** (customer vs pharmacy)
- Matches real-world mobile app behavior

#### 4. **Multi-Pharmacy Response Handling**
- Multiple pharmacies can respond to one request
- **First pharmacy to accept** gets assigned
- Other pharmacies automatically notified when request is taken
- Late accept/reject attempts are blocked with error message

#### 5. **Email OTP Verification**
- Email-based user registration
- 6-digit OTP sent via Gmail SMTP
- Email verification flag tracking
- Secure password hashing

#### 6. **Unified Authentication**
- Single login endpoint for all user types
- Role-based JWT token generation
- Supports Customer, Pharmacy, and Admin roles
- Token refresh mechanism

---

## 🏗️ Architecture

### System Flow Diagram

```
┌─────────────┐                    ┌──────────────┐                    ┌─────────────┐
│  Customer   │                    │    Django    │                    │  Pharmacy   │
│   (App)     │                    │    Server    │                    │   (App)     │
└──────┬──────┘                    └──────┬───────┘                    └──────┬──────┘
       │                                  │                                   │
       │ 1. Connect WebSocket             │                                   │
       │    ws://...customer/?token=JWT   │                                   │
       ├─────────────────────────────────>│                                   │
       │                                  │                                   │
       │ ✅ Auto-authenticated             │                                   │
       │    (user_id: 7)                  │                                   │
       │<─────────────────────────────────┤                                   │
       │                                  │                                   │
       │                                  │  2. Connect WebSocket             │
       │                                  │     ws://...pharmacy/?token=JWT   │
       │                                  │<──────────────────────────────────┤
       │                                  │                                   │
       │                                  │  ✅ Auto-authenticated             │
       │                                  │     (pharmacy_id: 3)              │
       │                                  ├──────────────────────────────────>│
       │                                  │                                   │
       │ 3. POST /medicine/request/       │                                   │
       │    (lat, lng, radius=10km)       │                                   │
       ├─────────────────────────────────>│                                   │
       │                                  │                                   │
       │                                  │ 4. Calculate distances            │
       │                                  │    (Haversine formula)            │
       │                                  │                                   │
       │                                  │ 5. Broadcast to nearby            │
       │                                  │    (new_request + distance)       │
       │                                  ├──────────────────────────────────>│
       │                                  │                                   │
       │                                  │ 6. POST /medicine/response/       │
       │                                  │    (ACCEPTED + message)           │
       │                                  │<──────────────────────────────────┤
       │                                  │                                   │
       │ 7. WebSocket notification        │                                   │
       │    (pharmacy_response)           │                                   │
       │<─────────────────────────────────┤                                   │
       │                                  │                                   │
       │                                  │ 8. Notify others                  │
       │                                  │    (request_taken)                │
       │                                  ├──────────────────────────────────>│
       │                                  │    Pharmacy B & C                 │
```

### Technology Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Web Framework** | API endpoints, business logic | Django 6.0.2 |
| **API Framework** | RESTful API | Django REST Framework 3.16.1 |
| **WebSocket Server** | Real-time communication | Django Channels 4.0.0 + Daphne |
| **Message Broker** | WebSocket channel layer | Redis 7.2.0 |
| **Authentication** | JWT tokens (REST + WebSocket) | djangorestframework-simplejwt |
| **Database** | Data persistence | SQLite (dev), PostgreSQL (prod) |
| **Distance Calc** | Location proximity | Haversine algorithm |
| **Email** | OTP delivery | Gmail SMTP |

---

## 🛠️ Technology Stack

### Backend Framework
```
Django==6.0.2
djangorestframework==3.16.1
djangorestframework-simplejwt==5.5.1
```

### Real-Time Communication
```
channels==4.0.0
channels-redis==4.1.0
daphne==4.0.0
redis==5.2.2
```

### Additional Packages
```
django-cors-headers==5.0.0
drf-yasg==1.21.10
Pillow==11.2.0
celery==5.6.2
django-celery-results==2.5.1
```

---

## 📦 Installation

### Prerequisites

✅ **Python 3.11 or higher**  
✅ **Redis** (for WebSockets)  
✅ **Git**  
✅ **Gmail account** (for OTP emails)

### Step-by-Step Setup

#### 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd Sanjevani/backend
```

#### 2️⃣ Create Virtual Environment

**Windows PowerShell:**
```powershell
python -m venv venv
& venv\Scripts\Activate.ps1
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 3️⃣ Install Dependencies

```powershell
pip install -r requirements.txt
```

#### 4️⃣ Configure Environment Variables

Create `.env` file in `backend/` directory:

```env
# Django Settings
SECRET_KEY=your-django-secret-key-here
DEBUG=True

# Email Configuration (Gmail)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS Settings (for frontend)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

**📝 Note:** For Gmail, use [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

#### 5️⃣ Run Database Migrations

```powershell
python manage.py migrate
```

#### 6️⃣ Create Superuser (Optional)

```powershell
python manage.py createsuperuser
```

#### 7️⃣ Start Redis Server

**Using Docker (Recommended):**
```powershell
docker run -d --name sanjevani-redis -p 6379:6379 redis:alpine
```

**Or install Redis locally:**
```powershell
# Download from https://redis.io/download
redis-server
```

#### 8️⃣ Start Django Development Server

```powershell
python manage.py runserver
```

✅ **Server running at:** `http://localhost:8000`

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Authentication Header
All protected endpoints require JWT token:
```
Authorization: Bearer <your_jwt_token>
```

---

### 🔐 Authentication Endpoints

#### 1. Send OTP (Email Verification)
```http
POST /send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent successfully"
}
```

---

#### 2. Verify OTP
```http
POST /verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

---

#### 3. Customer Registration
```http
POST /customer/register/
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "phone_number": "9841234567"
}
```

**Success Response (201):**
```json
{
  "message": "Customer registration successful",
  "user": {
    "id": 1,
    "email": "customer@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  }
}
```

---

#### 4. Login (Unified for all roles)
```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "CUSTOMER",
  "user_id": 1,
  "name": "John Doe"
}
```

---

### 💊 Medicine Request Endpoints

#### 5. Create Medicine Request (Customer Broadcast)
```http
POST /medicine/request/
Authorization: Bearer <customer_token>
Content-Type: multipart/form-data

patient_lat: 27.7172          # Customer's latitude
patient_lng: 85.3240          # Customer's longitude
radius_km: 10.0               # Search radius (1-50 km) - USER CHOOSES!
quantity: 10                  # Number of units needed
image: <prescription_file>    # Prescription image
```

**What Happens:**
1. ✅ Request created with `PENDING` status
2. ✅ System calculates pharmacies within `radius_km` using Haversine
3. ✅ WebSocket broadcast sent to nearby pharmacies only
4. ✅ Returns count of pharmacies notified

**Success Response (201):**
```json
{
  "message": "Medicine request sent to 3 nearby pharmacies",
  "request_id": 1,
  "pharmacies_notified": 3,
  "data": {
    "id": 1,
    "patient_name": "John Doe",
    "patient_lat": 27.7172,
    "patient_lng": 85.324,
    "radius_km": 10.0,
    "quantity": 10,
    "image": "http://localhost:8000/media/prescriptions/image.jpg",
    "status": "PENDING",
    "pharmacy": null,
    "pharmacy_name": null,
    "created_at": "2026-02-24T10:30:00Z"
  }
}
```

---

#### 6. Get All Requests (Customer View)
```http
GET /medicine/request/
Authorization: Bearer <customer_token>
```

**Success Response (200):**
```json
{
  "count": 2,
  "requests": [
    {
      "id": 1,
      "patient_name": "John Doe",
      "pharmacy_name": "City Pharmacy",
      "status": "ACCEPTED",
      "quantity": 10,
      "image": "http://localhost:8000/media/prescriptions/image.jpg",
      "created_at": "2026-02-24T10:30:00Z"
    }
  ]
}
```

---

#### 7. Pharmacy Response (Accept/Reject)
```http
POST /medicine/response/
Authorization: Bearer <pharmacy_token>
Content-Type: application/json

{
  "request_id": 1,
  "response_type": "ACCEPTED",
  "text_message": "We have this medicine in stock!",
  "audio": null
}
```

**Response Types:**
- `ACCEPTED` - Pharmacy has the medicine and commits to fulfilling
- `REJECTED` - Pharmacy doesn't have it or can't fulfill

**What Happens:**
1. ✅ First pharmacy to accept gets assigned (pharmacy field updated)
2. ✅ Request status changes to `ACCEPTED`
3. ✅ Customer receives `pharmacy_response` via WebSocket
4. ✅ Other pharmacies receive `request_taken` notification
5. ❌ Subsequent responses return HTTP 400 error

**Success Response (201):**
```json
{
  "id": 1,
  "request_id": 1,
  "pharmacy_id": 3,
  "pharmacy_name": "City Pharmacy",
  "response_type": "ACCEPTED",
  "text_message": "We have this medicine in stock!",
  "audio": null,
  "responded_at": "2026-02-24T10:35:00Z",
  "message": "Response recorded. Customer will be notified."
}
```

**Error Response (400) - Request Already Assigned:**
```json
{
  "error": "This request has already been assigned to a pharmacy"
}
```

---

## 🔌 WebSocket Documentation

### 🎯 Key Feature: Auto-Authentication

**No manual user/pharmacy IDs needed!** The system automatically:
- Extracts JWT token from query parameter
- Validates token and identifies user
- Validates user role (customer vs pharmacy)
- Rejects connections with wrong roles

---

### 📱 Customer WebSocket

#### Connection URL
```
ws://localhost:8000/ws/customer/?token=<JWT_TOKEN>
```

#### Features
✅ Automatic user identification from JWT  
✅ Receives pharmacy responses in real-time  
✅ Role validation (only CUSTOMER role allowed)  
✅ No manual user ID required  

#### Connection Success Message
```json
{
  "type": "connection",
  "message": "Connected to customer channel",
  "user_id": "7",
  "user_name": "John Doe"
}
```

#### Messages Received

**Pharmacy Response:**
```json
{
  "type": "pharmacy_response",
  "request_id": 1,
  "pharmacy_id": 3,
  "pharmacy_name": "City Pharmacy",
  "pharmacy_location": {
    "lat": 27.7000,
    "lng": 85.3200
  },
  "response_type": "ACCEPTED",
  "text_message": "We have this medicine in stock!",
  "audio_url": null,
  "distance_km": 2.5,
  "responded_at": "2026-02-24T10:35:00Z"
}
```

---

### 🏥 Pharmacy WebSocket

#### Connection URL
```
ws://localhost:8000/ws/pharmacy/?token=<JWT_TOKEN>
```

#### Features
✅ Automatic pharmacy identification from JWT  
✅ Receives new requests within delivery radius  
✅ Role validation (only PHARMACY role allowed)  
✅ No manual pharmacy ID required  
✅ Location info provided on connection  

#### Connection Success Message
```json
{
  "type": "connection",
  "message": "Connected to pharmacy channel",
  "pharmacy_id": "3",
  "pharmacy_name": "City Pharmacy",
  "location": {
    "lat": 27.7172,
    "lng": 85.324
  }
}
```

#### Messages Received

**New Medicine Request:**
```json
{
  "type": "new_request",
  "request_id": 1,
  "patient_name": "John Doe",
  "patient_phone": "9841234567",
  "patient_location": {
    "lat": 27.7172,
    "lng": 85.324
  },
  "distance_km": 2.5,
  "quantity": 10,
  "image_url": "http://localhost:8000/media/prescriptions/image.jpg",
  "timestamp": "2026-02-24T10:30:00Z"
}
```

**Request Taken by Another Pharmacy:**
```json
{
  "type": "request_taken",
  "request_id": 1,
  "message": "This request has been accepted by another pharmacy"
}
```

---

### ⚠️ WebSocket Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| **4001** | Authentication failed - Invalid or expired JWT token | Get new token via `/login` |
| **4003** | Wrong role - Customer token on pharmacy endpoint (or vice versa) | Use correct endpoint for your role |
| **4004** | No pharmacy found - User is PHARMACY role but no Pharmacy record exists | Create pharmacy record for this user |

---

## 🧪 Testing

### Quick Test Setup

#### 📦 Step 1: Create Test Data

```powershell
python test_broadcast.py
```

**This creates:**
- ✅ 4 test pharmacies at different locations
  - Pharmacy A, B, C: Within 5km (will receive broadcasts)
  - Pharmacy D: 15km away (won't receive broadcasts with small radius)
- ✅ 1 test customer
- ✅ JWT tokens saved to `test_tokens.json`
- ✅ All accounts verified and ready to use

**Output:**
```
✅ Test data cleared
✅ 4 pharmacies created
✅ 1 customer created
✅ Tokens generated
💾 Tokens saved to test_tokens.json
```

---

#### 🎮 Step 2: Visual WebSocket Testing

1. **Open `test_websocket.html` in your browser**

2. **Paste tokens from `test_tokens.json`:**
   - Copy customer token → paste in Customer Token field
   - Copy pharmacy_A token → paste in Pharmacy Token field

3. **Click "Connect" for both panels**
   - Authentication is automatic!
   - See connection confirmation with user details

4. **Watch real-time messages:**
   - Create a medicine request (see Step 3)
   - Pharmacy panel receives `new_request` notification
   - Pharmacy responds via API (see Step 4)
   - Customer panel receives `pharmacy_response` notification

---

#### 🚀 Step 3: Create Medicine Request

**PowerShell:**
```powershell
# Load token
$token = (Get-Content test_tokens.json | ConvertFrom-Json).customer.token

# Create request with 10km radius
curl.exe -X POST http://localhost:8000/medicine/request/ `
  -H "Authorization: Bearer $token" `
  -F "patient_lat=27.7172" `
  -F "patient_lng=85.3240" `
  -F "radius_km=10.0" `
  -F "quantity=10" `
  -F "image=@prescription.jpg"
```

**Expected Result:**
- ✅ Request created with `PENDING` status
- ✅ Returns `pharmacies_notified: 3` (A, B, C within 10km)
- ✅ Pharmacy D (15km away) does NOT receive notification
- ✅ WebSocket panels show real-time broadcast

---

#### ✅ Step 4: Pharmacy Response

**PowerShell:**
```powershell
# Load pharmacy token
$token = (Get-Content test_tokens.json | ConvertFrom-Json).pharmacy_A.token

# Accept the request
curl.exe -X POST http://localhost:8000/medicine/response/ `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{\"request_id\": 1, \"response_type\": \"ACCEPTED\", \"text_message\": \"Available!\"}'
```

**Expected Result:**
- ✅ Pharmacy A assigned to request
- ✅ Request status changes to `ACCEPTED`
- ✅ Customer WebSocket receives `pharmacy_response`
- ✅ Pharmacy B & C WebSockets receive `request_taken`
- ✅ Late responses return HTTP 400 error

---

#### 🤖 Step 5: Automated Testing

```powershell
python test_api_calls.py
```

**This script:**
1. Creates medicine request
2. Simulates pharmacy response
3. Displays all requests
4. Shows real-time interaction

---

### Test Scenarios

#### ✅ Scenario 1: Small Radius (3 km)
```powershell
# Only nearby pharmacies receive notification
-F "radius_km=3.0"
```
**Result:** Only Pharmacy A & B notified (C & D too far)

#### ✅ Scenario 2: Large Radius (20 km)
```powershell
# All pharmacies including far ones
-F "radius_km=20.0"
```
**Result:** All 4 pharmacies notified

#### ✅ Scenario 3: Wrong Role Token
Connect to pharmacy WebSocket with customer token
**Result:** Connection rejected with error code 4003

#### ✅ Scenario 4: Late Response
Two pharmacies try to accept same request
**Result:** First accepts successfully, second gets HTTP 400 error

---

## 💡 Key Concepts

### 1. Haversine Distance Calculation

Calculates the shortest distance between two points on Earth's surface (great-circle distance):

```python
def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = (math.sin(delta_lat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c  # Distance in km
```

**Example:**
- Customer at (27.7172°N, 85.3240°E)
- Pharmacy at (27.7100°N, 85.3300°E)
- Distance ≈ 0.82 km

---

### 2. First-Accept-Wins Mechanism

**Problem:** Multiple pharmacies responding simultaneously

**Solution:**
1. Customer creates request → status `PENDING`, pharmacy `null`
2. Multiple pharmacies can POST responses (stored in PharmacyResponse table)
3. **First** `ACCEPTED` response:
   - Sets `request.pharmacy` to that pharmacy
   - Changes `request.status` to `ACCEPTED`
   - Notifies customer via WebSocket
   - Notifies other pharmacies (`request_taken`)
4. Subsequent `ACCEPTED` responses:
   - Checked against `request.pharmacy` (not null)
   - Returns HTTP 400: "Already assigned"

**Database Structure:**
- `MedicineRequest.pharmacy` - ForeignKey (nullable, ONE pharmacy assigned)
- `PharmacyResponse` - Multiple responses per request allowed (tracks all attempts)

---

### 3. JWT WebSocket Authentication

**Traditional WebSocket** = No standard auth mechanism

**Our Solution** (in `utils/websocket_auth.py`):

```python
class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Extract token from query: ?token=<jwt>
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]
        
        if token:
            # Validate JWT
            access_token = AccessToken(token)
            user = await get_user_from_token(access_token)
            scope['user'] = user
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)
```

**Benefits:**
✅ No cookies needed (mobile-friendly)  
✅ Reuses existing JWT tokens  
✅ Role validation built-in  
✅ Automatic user identification  

---

### 4. Location-Based Broadcasting

**Process:**

1. Customer creates request with `(lat, lng, radius_km)`

2. `MedicineRequest.get_nearby_pharmacies()` called:
   ```python
   def get_nearby_pharmacies(self):
       all_pharmacies = Pharmacy.objects.all()
       nearby = []
       
       for pharmacy in all_pharmacies:
           distance = self.calculate_distance(
               self.patient_lat, self.patient_lng,
               pharmacy.lat, pharmacy.lng
           )
           
           if distance <= self.radius_km:
               nearby.append({
                   'pharmacy': pharmacy,
                   'distance': distance
               })
       
       return sorted(nearby, key=lambda x: x['distance'])
   ```

3. Loop through nearby pharmacies:
   ```python
   for item in nearby_pharmacies:
       pharmacy = item['pharmacy']
       distance = item['distance']
       
       # Send WebSocket message to pharmacy's channel
       channel_layer.group_send(
           f"pharmacy_{pharmacy.id}",
           {
               'type': 'new_request',
               'request_id': request.id,
               'distance_km': round(distance, 2),
               # ...other data
           }
       )
   ```

---

## 📁 Project Structure

```
Sanjevani/
├── backend/
│   ├── accounts/                    # User management & authentication
│   │   ├── models.py               # CustomUser, Otp
│   │   ├── views.py                # Registration, login, OTP
│   │   ├── serializers.py          # User serializers
│   │   └── urls.py                 # /send-otp, /verify-otp, /login
│   │
│   ├── pharmacy/                    # Pharmacy management
│   │   ├── models.py               # Pharmacy (user, lat, lng)
│   │   ├── views.py                # Pharmacy CRUD
│   │   └── urls.py                 # /pharmacy/*
│   │
│   ├── customer/                    # Customer management
│   │   ├── models.py               # Customer-specific models
│   │   ├── views.py                # Customer registration, profile
│   │   └── urls.py                 # /customer/register/, /customer/profile/
│   │
│   ├── medicine/                    # Medicine request system ⭐ CORE
│   │   ├── models.py               # MedicineRequest, PharmacyResponse
│   │   ├── views.py                # Request creation, response handling
│   │   ├── consumers.py            # CustomerConsumer, PharmacyConsumer
│   │   ├── routing.py              # WebSocket URL patterns
│   │   ├── serializers.py          # Request/Response serializers
│   │   └── urls.py                 # /medicine/request/, /medicine/response/
│   │
│   ├── utils/                       # Shared utilities
│   │   ├── email.py                # send_email function
│   │   ├── otp.py                  # generate_otp function
│   │   ├── websocket_auth.py       # JWTAuthMiddleware ⭐ NEW
│   │   ├── tokens.py               # JWT helpers
│   │   └── response.py             # API response helpers
│   │
│   ├── core/                        # Django project settings
│   │   ├── settings.py             # Configuration
│   │   ├── asgi.py                 # ASGI + WebSocket routing ⭐ MODIFIED
│   │   ├── urls.py                 # Main URL routing
│   │   └── wsgi.py                 # WSGI (not used with WebSockets)
│   │
│   ├── media/                       # Uploaded files
│   │   └── prescriptions/          # Prescription images
│   │
│   ├── test_broadcast.py            # 🧪 Create test data script
│   ├── test_api_calls.py            # 🧪 Automated API test script
│   ├── test_websocket.html          # 🧪 Visual WebSocket tester
│   ├── test_tokens.json             # 🧪 Generated JWT tokens
│   ├── test_api_requests.md         # 📖 Detailed testing guide
│   │
│   ├── manage.py                    # Django CLI
│   ├── requirements.txt             # Python dependencies
│   ├── .env                         # Environment variables
│   └── db.sqlite3                   # SQLite database (dev)
│
├── mobile/                          # Mobile app (future)
├── web/                             # Web app (future)
└── README.md                        # ⬅️ This file
```

---

## 🔧 Troubleshooting

### ❌ Redis Connection Error
```
Error: Connection refused [Errno 10061]
```
**Solution:**
```powershell
docker run -d -p 6379:6379 redis:alpine
# Or check if Redis is running: docker ps
```

---

### ❌ WebSocket Connection Failed
```
WebSocket connection to 'ws://localhost:8000/...' failed
```
**Solutions:**
1. ✅ Ensure Django is running: `python manage.py runserver`
2. ✅ Check Redis is running: `docker ps | findstr redis`
3. ✅ Verify `CHANNEL_LAYERS` in `settings.py`
4. ✅ Check JWT token is valid (tokens expire after 5 minutes by default)
5. ✅ Ensure WebSocket URL includes token: `?token=YOUR_JWT`

---

### ❌ Authentication Failed (Error 4001)
```
WebSocket closed with code 4001
```
**Solutions:**
1. Token expired - get new token via `/login`
2. Invalid token format - ensure it's the `access` token, not `refresh`
3. Token from wrong user type - customer token on pharmacy endpoint

---

### ❌ Wrong Role (Error 4003)
```
WebSocket closed with code 4003
```
**Solutions:**
- Using customer token on `/ws/pharmacy/` → Use `/ws/customer/`
- Using pharmacy token on `/ws/customer/` → Use `/ws/pharmacy/`

---

### ❌ Email Not Sending
```
Error: Failed to send OTP
```
**Solutions:**
1. ✅ Check Gmail credentials in `.env`
2. ✅ Use [App Password](https://support.google.com/accounts/answer/185833), not regular password
3. ✅ Enable "2-Step Verification" in Google Account
4. ✅ Check internet connection

---

### ❌ Migration Errors
```
django.db.utils.OperationalError: no such column: medicine_medicinerequest.patient_lat
```
**Solution:**
```powershell
python manage.py makemigrations
python manage.py migrate
```

If migrations conflict:
```powershell
# Reset medicine app migrations
python manage.py migrate medicine zero
python manage.py migrate
```

---

### ❌ Import Error: channels not found
```
ModuleNotFoundError: No module named 'channels'
```
**Solution:**
```powershell
pip install -r requirements.txt
```

---

## 🚀 Production Deployment

### Changes Needed for Production

#### 1. Settings (`core/settings.py`)
```python
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
SECRET_KEY = os.environ.get('SECRET_KEY')  # Use secure key from environment
```

#### 2. Database (Switch to PostgreSQL)
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sanjevani_db',
        'USER': 'postgres',
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

#### 3. Redis (Production Instance)
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(os.environ.get('REDIS_HOST'), 6379)],
        },
    },
}
```

#### 4. Static Files
```python
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# Collect static files
python manage.py collectstatic
```

#### 5. CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

#### 6. Run with Daphne (Production ASGI Server)
```bash
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

Or use with Nginx reverse proxy:
```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

---

## 📊 System Requirements

### Development
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 1 GB
- **OS:** Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

### Production (Estimated for 1000 concurrent users)
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Storage:** 20 GB SSD
- **Redis:** 2 GB RAM
- **Database:** PostgreSQL with 10 GB storage

---

## 🔄 Version History

### v1.0.0 (Current - February 2026)

#### ✨ Features Implemented
- ✅ **Location-based broadcast** with Haversine distance calculation
- ✅ **Real-time WebSocket** notifications (Django Channels + Redis)
- ✅ **Auto-authentication** for WebSockets (JWT token from query param)
- ✅ **Flexible search radius** (user-defined 1-50 km)
- ✅ **First-accept-wins** pharmacy assignment mechanism
- ✅ **Multi-pharmacy response** handling with automatic notifications
- ✅ **Email OTP verification** system
- ✅ **Unified login** endpoint for all user roles
- ✅ **Role-based WebSocket** access control
- ✅ **Comprehensive testing** tools and documentation

#### 🎯 Key Improvements
- No manual user/pharmacy IDs needed (auto from JWT)
- Customer chooses search radius (not fixed)
- Role validation prevents wrong endpoint connections
- Distance included in pharmacy notifications
- Automatic "request taken" notifications to other pharmacies

---

## 📞 Support & Contact

For technical issues, feature requests, or questions:
- 📧 Email: support@sanjevani.com (placeholder)
- 📖 Documentation: This README + inline code comments
- 🐛 Bug Reports: Create detailed issue with reproduction steps

---

## 🙏 Acknowledgments

- **Django Team** - Excellent web framework
- **Channels Team** - Making WebSockets easy
- **Redis Team** - Fast, reliable message broker
- **JWT** - Secure authentication standard

---

## 📝 License

This project is proprietary and confidential.
All rights reserved © 2026 Sanjevani Team

---

**Built with ❤️ for better healthcare accessibility in Nepal**

---

## 🎯 Quick Links

- [Installation](#-installation) - Get started in 10 minutes
- [API Docs](#-api-documentation) - All endpoints explained
- [WebSocket Guide](#-websocket-documentation) - Real-time communication
- [Testing](#-testing) - Try it out with test data
- [Troubleshooting](#-troubleshooting) - Fix common issues

---

**Last Updated:** February 24, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

*   **Backend:** Python, Django, Django REST Framework (DRF)
*   **Real-Time Engine:** Django Channels (WebSockets) + Redis
*   **Database:** SQLite (Prototyping) / Spatial logic for geofencing
*   **Web Frontend (Dashboard):** React.js, Tailwind CSS, shadcn/ui, Framer Motion
*   **Mobile App (Patient/Pharmacy):** Flutter, Dart, `speech_to_text` for Voice API

---

## 🚀 How to Run Locally

### 1. Backend (Django)
```bash
cd backend
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver