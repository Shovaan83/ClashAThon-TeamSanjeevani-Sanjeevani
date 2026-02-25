import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:sanjeevani/core/service/websocket_service.dart';
import 'package:sanjeevani/config/storage/storage_service.dart';
import 'package:sanjeevani/features/home/broadcast/models/medicine_request_model.dart';
import 'package:sanjeevani/features/home/broadcast/models/pharmacy_response_model.dart';
import 'package:sanjeevani/features/home/broadcast/services/medicine_service.dart';

/// Extracts a user-friendly message from any exception.
String _friendlyError(Object e) {
  final raw = e.toString();
  // Strip leading "Exception: " or "ApiException: " etc.
  final idx = raw.indexOf(': ');
  return idx >= 0 ? raw.substring(idx + 2) : raw;
}

/// In-app notification item generated from WebSocket messages or API data.
class AppNotification {
  final String id;
  final String type; // 'new_request', 'pharmacy_response', 'request_taken'
  final String title;
  final String body;
  final Map<String, dynamic> payload;
  final DateTime timestamp;
  bool isRead;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.payload,
    required this.timestamp,
    this.isRead = false,
  });
}

/// Central state manager for medicine requests, pharmacy notifications,
/// and customer notifications. Uses [ChangeNotifier] with Provider.
///
/// ## For Pharmacy role:
/// - Connects to `ws/pharmacy/` WebSocket
/// - Receives `new_request` broadcasts in real-time
/// - Maintains list of pending requests from REST API
/// - Handles accept/reject actions via [MedicineService]
///
/// ## For Customer role:
/// - Connects to `ws/customer/` WebSocket
/// - Receives `pharmacy_response` notifications in real-time
/// - Tracks own broadcast requests
class NotificationProvider extends ChangeNotifier {
  final WebSocketService _ws = WebSocketService();
  final MedicineService _medicineService = MedicineService();
  final StorageService _storage = StorageService();

  /// The user's role — used to tailor WebSocket behaviour.
  String? _role; // 'CUSTOMER' or 'PHARMACY'
  bool _isLoading = false;
  String? _error;

  // ── Public state ──────────────────────────────────────────────────────────

  /// Whether the logged-in user is a pharmacy.
  bool get isPharmacy => _role?.toUpperCase() == 'PHARMACY';

  /// Notifications list (newest first).
  final List<AppNotification> _notifications = [];
  List<AppNotification> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  /// Medicine requests list (for pharmacy: nearby pending, for patient: own).
  List<MedicineRequestModel> _requests = [];
  List<MedicineRequestModel> get requests => List.unmodifiable(_requests);

  bool get isLoading => _isLoading;
  String? get error => _error;

  bool get isConnected => _ws.isConnected;

  // ── Initialisation ────────────────────────────────────────────────────────

  /// Call once after login to start WebSocket and load initial data.
  Future<void> init() async {
    final role = await _storage.getUserRole();
    _role = role;

    // Configure WebSocket callbacks
    _ws.onMessage = _handleMessage;
    _ws.onConnectionChanged = (connected) {
      notifyListeners();
    };

    // Connect WebSocket
    if (role == 'CUSTOMER') {
      await _ws.connect('customer');
    } else if (role == 'PHARMACY') {
      await _ws.connect('pharmacy');
    }

    // Load existing requests
    await fetchRequests();
  }

  /// Fetch medicine requests from REST API.
  Future<void> fetchRequests() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _requests = await _medicineService.getRequests();
      _error = null;
    } catch (e) {
      _error = _friendlyError(e);
    }

    _isLoading = false;
    notifyListeners();
  }

  // ── WebSocket message handler ─────────────────────────────────────────────

  void _handleMessage(Map<String, dynamic> message) {
    final type = message['type'] as String? ?? '';

    switch (type) {
      // Pharmacy receives a new medicine request broadcast
      case 'new_request':
        _handleNewRequest(message);
        break;

      // Customer receives a pharmacy response (accept/reject)
      case 'pharmacy_response':
        _handlePharmacyResponse(message);
        break;

      // Pharmacy: a request was accepted by another pharmacy
      case 'request_taken':
        _handleRequestTaken(message);
        break;

      case 'connection':
        // Connection confirmation — no action needed
        break;

      case 'pong':
        // Keepalive response — no action needed
        break;
    }
  }

  void _handleNewRequest(Map<String, dynamic> msg) {
    final requestId = msg['request_id'];
    final notification = AppNotification(
      id: 'req_$requestId',
      type: 'new_request',
      title: 'New Medicine Request',
      body:
          '${msg['patient_name'] ?? 'A patient'} needs medicine — ${msg['distance_km']}km away',
      payload: msg,
      timestamp: msg['timestamp'] != null
          ? DateTime.tryParse(msg['timestamp']) ?? DateTime.now()
          : DateTime.now(),
    );

    _notifications.insert(0, notification);
    notifyListeners();

    // Also refresh the requests list to include this new one
    fetchRequests();
  }

  void _handlePharmacyResponse(Map<String, dynamic> msg) {
    final responseType = msg['response_type'] as String? ?? '';
    final pharmacyName = msg['pharmacy_name'] ?? 'A pharmacy';

    final notification = AppNotification(
      id: 'resp_${msg['request_id']}_${msg['pharmacy_id']}',
      type: 'pharmacy_response',
      title: responseType == 'ACCEPTED'
          ? 'Request Accepted! 🎉'
          : 'Request Declined',
      body: responseType == 'ACCEPTED'
          ? '$pharmacyName has accepted your prescription request.'
          : '$pharmacyName has declined your request.',
      payload: msg,
      timestamp: msg['timestamp'] != null
          ? DateTime.tryParse(msg['timestamp']) ?? DateTime.now()
          : DateTime.now(),
    );

    _notifications.insert(0, notification);

    // Persist audio URL so it survives app restarts.
    final audioUrl = msg['audio_url'] as String?;
    final requestId = msg['request_id'];
    if (audioUrl != null && audioUrl.isNotEmpty && requestId != null) {
      _storage.saveAudioUrl(
        requestId is int ? requestId : int.tryParse(requestId.toString()) ?? 0,
        audioUrl,
      );
    }

    notifyListeners();

    // Refresh requests to get updated status
    fetchRequests();
  }

  void _handleRequestTaken(Map<String, dynamic> msg) {
    final requestId = msg['request_id'];
    final notification = AppNotification(
      id: 'taken_$requestId',
      type: 'request_taken',
      title: 'Request Filled',
      body:
          msg['message'] ??
          'This request has been accepted by another pharmacy.',
      payload: msg,
      timestamp: DateTime.now(),
    );

    _notifications.insert(0, notification);

    // Remove the request from the local list since it's no longer available
    _requests.removeWhere((r) => r.id == requestId);
    notifyListeners();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /// Pharmacy accepts a medicine request, optionally with a voice message.
  Future<bool> acceptRequest(
    int requestId, {
    String message = '',
    File? audioFile,
  }) async {
    try {
      await _medicineService.respondToRequest(
        requestId: requestId,
        responseType: PharmacyResponseType.accepted,
        textMessage: message,
        audioFile: audioFile,
      );
      // Remove from pending list
      _requests.removeWhere((r) => r.id == requestId);
      notifyListeners();
      return true;
    } catch (e) {
      _error = _friendlyError(e);
      notifyListeners();
      return false;
    }
  }

  /// Pharmacy rejects a medicine request.
  Future<bool> rejectRequest(int requestId, {String message = ''}) async {
    try {
      await _medicineService.respondToRequest(
        requestId: requestId,
        responseType: PharmacyResponseType.rejected,
        textMessage: message,
      );
      _requests.removeWhere((r) => r.id == requestId);
      notifyListeners();
      return true;
    } catch (e) {
      _error = _friendlyError(e);
      notifyListeners();
      return false;
    }
  }

  /// Accept all pending requests at once.
  Future<int> acceptAllRequests({String message = ''}) async {
    int accepted = 0;
    final pending = _requests
        .where((r) => r.status == RequestStatus.pending)
        .toList();
    for (final req in pending) {
      final ok = await acceptRequest(req.id, message: message);
      if (ok) accepted++;
    }
    return accepted;
  }

  /// Mark a notification as read.
  void markAsRead(String notificationId) {
    final idx = _notifications.indexWhere((n) => n.id == notificationId);
    if (idx != -1) {
      _notifications[idx].isRead = true;
      notifyListeners();
    }
  }

  /// Mark all notifications as read.
  void markAllAsRead() {
    for (final n in _notifications) {
      n.isRead = true;
    }
    notifyListeners();
  }

  /// Clear all notifications.
  void clearNotifications() {
    _notifications.clear();
    notifyListeners();
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  @override
  void dispose() {
    _ws.disconnect();
    super.dispose();
  }
}
