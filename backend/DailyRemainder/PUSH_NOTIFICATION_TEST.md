# Push Notification Test Guide — Sanjeevani DailyRemainder

> **Goal**: Verify that FCM notifications are delivered even when the phone screen is
> off, the app is in the background, or the app is completely killed.

---

## 1. Pre-flight: Server-Side Setup

### 1.1 Firebase credentials
- [ ] `backend/firebase-credentials.json` exists (download from Firebase Console →
      Project Settings → Service Accounts → Generate New Private Key)
- [ ] File is listed in `backend/.gitignore` (never commit it)
- [ ] `FIREBASE_CREDENTIALS_PATH = BASE_DIR / 'firebase-credentials.json'` is set
      in `core/settings.py`

### 1.2 Django startup log
Start the Django server and verify this line appears:
```
✓ Firebase Admin SDK initialized successfully
```
If you see `WARNING: Firebase credentials not found`, stop — the credentials path is wrong.

### 1.3 Celery services
Open three separate terminals in `backend/`:

| Terminal | Command |
|----------|---------|
| Worker   | `celery -A core worker -l info --pool=solo` |
| Beat     | `celery -A core beat -l info` |
| Redis    | `redis-server` (or confirm it is already running) |

Verify the worker registers these tasks:
```
celery -A core inspect registered
```
Expected tasks:
- `DailyRemainder.task.generate_daily_occurrences`
- `DailyRemainder.task.check_missed_occurrences`
- `DailyRemainder.task.send_reminder_notifications`

---

## 2. Quick Smoke Test (Python Shell)

```bash
python manage.py shell
```

```python
# 2a. Confirm Firebase is live
from utils.firebase import is_firebase_available, send_notification
print("Firebase available:", is_firebase_available())   # must print True

# 2b. Send a test notification to a known good FCM token
# Replace <TOKEN> with a real token from a logged-in device
result = send_notification(
    token="<FCM_TOKEN_FROM_DEVICE>",
    title="Test: Sanjeevani",
    body="If you see this — Firebase is working!",
    data={"type": "smoke_test"},
)
print("Send result:", result)   # True = success
```

---

## 3. End-to-End API Test

### Step 1 — Authenticate
```http
POST http://localhost:8000/customer/login/
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "yourpassword"
}
```
Save the `access` and `refresh` tokens.

### Step 2 — Register device FCM token
```http
POST http://localhost:8000/api/daily-reminder/device-tokens/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "token": "<FCM_TOKEN_FROM_FLUTTER_APP>",
  "platform": "android"
}
```
Expected: `201 Created`

### Step 3 — Create a medicine
```http
POST http://localhost:8000/api/daily-reminder/medicines/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Paracetamol 500mg"
}
```
Note the returned `id`.

### Step 4 — Create an alarm scheduled for ~8 minutes from now
Calculate a `start_time` that is **8 minutes in the future** (so the Celery Beat
5-minute window catches it on the next run).

```http
POST http://localhost:8000/api/daily-reminder/alarms/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "medicine": 1,
  "start_date": "2026-02-25",
  "end_date": "2026-03-25",
  "start_time": "HH:MM:00",
  "end_time": "HH:MM:00",
  "times_per_day": 1,
  "interval_days": 1,
  "timezone": "Asia/Kathmandu"
}
```

### Step 5 — Manually generate today's occurrences
```bash
python manage.py shell
>>> from DailyRemainder.task import generate_daily_occurrences
>>> generate_daily_occurrences()
```
Check the output — it should report at least 1 occurrence generated.

### Step 6 — Verify the occurrence was created
```http
GET http://localhost:8000/api/daily-reminder/occurrences/
Authorization: Bearer <access_token>
```
Confirm status is `scheduled` and `scheduled_at` is ~8 minutes from now.

### Step 7 — Manually trigger the notification task
```bash
python manage.py shell
>>> from DailyRemainder.task import send_reminder_notifications
>>> send_reminder_notifications()
```
Expected output: `Sent 1 notifications for 1 upcoming occurrences; deactivated 0 stale tokens`

The physical device should receive the push notification **within seconds**, regardless
of whether the screen is on or the app is open.

---

## 4. Background / Killed-State Tests

### Test A — Screen off (Android)
1. Turn the phone screen off.
2. Trigger `send_reminder_notifications()` from the shell (Step 7 above).
3. The device should wake, show the notification in the status bar, and play the
   default notification sound.

**What makes this work**: `AndroidConfig(priority='high')` bypasses Doze mode and
instructs FCM to deliver immediately, waking the device.

### Test B — App killed (Android)
1. Open the app, then swipe it away from the recent apps list (fully killed).
2. Trigger `send_reminder_notifications()`.
3. The notification should still arrive — the FCM SDK's background service handles
   it independently of the Flutter app process.

### Test C — App killed (iOS)
1. Double-press the home button and swipe the app up to kill it.
2. Trigger `send_reminder_notifications()`.
3. The notification should arrive thanks to:
   - `apns-priority: 10` header (immediate delivery — APNs priority 5 is delayed)
   - `apns-push-type: alert` header (required by Apple when priority is 10)
   - `content_available: True` in `Aps` (wakes the app in the background)

### Test D — Airplane mode recovery
1. Put the device in airplane mode.
2. Trigger `send_reminder_notifications()`.
3. Turn airplane mode off within 24 hours.
4. The notification should arrive — FCM retains it for up to `ttl=86400` seconds (24 h).

---

## 5. Stale Token Deactivation Test

1. Uninstall the app from a device (this invalidates its FCM token in Firebase).
2. Keep the old token in the `DeviceToken` table (`is_active=True`).
3. Trigger `send_reminder_notifications()`.
4. Expected log line:
   ```
   Deactivated stale token for user X: fcm_token_prefix...
   ```
5. Verify in the database:
   ```bash
   python manage.py shell
   >>> from DailyRemainder.models import DeviceToken
   >>> DeviceToken.objects.filter(is_active=False).values('user_id', 'token')
   ```
   The stale token should now have `is_active=False`.

---

## 6. Dashboard Check

After completing Steps 1–7 and marking the occurrence as taken:

```http
GET http://localhost:8000/api/daily-reminder/dashboard/
Authorization: Bearer <access_token>
```

Verify the response includes:
```json
{
  "today_taken": 1,
  "adherence_rate": 100.0,
  "current_streak": 1
}
```

---

## 7. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `Firebase not initialized — skipping notifications` | Credentials file missing or wrong path | Check `FIREBASE_CREDENTIALS_PATH` in settings.py |
| `Send result: False` + `FCM invalid argument` | Non-string value in `data` dict | Already fixed — `_stringify_data()` converts all values |
| Notification arrives in foreground but not background | Missing `apns-priority: 10` (iOS) or `priority='high'` (Android) | Already fixed in `_build_android_config()` and `_build_apns_config()` |
| Notification never arrives on iOS when app is killed | Missing `content_available: True` | Already fixed in `_build_apns_config()` |
| Token stays active after app uninstall | `UnregisteredError` not handled | Already fixed — `TaskUnregisteredException` auto-deactivates the token |
| Celery task not found | Worker not restarted after code change | Restart `celery -A core worker` |
| No occurrences generated | Alarm date range doesn't include today | Verify `start_date` ≤ today ≤ `end_date` |

---

## 8. Flutter-side Checklist (Mobile App)

For notifications to arrive when the app is killed, the Flutter app must:

- [ ] Initialize `firebase_messaging` in `main()` **before** `runApp()`
- [ ] Call `FirebaseMessaging.instance.requestPermission()` on iOS
- [ ] Register a `FirebaseMessaging.onBackgroundMessage` top-level handler (annotated
      with `@pragma('vm:entry-point')`)
- [ ] Create a notification channel with id `medication_reminders` on Android
      (required for `channel_id` in `AndroidNotification` to take effect)
- [ ] Retrieve the FCM token with `FirebaseMessaging.instance.getToken()` and POST it
      to `POST /api/daily-reminder/device-tokens/`
- [ ] Refresh the token with `FirebaseMessaging.instance.onTokenRefresh.listen(...)` and re-POST

```dart
// Minimal background handler — must be a top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Show local notification or update local DB here
  print('Background message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  runApp(const SanjeevaniApp());
}
```

---

**Last updated**: February 25, 2026
