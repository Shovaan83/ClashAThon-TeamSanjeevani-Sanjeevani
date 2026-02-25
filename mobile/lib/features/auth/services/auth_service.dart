import 'package:sanjeevani/config/storage/storage_service.dart';
import 'package:sanjeevani/core/constants/api_endpoints.dart';
import 'package:sanjeevani/core/service/api_service.dart';
import 'package:sanjeevani/features/auth/models/auth_response_model.dart';
import 'package:sanjeevani/features/auth/models/otp_model.dart';

/// Service layer for all authentication operations.
///
/// Wraps [ApiService] HTTP calls and maps raw JSON responses to typed models.
/// Accounts for all three user types: CUSTOMER, PHARMACY, ADMIN.
///
/// Endpoints used:
///   POST  /send-otp          — [sendOtp]
///   POST  /verify-otp        — [verifyOtp]
///   POST  /login             — [login]
///   POST  /customer/register/— [registerCustomer]
///   POST  /register-pharmacy/— [registerPharmacy]
class AuthService {
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();

  // ── OTP ──────────────────────────────────────────────────────────────────

  /// Sends a one-time password to [email].
  ///
  /// Throws [ApiException] on failure.
  Future<void> sendOtp(String email) async {
    await _api.post(ApiEndpoints.sendOtp, body: {'email': email});
  }

  /// Verifies [otp] for [email]. Returns the OTP record on success.
  ///
  /// Throws [ApiException] if the OTP doesn't match.
  Future<OtpModel> verifyOtp(String email, String otp) async {
    final raw = await _api.post(
      ApiEndpoints.verifyOtp,
      body: {'email': email, 'otp': otp},
    );
    final data = (raw as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    return OtpModel.fromJson(data);
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  /// Authenticates a user (any role) and returns tokens + user info.
  ///
  /// Throws [ApiException] if credentials are wrong.
  Future<AuthResponse> login(String email, String password) async {
    final raw = await _api.post(
      ApiEndpoints.login,
      body: {'email': email, 'password': password},
    );
    return AuthResponse.fromJson(raw as Map<String, dynamic>);
  }

  // ── Registration ──────────────────────────────────────────────────────────

  /// Registers a new **customer** (patient).
  ///
  /// Requires a prior verified OTP for [email].
  /// Returns tokens + user info (auto-login).
  Future<AuthResponse> registerCustomer({
    required String email,
    required String name,
    required String phoneNumber,
    required String password,
    required String confirmPassword,
  }) async {
    final raw = await _api.post(
      ApiEndpoints.customerRegister,
      body: {
        'email': email,
        'name': name,
        'phone_number': phoneNumber,
        'password': password,
        'confirm_password': confirmPassword,
      },
    );
    return AuthResponse.fromJson(raw as Map<String, dynamic>);
  }

  /// Registers a new **pharmacy**.
  ///
  /// Does NOT return tokens — the pharmacy must log in separately.
  Future<void> registerPharmacy({
    required String email,
    required String name,
    required String phoneNumber,
    required String password,
    required double lat,
    required double lng,
  }) async {
    await _api.post(
      ApiEndpoints.pharmacyList,
      body: {
        'user': {
          'email': email,
          'password': password,
          'name': name,
          'phone_number': phoneNumber,
        },
        'lat': lat,
        'lng': lng,
      },
    );
  }

  // ── Session helpers ───────────────────────────────────────────────────────

  /// Persists access/refresh tokens and user profile data to local storage.
  ///
  /// Call this after a successful [login] or [registerCustomer].
  Future<void> persistSession(AuthResponse authResponse) async {
    await _api.saveTokens(
      access: authResponse.accessToken,
      refresh: authResponse.refreshToken,
    );
    await _storage.saveUserId(authResponse.user.id);
    await _storage.saveUserRole(authResponse.user.role);
    await _storage.saveUserName(authResponse.user.name);
    await _storage.saveUserEmail(authResponse.user.email);
  }

  /// Clears all tokens and user data from local storage (logout).
  Future<void> logout() async {
    await _api.clearAuthToken();
    await _storage.clearAll();
  }
}
