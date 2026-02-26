"""
Firebase Cloud Messaging (FCM) utility for sending push notifications.

Setup:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key" and download the JSON file
3. Save it as 'firebase-credentials.json' in the backend/ directory (next to manage.py)
4. Add firebase-credentials.json to .gitignore — NEVER commit this file

Background / killed-state delivery:
- Android: AndroidConfig(priority='high') instructs FCM to wake the device.
- iOS:     apns-priority: 10 header + content_available: True in Aps config
           instruct APNs to deliver the push immediately, waking the app.
"""

import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings
import os


_firebase_initialized = False


# ─── Custom exception ────────────────────────────────────────────────────────

class TokenUnregisteredException(Exception):
    """
    Raised when FCM reports that a device token is no longer valid.
    The caller should mark the token as inactive in the database.
    """
    pass


# ─── Init ────────────────────────────────────────────────────────────────────

def initialize_firebase():
    """
    Initialize Firebase Admin SDK once on application startup.
    Returns True if successful, False if credentials are missing/invalid.
    """
    global _firebase_initialized

    if _firebase_initialized:
        return True

    try:
        cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)

        if not cred_path or not os.path.exists(cred_path):
            print("WARNING: Firebase credentials not found. Push notifications will be disabled.")
            print(f"  Expected path: {cred_path}")
            print("  To enable, place firebase-credentials.json in backend/ and restart Django.")
            return False

        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        print("[OK] Firebase Admin SDK initialized successfully")
        return True

    except Exception as e:
        print(f"ERROR: Failed to initialize Firebase: {str(e)}")
        print("Push notifications will be disabled.")
        return False


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _stringify_data(data: dict | None) -> dict:
    """
    FCM data payloads require every value to be a string.
    Converts all values to str so the message is never rejected.
    """
    if not data:
        return {}
    return {k: str(v) for k, v in data.items()}


def _build_android_config() -> messaging.AndroidConfig:
    """
    High-priority Android config — wakes the device even in Doze mode.
    TTL of 24 h ensures late delivery if the device is temporarily offline.
    """
    return messaging.AndroidConfig(
        priority='high',
        ttl=86400,  # 24 hours in seconds — survive temporary connectivity loss
        notification=messaging.AndroidNotification(
            sound='default',
            channel_id='medication_reminders',
            default_vibrate_timings=True,
        ),
    )


def _build_apns_config() -> messaging.APNSConfig:
    """
    iOS APNs config for background / killed-state delivery:
    - apns-priority: 10  →  immediate delivery (priority 5 is power-efficient but delayed)
    - apns-push-type: alert  →  required by Apple when priority is 10
    - content_available: True  →  wakes the app in background / terminated state
    """
    return messaging.APNSConfig(
        headers={
            'apns-priority': '10',
            'apns-push-type': 'alert',
        },
        payload=messaging.APNSPayload(
            aps=messaging.Aps(
                sound='default',
                badge=1,
                content_available=True,
            ),
        ),
    )


# ─── Single-device send ───────────────────────────────────────────────────────

def send_notification(token: str, title: str, body: str, data: dict | None = None) -> bool:
    """
    Send a push notification to a single device.

    Args:
        token:  FCM registration token for the target device.
        title:  Notification title displayed in the system tray.
        body:   Notification body text.
        data:   Optional key/value payload delivered to the app.
                All values are automatically converted to strings.

    Returns:
        True  — notification accepted by FCM.
        False — non-fatal send error (log already printed).

    Raises:
        TokenUnregisteredException — FCM says the token is invalid/stale.
            The caller must deactivate this token in the database.
        Exception — Firebase was not initialized before calling this function.
    """
    if not _firebase_initialized:
        raise Exception("Firebase not initialized. Call initialize_firebase() first.")

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=_stringify_data(data),
            token=token,
            android=_build_android_config(),
            apns=_build_apns_config(),
        )

        response = messaging.send(message)
        print(f"FCM send OK: {response}")
        return True

    except messaging.UnregisteredError:
        raise TokenUnregisteredException(token)

    except messaging.InvalidArgumentError as e:
        print(f"FCM invalid argument: {str(e)}")
        return False

    except Exception as e:
        print(f"FCM send error: {str(e)}")
        return False


# ─── Multicast send ───────────────────────────────────────────────────────────

def send_multicast_notification(
    tokens: list[str],
    title: str,
    body: str,
    data: dict | None = None,
) -> dict:
    """
    Send a push notification to multiple devices in a single FCM call.

    Returns:
        {
            'success_count': int,
            'failure_count': int,
            'failed_tokens': list[str],   # tokens FCM says are no longer registered
        }

    'failed_tokens' should be marked as inactive by the caller.
    """
    if not _firebase_initialized:
        raise Exception("Firebase not initialized. Call initialize_firebase() first.")

    if not tokens:
        return {'success_count': 0, 'failure_count': 0, 'failed_tokens': []}

    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=_stringify_data(data),
            tokens=tokens,
            android=_build_android_config(),
            apns=_build_apns_config(),
        )

        # send_each_for_multicast gives per-token results (firebase-admin >= 6.0)
        response = messaging.send_each_for_multicast(message)

        failed_tokens: list[str] = []
        for idx, result in enumerate(response.responses):
            if not result.success:
                if isinstance(result.exception, messaging.UnregisteredError):
                    failed_tokens.append(tokens[idx])
                else:
                    print(f"FCM multicast error for token {tokens[idx]}: {result.exception}")

        print(
            f"FCM multicast: {response.success_count} sent, "
            f"{response.failure_count} failed, "
            f"{len(failed_tokens)} unregistered"
        )
        return {
            'success_count': response.success_count,
            'failure_count': response.failure_count,
            'failed_tokens': failed_tokens,
        }

    except Exception as e:
        print(f"FCM multicast error: {str(e)}")
        return {'success_count': 0, 'failure_count': len(tokens), 'failed_tokens': []}


# ─── Status check ─────────────────────────────────────────────────────────────

def is_firebase_available() -> bool:
    """Return True if Firebase Admin SDK is initialised and ready."""
    return _firebase_initialized
