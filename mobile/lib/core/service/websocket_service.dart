import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:sanjeevani/core/constants/api_base_url.dart';
import 'package:sanjeevani/config/storage/storage_service.dart';

/// Manages a single WebSocket connection to the backend.
///
/// The backend exposes two WebSocket endpoints:
///   - `ws://host/ws/customer/?token=<jwt>` — for customers
///   - `ws://host/ws/pharmacy/?token=<jwt>` — for pharmacies
///
/// JWT is passed as a query parameter (see `utils/websocket_auth.py`).
class WebSocketService {
  WebSocketChannel? _channel;
  final StorageService _storage = StorageService();

  bool _isConnected = false;
  bool get isConnected => _isConnected;

  Timer? _pingTimer;
  Timer? _reconnectTimer;

  /// Callback for every incoming JSON message from the server.
  void Function(Map<String, dynamic> message)? onMessage;

  /// Callback when connection state changes.
  void Function(bool connected)? onConnectionChanged;

  /// Connect to the WebSocket for a given [role] ("customer" or "pharmacy").
  Future<void> connect(String role) async {
    if (_isConnected) return;

    final token = await _storage.getAuthToken();
    if (token == null) {
      debugPrint('WebSocket: No auth token, skipping connect');
      return;
    }

    // Build ws:// URL from the http base URL
    final httpBase = ApiBaseUrl.baseUrl; // e.g. http://10.0.2.2:8000/
    final wsBase = httpBase
        .replaceFirst('http://', 'ws://')
        .replaceFirst('https://', 'wss://');
    final wsUrl = '${wsBase}ws/$role/?token=$token';

    debugPrint('WebSocket: Connecting to $wsUrl');

    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

      // Wait for the connection to be ready
      await _channel!.ready;

      _isConnected = true;
      onConnectionChanged?.call(true);
      debugPrint('WebSocket: Connected');

      _channel!.stream.listen(
        (data) {
          try {
            final message = jsonDecode(data as String) as Map<String, dynamic>;
            debugPrint('WebSocket: Received ${message['type']}');
            onMessage?.call(message);
          } catch (e) {
            debugPrint('WebSocket: Parse error: $e');
          }
        },
        onError: (error) {
          debugPrint('WebSocket: Error: $error');
          _handleDisconnect(role);
        },
        onDone: () {
          debugPrint('WebSocket: Connection closed');
          _handleDisconnect(role);
        },
      );

      // Start ping keep-alive every 30 seconds
      _pingTimer?.cancel();
      _pingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        sendMessage({'type': 'ping'});
      });
    } catch (e) {
      debugPrint('WebSocket: Connection failed: $e');
      _handleDisconnect(role);
    }
  }

  void _handleDisconnect(String role) {
    _isConnected = false;
    onConnectionChanged?.call(false);
    _pingTimer?.cancel();

    // Auto-reconnect after 5 seconds
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      debugPrint('WebSocket: Attempting reconnect...');
      connect(role);
    });
  }

  /// Send a JSON message through the WebSocket.
  void sendMessage(Map<String, dynamic> message) {
    if (_isConnected && _channel != null) {
      _channel!.sink.add(jsonEncode(message));
    }
  }

  /// Disconnect and clean up.
  void disconnect() {
    _pingTimer?.cancel();
    _reconnectTimer?.cancel();
    _isConnected = false;
    onConnectionChanged?.call(false);
    _channel?.sink.close();
    _channel = null;
    debugPrint('WebSocket: Disconnected');
  }
}
