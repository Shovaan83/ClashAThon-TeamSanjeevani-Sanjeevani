"""
Firebase Cloud Messaging (FCM) utility for sending push notifications.

Setup Instructions:
1. Go to Firebase Console (https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Place it in your project root as 'firebase-credentials.json'
7. Update FIREBASE_CREDENTIALS_PATH in settings.py if using a different location

Note: The firebase-credentials.json file should NOT be committed to version control.
Add it to .gitignore.
"""

import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings
import os


# Global variable to track initialization
_firebase_initialized = False


def initialize_firebase():
    """
    Initialize Firebase Admin SDK.
    Should be called once on application startup.
    """
    global _firebase_initialized
    
    if _firebase_initialized:
        return True
    
    try:
        cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
        
        if not cred_path or not os.path.exists(cred_path):
            print("WARNING: Firebase credentials not found. Push notifications will be disabled.")
            print(f"Expected path: {cred_path}")
            print("To enable notifications, add firebase-credentials.json to your project.")
            return False
        
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        print("✓ Firebase Admin SDK initialized successfully")
        return True
    
    except Exception as e:
        print(f"ERROR: Failed to initialize Firebase: {str(e)}")
        print("Push notifications will be disabled.")
        return False


def send_notification(token, title, body, data=None):
    """
    Send a push notification to a specific device.
    
    Args:
        token (str): FCM device token
        title (str): Notification title
        body (str): Notification body text
        data (dict, optional): Additional data payload
    
    Returns:
        bool: True if notification sent successfully, False otherwise
    
    Raises:
        Exception: If Firebase is not initialized or other errors occur
    """
    if not _firebase_initialized:
        raise Exception("Firebase not initialized. Call initialize_firebase() first.")
    
    try:
        # Build the message
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    sound='default',
                    channel_id='medication_reminders',
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=1,
                    ),
                ),
            ),
        )
        
        # Send the message
        response = messaging.send(message)
        print(f"Successfully sent notification: {response}")
        return True
    
    except messaging.UnregisteredError:
        # Token is no longer valid - should be marked as inactive
        print(f"Device token unregistered: {token}")
        # TODO: Mark token as inactive in database
        return False
    
    except messaging.InvalidArgumentError as e:
        print(f"Invalid argument error: {str(e)}")
        return False
    
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
        return False


def send_multicast_notification(tokens, title, body, data=None):
    """
    Send a push notification to multiple devices.
    
    Args:
        tokens (list): List of FCM device tokens
        title (str): Notification title
        body (str): Notification body text
        data (dict, optional): Additional data payload
    
    Returns:
        dict: Dictionary with 'success_count' and 'failure_count'
    """
    if not _firebase_initialized:
        raise Exception("Firebase not initialized. Call initialize_firebase() first.")
    
    if not tokens:
        return {'success_count': 0, 'failure_count': 0}
    
    try:
        # Build the multicast message
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    sound='default',
                    channel_id='medication_reminders',
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=1,
                    ),
                ),
            ),
        )
        
        # Send to multiple devices
        response = messaging.send_multicast(message)
        print(f"Successfully sent {response.success_count} notifications")
        print(f"Failed to send {response.failure_count} notifications")
        
        return {
            'success_count': response.success_count,
            'failure_count': response.failure_count,
        }
    
    except Exception as e:
        print(f"Error sending multicast notification: {str(e)}")
        return {'success_count': 0, 'failure_count': len(tokens)}


def is_firebase_available():
    """Check if Firebase is properly initialized and available."""
    return _firebase_initialized
