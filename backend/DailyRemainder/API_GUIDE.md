# DailyRemainder API - Complete Setup & Usage Guide

## 📋 Overview

The DailyRemainder app provides a comprehensive medication reminder system with:
- RESTful API endpoints for managing medicines, alarms, and occurrences
- Automated daily occurrence generation via Celery Beat
- Push notifications through Firebase Cloud Messaging (FCM)
- Adherence tracking and statistics dashboard
- Support for complex scheduling patterns (daily, interval-based, custom weekdays)

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies added:
- `firebase-admin==6.5.0` - For push notifications
- `pytz` - Already included (for timezone handling)

### 2. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Configure Firebase (Optional - for push notifications)

#### Get Firebase Credentials:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **"Generate New Private Key"**
5. Download the JSON file
6. Save it as `firebase-credentials.json` in the `backend/` directory (same level as `manage.py`)

#### Important:
- Add `firebase-credentials.json` to `.gitignore` (NEVER commit this file!)
- The app will work without Firebase, but push notifications will be disabled

### 4. Start Required Services

#### Terminal 1 - Django Development Server:
```bash
python manage.py runserver
```

#### Terminal 2 - Celery Worker:
```bash
celery -A core worker -l info --pool=solo
```

#### Terminal 3 - Celery Beat (Scheduler):
```bash
celery -A core beat -l info
```

#### Terminal 4 - Redis (if not already running):
```bash
redis-server
```

---

## 📡 API Endpoints

Base URL: `http://localhost:8000/api/daily-reminder/`

All endpoints require JWT authentication. Include token in header:
```
Authorization: Bearer <your-access-token>
```

### Medicine Management

#### Create Medicine
```http
POST /api/daily-reminder/medicines/
Content-Type: application/json

{
  "name": "Aspirin"
}
```

#### List All Medicines
```http
GET /api/daily-reminder/medicines/
```

#### Get Medicine Detail
```http
GET /api/daily-reminder/medicines/{id}/
```

#### Update Medicine
```http
PUT /api/daily-reminder/medicines/{id}/
Content-Type: application/json

{
  "name": "Aspirin 100mg"
}
```

#### Delete Medicine
```http
DELETE /api/daily-reminder/medicines/{id}/
```

---

### Alarm Management

#### Create Alarm
```http
POST /api/daily-reminder/alarms/
Content-Type: application/json

{
  "medicine": 1,
  "start_date": "2026-02-25",
  "end_date": "2026-03-25",
  "start_time": "08:00:00",
  "end_time": "20:00:00",
  "times_per_day": 3,
  "interval_days": 1,
  "timezone": "Asia/Kathmandu"
}
```

**Scheduling Options:**

1. **Daily (every day)**:
   ```json
   {
     "interval_days": 1
   }
   ```

2. **Every N days**:
   ```json
   {
     "interval_days": 2  // Every 2 days
   }
   ```

3. **Custom weekdays** (e.g., Mon/Wed/Fri):
   ```json
   {
     "interval_days": 1,
     "custom_weekdays": [0, 2, 4]  // 0=Mon, 1=Tue, 2=Wed, etc.
   }
   ```

4. **Single dose per day**:
   ```json
   {
     "times_per_day": 1,
     "start_time": "08:00:00"
     // end_time is optional for single dose
   }
   ```

#### List All Alarms
```http
GET /api/daily-reminder/alarms/
```

Filter by active status:
```http
GET /api/daily-reminder/alarms/?is_active=true
```

#### Get Alarm Detail (with statistics)
```http
GET /api/daily-reminder/alarms/{id}/
```

Returns:
```json
{
  "id": 1,
  "medicine": 1,
  "medicine_name": "Aspirin",
  "start_date": "2026-02-25",
  "times_per_day": 3,
  "is_active": true,
  "total_occurrences": 90,
  "taken_count": 75,
  "missed_count": 5
}
```

#### Update Alarm
```http
PUT /api/daily-reminder/alarms/{id}/
Content-Type: application/json

{
  "is_active": false
}
```

#### Deactivate Alarm (Soft Delete)
```http
DELETE /api/daily-reminder/alarms/{id}/
```

---

### Occurrence Management

#### List Occurrences
```http
GET /api/daily-reminder/occurrences/
```

**Filter Options:**

- By date range:
  ```http
  GET /api/daily-reminder/occurrences/?date_from=2026-02-25&date_to=2026-02-28
  ```

- By status:
  ```http
  GET /api/daily-reminder/occurrences/?status=scheduled
  GET /api/daily-reminder/occurrences/?status=taken
  GET /api/daily-reminder/occurrences/?status=missed
  ```

- Today's occurrences (default if no filters):
  ```http
  GET /api/daily-reminder/occurrences/
  ```

#### Mark Occurrence as Taken
```http
PATCH /api/daily-reminder/occurrences/{id}/
Content-Type: application/json

{
  "status": "taken"
}
```

#### Mark Occurrence as Skipped
```http
PATCH /api/daily-reminder/occurrences/{id}/
Content-Type: application/json

{
  "status": "skipped"
}
```

**Status Options:**
- `scheduled` - Pending (not yet taken)
- `taken` - Medication taken
- `missed` - Missed (auto-set by system)
- `skipped` - Intentionally skipped by user

---

### Device Token Management (Push Notifications)

#### Register Device Token
```http
POST /api/daily-reminder/device-tokens/
Content-Type: application/json

{
  "token": "fcm-device-token-from-mobile-app",
  "platform": "android"
}
```

Platform options: `android` or `ios`

#### Deactivate Device Token
```http
DELETE /api/daily-reminder/device-tokens/{id}/
```

---

### Dashboard (Statistics)

#### Get Adherence Dashboard
```http
GET /api/daily-reminder/dashboard/
```

Returns:
```json
{
  "status": "success",
  "data": {
    "total_medicines": 3,
    "active_alarms": 5,
    "today_scheduled": 10,
    "today_taken": 7,
    "today_missed": 2,
    "today_pending": 1,
    "adherence_rate": 87.5,
    "current_streak": 5,
    "total_taken_all_time": 250,
    "total_missed_all_time": 15,
    "upcoming_occurrences": [
      {
        "id": 123,
        "medicine_name": "Aspirin",
        "scheduled_at": "2026-02-25T14:00:00Z",
        "status": "scheduled"
      }
    ]
  }
}
```

**Metrics Explained:**
- `adherence_rate`: Percentage of doses taken in last 30 days
- `current_streak`: Consecutive days with 100% adherence
- `upcoming_occurrences`: Next 5 occurrences in next 24 hours

---

## ⚙️ Celery Tasks (Automated)

### 1. Generate Daily Occurrences
**Task**: `DailyRemainder.task.generate_daily_occurrences`  
**Schedule**: Daily at midnight (00:00)  
**Purpose**: Creates occurrence records for all active alarms for the current day

### 2. Check Missed Occurrences
**Task**: `DailyRemainder.task.check_missed_occurrences`  
**Schedule**: Every 30 minutes  
**Purpose**: Marks scheduled occurrences as "missed" if they're 10+ minutes past their scheduled time

### 3. Send Reminder Notifications
**Task**: `DailyRemainder.task.send_reminder_notifications`  
**Schedule**: Every 5 minutes  
**Purpose**: Sends push notifications to users 5-10 minutes before scheduled dose

---

## 🧪 Testing Guide

### Manual Testing Flow

1. **Create a test user** (if not already exists):
   ```bash
   python manage.py createsuperuser
   ```

2. **Get JWT token**:
   ```http
   POST http://localhost:8000/customer/login/
   {
     "email": "test@example.com",
     "password": "yourpassword"
   }
   ```

3. **Create a medicine**:
   ```http
   POST http://localhost:8000/api/daily-reminder/medicines/
   Authorization: Bearer <token>
   {
     "name": "Test Medicine"
   }
   ```

4. **Create an alarm for today**:
   ```http
   POST http://localhost:8000/api/daily-reminder/alarms/
   Authorization: Bearer <token>
   {
     "medicine": 1,
     "start_date": "2026-02-25",
     "end_date": "2026-03-01",
     "start_time": "09:00:00",
     "end_time": "21:00:00",
     "times_per_day": 3,
     "interval_days": 1
   }
   ```

5. **Manually trigger occurrence generation** (or wait for midnight):
   ```bash
   python manage.py shell
   >>> from DailyRemainder.task import generate_daily_occurrences
   >>> generate_daily_occurrences()
   ```

6. **Check today's occurrences**:
   ```http
   GET http://localhost:8000/api/daily-reminder/occurrences/
   Authorization: Bearer <token>
   ```

7. **Mark an occurrence as taken**:
   ```http
   PATCH http://localhost:8000/api/daily-reminder/occurrences/{id}/
   Authorization: Bearer <token>
   {
     "status": "taken"
   }
   ```

8. **Check dashboard statistics**:
   ```http
   GET http://localhost:8000/api/daily-reminder/dashboard/
   Authorization: Bearer <token>
   ```

### Testing with Postman

Import this Postman collection structure:

```
DailyRemainder API/
├── Auth/
│   └── Login
├── Medicines/
│   ├── Create Medicine
│   ├── List Medicines
│   ├── Get Medicine
│   ├── Update Medicine
│   └── Delete Medicine
├── Alarms/
│   ├── Create Alarm
│   ├── List Alarms
│   ├── Get Alarm
│   ├── Update Alarm
│   └── Deactivate Alarm
├── Occurrences/
│   ├── List Today's Occurrences
│   ├── List by Date Range
│   ├── List by Status
│   └── Update Status
├── Device Tokens/
│   ├── Register Token
│   └── Deactivate Token
└── Dashboard/
    └── Get Statistics
```

---

## 🐛 Troubleshooting

### Issue: Occurrences not being generated

**Check:**
1. Is Celery Beat running?
   ```bash
   celery -A core beat -l info
   ```
2. Is the alarm active?
3. Is today within the alarm's date range?
4. Check Celery logs for errors

**Manual fix:**
```python
python manage.py shell
>>> from datetime import date
>>> from DailyRemainder.models import Alarm
>>> from DailyRemainder.services.occurance_generator import generate_occurrences_for_alarm
>>> alarm = Alarm.objects.get(id=1)
>>> generate_occurrences_for_alarm(alarm, date.today())
```

### Issue: Notifications not being sent

**Check:**
1. Is `firebase-credentials.json` present?
2. Is Firebase initialized? Check Django startup logs
3. Are device tokens registered?
4. Is Celery worker running?

**Test Firebase:**
```python
python manage.py shell
>>> from utils.firebase import send_notification, is_firebase_available
>>> is_firebase_available()
True
>>> send_notification(
...     token="test-token",
...     title="Test",
...     body="Test notification"
... )
```

### Issue: Import errors

**Solution:**
Make sure virtual environment is activated and all dependencies are installed:
```bash
pip install -r requirements.txt
```

---

## 📱 Mobile App Integration

### Flutter/React Native Example

```dart
// Register FCM token
await http.post(
  Uri.parse('$baseUrl/api/daily-reminder/device-tokens/'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'token': fcmToken,
    'platform': Platform.isIOS ? 'ios' : 'android',
  }),
);

// Handle notification tap
FirebaseMessaging.onMessageOpenedApp.listen((message) {
  final occurrenceId = message.data['occurrence_id'];
  // Navigate to occurrence detail screen
  // Show "Mark as Taken" button
});

// Mark as taken
await http.patch(
  Uri.parse('$baseUrl/api/daily-reminder/occurrences/$occurrenceId/'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({'status': 'taken'}),
);
```

---

## 🔒 Security Notes

1. **JWT tokens** are required for all endpoints
2. Users can only access their own medicines/alarms/occurrences
3. Firebase credentials must be kept secure (not committed to git)
4. Device tokens are tied to specific users

---

## 📊 Admin Interface

Access Django admin at: `http://localhost:8000/admin/`

Features:
- View all medicines, alarms, occurrences, and device tokens
- Bulk actions (mark as taken/missed/skipped)
- Colored status badges for occurrences
- Inline alarm editing when viewing medicines
- Search and filter capabilities

---

## 🎯 Future Enhancements

- [ ] SMS reminders as fallback
- [ ] Email reminders
- [ ] Snooze functionality
- [ ] Dose amount tracking
- [ ] Photo proof of compliance
- [ ] Caregiver notifications
- [ ] Pharmacy integration

---

## 📞 Support

For issues or questions:
1. Check Django logs: Look for errors in the terminal
2. Check Celery logs: Look for task execution errors
3. Check Celery Beat logs: Look for scheduling errors
4. Check database: Use Django admin to verify data

---

## ✅ Checklist

- [x] Models created with proper validation
- [x] Serializers with validation logic
- [x] API views with authentication
- [x] URL routing configured
- [x] Celery tasks implemented
- [x] Celery Beat schedule configured
- [x] Firebase integration
- [x] Admin interface
- [x] Error handling
- [x] Documentation

---

**Version**: 1.0.0  
**Last Updated**: February 25, 2026
