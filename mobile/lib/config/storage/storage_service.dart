import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Singleton wrapper around [SharedPreferences].
///
/// Caches the [SharedPreferences] instance to avoid repeated async look-ups.
class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  SharedPreferences? _prefs;

  Future<SharedPreferences> get _store async {
    return _prefs ??= await SharedPreferences.getInstance();
  }

  // Keys
  static const String _authTokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userRoleKey = 'user_role';
  static const String _userNameKey = 'user_name';
  static const String _userEmailKey = 'user_email';
  static const String _userIdKey = 'user_id';

  // Auth Token
  Future<void> saveAuthToken(String token) async {
    final prefs = await _store;
    await prefs.setString(_authTokenKey, token);
  }

  Future<String?> getAuthToken() async {
    final prefs = await _store;
    return prefs.getString(_authTokenKey);
  }

  Future<void> clearAuthToken() async {
    final prefs = await _store;
    await prefs.remove(_authTokenKey);
  }

  // Refresh Token
  Future<void> saveRefreshToken(String token) async {
    final prefs = await _store;
    await prefs.setString(_refreshTokenKey, token);
  }

  Future<String?> getRefreshToken() async {
    final prefs = await _store;
    return prefs.getString(_refreshTokenKey);
  }

  Future<void> clearRefreshToken() async {
    final prefs = await _store;
    await prefs.remove(_refreshTokenKey);
  }

  // User Role
  Future<void> saveUserRole(String role) async {
    final prefs = await _store;
    await prefs.setString(_userRoleKey, role);
  }

  Future<String?> getUserRole() async {
    final prefs = await _store;
    return prefs.getString(_userRoleKey);
  }

  // User Name
  Future<void> saveUserName(String name) async {
    final prefs = await _store;
    await prefs.setString(_userNameKey, name);
  }

  Future<String?> getUserName() async {
    final prefs = await _store;
    return prefs.getString(_userNameKey);
  }

  // User Email
  Future<void> saveUserEmail(String email) async {
    final prefs = await _store;
    await prefs.setString(_userEmailKey, email);
  }

  Future<String?> getUserEmail() async {
    final prefs = await _store;
    return prefs.getString(_userEmailKey);
  }

  /// Clears ALL stored data (use on logout).
  Future<void> clearAll() async {
    final prefs = await _store;
    await prefs.clear();
    _prefs = null; // reset cache after clear
  }

  // User ID
  Future<void> saveUserId(int id) async {
    final prefs = await _store;
    await prefs.setInt(_userIdKey, id);
  }

  Future<int?> getUserId() async {
    final prefs = await _store;
    return prefs.getInt(_userIdKey);
  }

  // ── Audio URL Persistence ────────────────────────────────────────────────
  // Stores audio URLs keyed by medicine-request ID so they survive app
  // restarts. Data is a JSON-encoded Map<String, String>.
  static const String _audioUrlsKey = 'audio_urls';

  /// Persist an audio URL for the given [requestId].
  Future<void> saveAudioUrl(int requestId, String url) async {
    final prefs = await _store;
    final raw = prefs.getString(_audioUrlsKey);
    final map = raw != null
        ? Map<String, String>.from(json.decode(raw) as Map)
        : <String, String>{};
    map[requestId.toString()] = url;
    await prefs.setString(_audioUrlsKey, json.encode(map));
  }

  /// Retrieve a previously-persisted audio URL for [requestId], or null.
  Future<String?> getAudioUrl(int requestId) async {
    final prefs = await _store;
    final raw = prefs.getString(_audioUrlsKey);
    if (raw == null) return null;
    final map = Map<String, String>.from(json.decode(raw) as Map);
    return map[requestId.toString()];
  }

  /// Return the entire persisted audio-URL map (request-id → URL).
  Future<Map<String, String>> getAllAudioUrls() async {
    final prefs = await _store;
    final raw = prefs.getString(_audioUrlsKey);
    if (raw == null) return {};
    return Map<String, String>.from(json.decode(raw) as Map);
  }
}
