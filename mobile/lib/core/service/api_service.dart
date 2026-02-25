import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:sanjeevani/config/exception/api_exception.dart';
import '../constants/api_base_url.dart';
import '../../config/storage/storage_service.dart';

class ApiService {
  // Singleton
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final StorageService _storage = StorageService();
  String? _authToken;

  // Call once at app start
  Future<void> init() async {
    _authToken = await _storage.getAuthToken();
  }

  // Token management
  Future<void> setAuthToken(String token) async {
    _authToken = token;
    await _storage.saveAuthToken(token);
  }

  Future<void> setRefreshToken(String token) async {
    await _storage.saveRefreshToken(token);
  }

  /// Stores both access & refresh tokens at once.
  Future<void> saveTokens({
    required String access,
    required String refresh,
  }) async {
    await setAuthToken(access);
    await setRefreshToken(refresh);
  }

  Future<void> clearAuthToken() async {
    _authToken = null;
    await _storage.clearAuthToken();
    await _storage.clearRefreshToken();
  }

  // Headers
  Map<String, String> _buildHeaders({bool requiresAuth = false}) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (requiresAuth && _authToken != null)
        'Authorization': 'Bearer $_authToken',
    };
  }

  // URI builder
  Uri _buildUri(String endpoint, [Map<String, dynamic>? queryParams]) {
    final uri = Uri.parse('${ApiBaseUrl.baseUrl}$endpoint');
    if (queryParams != null && queryParams.isNotEmpty) {
      return uri.replace(
        queryParameters: queryParams.map((k, v) => MapEntry(k, v.toString())),
      );
    }
    return uri;
  }

  // Response parser
  dynamic _parseResponse(http.Response response) {
    final body = utf8.decode(response.bodyBytes);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (body.isEmpty) return null;
      return jsonDecode(body);
    }
    String message;
    try {
      final decoded = jsonDecode(body);
      message = decoded['detail'] ?? decoded['message'] ?? body;
    } catch (_) {
      message = body;
    }
    throw ApiException(response.statusCode, message);
  }

  // GET
  Future<dynamic> get(
    String endpoint, {
    Map<String, dynamic>? queryParams,
    bool requiresAuth = false,
  }) async {
    final response = await http
        .get(
          _buildUri(endpoint, queryParams),
          headers: _buildHeaders(requiresAuth: requiresAuth),
        )
        .timeout(const Duration(seconds: 30));
    return _parseResponse(response);
  }

  // POST
  Future<dynamic> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final response = await http
        .post(
          _buildUri(endpoint),
          headers: _buildHeaders(requiresAuth: requiresAuth),
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(const Duration(seconds: 30));
    return _parseResponse(response);
  }

  // PUT
  Future<dynamic> put(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final response = await http
        .put(
          _buildUri(endpoint),
          headers: _buildHeaders(requiresAuth: requiresAuth),
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(const Duration(seconds: 30));
    return _parseResponse(response);
  }

  // PATCH
  Future<dynamic> patch(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final response = await http
        .patch(
          _buildUri(endpoint),
          headers: _buildHeaders(requiresAuth: requiresAuth),
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(const Duration(seconds: 30));
    return _parseResponse(response);
  }

  // DELETE
  Future<dynamic> delete(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final response = await http
        .delete(
          _buildUri(endpoint),
          headers: _buildHeaders(requiresAuth: requiresAuth),
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(const Duration(seconds: 30));
    return _parseResponse(response);
  }

  // MULTIPART POST (for file uploads — e.g. prescription images)
  Future<dynamic> postMultipart(
    String endpoint, {
    required Map<String, String> fields,
    List<http.MultipartFile> files = const [],
    bool requiresAuth = false,
  }) async {
    final request = http.MultipartRequest('POST', _buildUri(endpoint));
    if (requiresAuth && _authToken != null) {
      request.headers['Authorization'] = 'Bearer $_authToken';
    }
    request.fields.addAll(fields);
    request.files.addAll(files);

    final streamed = await request.send().timeout(const Duration(seconds: 60));
    final response = await http.Response.fromStream(streamed);
    return _parseResponse(response);
  }
}
