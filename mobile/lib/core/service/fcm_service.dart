import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:sanjeevani/features/daily_rem/services/daily_reminder_service.dart';

// ── Android notification channel (high-importance → heads-up) ───────────────
const _androidChannel = AndroidNotificationChannel(
  'sanjeevani_broadcasts', // id
  'Sanjeevani Broadcasts', // name
  description: 'Medicine broadcast and pharmacy notifications',
  importance: Importance.high,
  playSound: true,
);

const _reminderChannel = AndroidNotificationChannel(
  'medication_reminders', // must match backend channel_id
  'Medication Reminders',
  description: 'Daily medicine reminder notifications',
  importance: Importance.high,
  playSound: true,
);

/// Top-level handler for background FCM messages.
///
/// Must be a top-level function (not a method) so that it can be
/// invoked by the Flutter engine when the app is terminated.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[FCM] Background message: ${message.messageId}');
}

/// Singleton service that manages Firebase Cloud Messaging and shows
/// local notifications for foreground messages.
class FcmService {
  FcmService._();
  static final FcmService instance = FcmService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final DailyReminderService _reminderService = DailyReminderService();
  final FlutterLocalNotificationsPlugin _localNotif =
      FlutterLocalNotificationsPlugin();

  bool _initialised = false;
  int _notifId = 0; // auto-incrementing notification id

  // ── Initialisation ────────────────────────────────────────────────────────

  Future<void> init() async {
    if (_initialised) return;
    _initialised = true;

    // ── Local notifications setup ────────────────────────────────────────
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const darwinInit = DarwinInitializationSettings();
    const initSettings = InitializationSettings(
      android: androidInit,
      iOS: darwinInit,
    );
    await _localNotif.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: _onLocalNotifTap,
    );

    // Create the high-importance channels on Android
    final androidPlugin = _localNotif
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    if (androidPlugin != null) {
      await androidPlugin.createNotificationChannel(_androidChannel);
      await androidPlugin.createNotificationChannel(_reminderChannel);
    }

    // ── FCM permission ───────────────────────────────────────────────────
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

    // Tell FCM to NOT show its own foreground notification — we handle it.
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: false,
      badge: false,
      sound: false,
    );

    // ── Token ────────────────────────────────────────────────────────────
    try {
      final token = await _messaging.getToken();
      if (token != null) await _registerToken(token);
    } catch (e) {
      debugPrint('[FCM] Failed to get/register token: $e');
    }
    _messaging.onTokenRefresh.listen(_registerToken);

    // ── Listeners ────────────────────────────────────────────────────────
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    final initial = await _messaging.getInitialMessage();
    if (initial != null) _handleNotificationTap(initial);

    // Ask the backend to push any pending medication reminders right now.
    // This ensures the user gets notified even when Celery Beat is not running.
    _reminderService.syncNotifications();
  }

  // ── Token registration ────────────────────────────────────────────────────

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

  // ── Foreground message → show local notification ──────────────────────────

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('[FCM] Foreground message: ${message.notification?.title}');
    debugPrint('[FCM] Data: ${message.data}');

    // Show a visible heads-up notification
    _showLocalNotification(message);

    // Forward to UI callbacks
    _onMessageCallback?.call(message);

    final dataType = message.data['type'] as String?;
    if (dataType != null) {
      debugPrint('[FCM] Broadcast event type: $dataType');
      _onBroadcastEventCallback?.call(message.data);
    }
  }

  /// Display a local notification banner for a foreground FCM message.
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    final title = notification?.title ?? 'Sanjeevani';
    final body = notification?.body ?? '';

    // Pick channel based on data type
    final dataType = message.data['type'] as String?;
    final isMedReminder = dataType == 'medication_reminder';
    final channelId = isMedReminder ? _reminderChannel.id : _androidChannel.id;
    final channelName = isMedReminder
        ? _reminderChannel.name
        : _androidChannel.name;
    final channelDesc = isMedReminder
        ? _reminderChannel.description
        : _androidChannel.description;

    final androidDetails = AndroidNotificationDetails(
      channelId,
      channelName,
      channelDescription: channelDesc,
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
      icon: '@mipmap/ic_launcher',
    );

    const darwinDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    await _localNotif.show(
      id: _notifId++,
      title: title,
      body: body,
      notificationDetails: NotificationDetails(
        android: androidDetails,
        iOS: darwinDetails,
      ),
      payload: dataType, // passed to onDidReceiveNotificationResponse
    );
  }

  // ── Notification tap handlers ─────────────────────────────────────────────

  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('[FCM] Notification tapped: ${message.data}');
    _onNotificationTapCallback?.call(message);
  }

  /// Called when user taps a local notification shown by us.
  void _onLocalNotifTap(NotificationResponse response) {
    debugPrint('[FCM] Local notification tapped: ${response.payload}');
    // The payload is the data type — UI can act on it if needed
  }

  // ── Public hooks for the UI layer ─────────────────────────────────────────

  void Function(RemoteMessage)? _onMessageCallback;
  set onMessage(void Function(RemoteMessage)? cb) => _onMessageCallback = cb;

  void Function(RemoteMessage)? _onNotificationTapCallback;
  set onNotificationTap(void Function(RemoteMessage)? cb) =>
      _onNotificationTapCallback = cb;

  void Function(Map<String, dynamic>)? _onBroadcastEventCallback;
  set onBroadcastEvent(void Function(Map<String, dynamic>)? cb) =>
      _onBroadcastEventCallback = cb;
}
