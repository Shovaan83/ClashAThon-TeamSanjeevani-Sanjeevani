# Customer App - API Documentation

## Overview
The customer app handles customer-specific functionality including registration (after OTP verification), authentication, profile management, and medicine requests.

**Note:** OTP sending and verification are handled by the accounts app (`/send-otp` and `/verify-otp`). The customer app handles registration after OTP verification.

---

## API Endpoints

### Customer Endpoints: `/customer/`
### OTP Endpoints (Accounts App): `/` (root)

---

## 1. Registration Flow (3 Steps)

### Step 1: Send OTP (Accounts App)
**POST** `/send-otp`

Send OTP to customer's email for verification.

**Request:**
```json
{
  "email": "customer@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent successfully."
}
```

---

### Step 2: Verify OTP (Accounts App)
**POST** `/verify-otp`

Verify the OTP sent to email.

**Request:**
```json
{
  "email": "customer@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "OTP verified successfully",
  "data": {
    "email": "customer@example.com",
    "otp": "123456"
  }
}
```

---

### Step 3: Complete Registration (Customer App)
**POST** `/customer/register/`

Complete customer registration after OTP verification.

**Request:**
```json
{
  "email": "customer@example.com",
  "name": "John Doe",
  "phone_number": "9876543210",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!"
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "email": "customer@example.com",
      "name": "John Doe",
      "phone_number": "9876543210",
      "role": "CUSTOMER"
    },
    "tokens": {
      "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
    }
  }
}
```

**Validation Rules:**
- Email must be verified with OTP first
- Phone number must be exactly 10 digits
- Password minimum 8 characters
- Passwords must match

---

## 2. Authentication (Unified for All User Types)

### Login
**POST** `/login`

Unified login endpoint for all user types (Customer, Pharmacy, Admin). Returns user data with role.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "customer@example.com",
      "name": "John Doe",
      "phone_number": "9876543210",
      "role": "CUSTOMER"
    },
    "tokens": {
      "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
    }
  }
}
```

**Role Values:**
- `CUSTOMER` - Regular customer
- `PHARMACY` - Pharmacy user
- `ADMIN` - Administrator

**Frontend Routing:**
```javascript
const response = await login(email, password);
const role = response.data.user.role;

// Route based on role
switch(role) {
  case 'CUSTOMER':
    navigate('/customer/dashboard');
    break;
  case 'PHARMACY':
    navigate('/pharmacy/dashboard');
    break;
  case 'ADMIN':
    navigate('/admin/dashboard');
    break;
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Email not found
- `401` - Incorrect password

**Authentication:**
All subsequent requests require JWT token in header:
```
Authorization: Bearer <access_token>
```

---

## 3. Profile Management

### Get Profile
**GET** `/customer/profile/`

Get logged-in customer's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "email": "customer@example.com",
    "name": "John Doe",
    "phone_number": "9876543210",
    "role": "CUSTOMER",
    "date_joined": "2026-02-24T10:30:00Z"
  }
}
```

---

### Update Profile
**PUT** `/customer/profile/`

Update customer profile (partial update supported).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "name": "John Smith",
  "phone_number": "9876543211"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "email": "customer@example.com",
    "name": "John Smith",
    "phone_number": "9876543211",
    "role": "CUSTOMER",
    "date_joined": "2026-02-24T10:30:00Z"
  }
}
```

**Note:** Email and role cannot be changed.

---

## 4. Medicine Requests

### Get My Medicine Requests
**GET** `/customer/requests/`

Get all medicine requests made by the logged-in customer.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Medicine requests retrieved successfully",
  "data": {
    "count": 2,
    "requests": [
      {
        "id": 1,
        "patient": 1,
        "patient_name": "John Doe",
        "pharmacy": 2,
        "pharmacy_name": "LifeCare Pharmacy",
        "quantity": 2,
        "image": "/media/prescriptions/rx_001.jpg",
        "status": "ACCEPTED",
        "created_at": "2026-02-24T10:30:00Z",
        "updated_at": "2026-02-24T10:35:00Z"
      },
      {
        "id": 2,
        "patient": 1,
        "patient_name": "John Doe",
        "pharmacy": 3,
        "pharmacy_name": "MediPlus Pharmacy",
        "quantity": 1,
        "image": "/media/prescriptions/rx_002.jpg",
        "status": "PENDING",
        "created_at": "2026-02-24T11:00:00Z",
        "updated_at": "2026-02-24T11:00:00Z"
      }
    ]
  }
}
```

**Request Status:**
- `PENDING` - Waiting for pharmacy response
- `ACCEPTED` - Pharmacy accepted the request
- `REJECTED` - Pharmacy rejected the request

---

## Complete Registration Flow Example

### Frontend Implementation

```javascript
// Step 1: Send OTP (Accounts App)
async function sendOTP(email) {
  const response = await fetch('http://localhost:8000/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
}

// Step 2: Verify OTP (Accounts App)
async function verifyOTP(email, otp) {
  const response = await fetch('http://localhost:8000/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  return response.json();
}

// Step 3: Complete Registration (Customer App)
async function register(data) {
  const response = await fetch('http://localhost:8000/customer/register/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  
  // Store tokens
  if (result.status === 'success') {
    localStorage.setItem('access_token', result.data.tokens.access);
    localStorage.setItem('refresh_token', result.data.tokens.refresh);
  }
  
  return result;
}

// Usage
await sendOTP('customer@example.com');
await verifyOTP('customer@example.com', '123456');
await register({
  email: 'customer@example.com',
  name: 'John Doe',
  phone_number: '9876543210',
  password: 'SecurePass123!',
  confirm_password: 'SecurePass123!'
});
```

---

## Testing with cURL

### Send OTP (Accounts App)
```bash
curl -X POST http://localhost:8000/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Verify OTP (Accounts App)
```bash
curl -X POST http://localhost:8000/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'
```

### Register (Customer App)
```bash
curl -X POST http://localhost:8000/customer/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "phone_number": "9876543210",
    "password": "TestPass123!",
    "confirm_password": "TestPass123!"
  }'
```

### Login (Unified)
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123!"}'
```

### Get Profile
```bash
curl -X GET http://localhost:8000/customer/profile/ \
  -H "Authorization: Bearer <your_access_token>"
```

---

## Error Response Format

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "error": "error_type",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

---

## Security Notes

1. **OTP Expiry:** OTPs are valid for 10 minutes
2. **Password Requirements:** Minimum 8 characters
3. **JWT Tokens:** 
   - Access token expires in 1 hour
   - Refresh token expires in 7 days
4. **Role Verification:** All customer endpoints verify user role
5. **HTTPS Required:** Use HTTPS in production

---

## Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request (registration)
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Authentication failed
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
