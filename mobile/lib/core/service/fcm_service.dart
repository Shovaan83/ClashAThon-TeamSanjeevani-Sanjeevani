import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:sanjeevani/features/daily_rem/services/daily_reminder_service.dart';

/// Top-level handler for background FCM messages.
///
/// Must be a top-level function (not a method) so that it can be
/// invoked by the Flutter engine when the app is terminated.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // No-op for now — the OS will show the notification automatically
  // if `notification` block is present. For data-only messages you can
  // add local-notification logic here later.
  debugPrint('[FCM] Background message: ${message.messageId}');
}

/// Singleton service that manages Firebase Cloud Messaging.
///
/// Call [init] once after the user is authenticated and [ApiService]
/// has a valid JWT token, so we can register the device token with
/// the DailyReminder backend.
class FcmService {
  FcmService._();
  static final FcmService instance = FcmService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final DailyReminderService _reminderService = DailyReminderService();

  bool _initialised = false;

  /// Initialise FCM: request permission, get token, register with backend,
  /// and set up foreground / token-refresh listeners.
  Future<void> init() async {
    if (_initialised) return;
    _initialised = true;

    // 1. Request permission (iOS + Android 13+)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    debugPrint('[FCM] Auth status: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('[FCM] Notification permission denied');
      return;
    }

    // 2. Get and register token
    try {
      final token = await _messaging.getToken();
      if (token != null) {
        await _registerToken(token);
      }
    } catch (e) {
      debugPrint('[FCM] Failed to get/register token: $e');
    }

    // 3. Listen for token refresh
    _messaging.onTokenRefresh.listen((newToken) {
      _registerToken(newToken);
    });

    // 4. Foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // 5. When user taps notification while app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // 6. Check if app was opened from a terminated state via notification
    final initial = await _messaging.getInitialMessage();
    if (initial != null) {
      _handleNotificationTap(initial);
    }
  }

  /// Register the FCM token with the DailyReminder backend.
  Future<void> _registerToken(String token) async {
    final platform = Platform.isIOS ? 'ios' : 'android';
    try {
      await _reminderService.registerDeviceToken(
        token: token,
        platform: platform,
      );
      debugPrint('[FCM] Token registered ($platform)');
    } catch (e) {
      debugPrint('[FCM] Token registration failed: $e');
    }
  }

  /// Handle a message that arrives while the app is in the foreground.
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('[FCM] Foreground message: ${message.notification?.title}');
    // The notification payload is auto-shown on Android if a
    // notification channel is configured. For extra in-app UI
    // (e.g. snackbar, refresh), hook into a callback here.
    _onMessageCallback?.call(message);
  }

  /// Handle when the user taps a notification.
  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('[FCM] Notification tapped: ${message.data}');
    _onNotificationTapCallback?.call(message);
  }

  // ── Public hooks for the UI layer ──────────────────────────────────────

  /// Optional callback invoked when a foreground message arrives.
  void Function(RemoteMessage)? _onMessageCallback;
  set onMessage(void Function(RemoteMessage)? cb) => _onMessageCallback = cb;

  /// Optional callback invoked when user taps a notification.
  void Function(RemoteMessage)? _onNotificationTapCallback;
  set onNotificationTap(void Function(RemoteMessage)? cb) =>
      _onNotificationTapCallback = cb;
}
