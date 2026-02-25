/// Centralised map of every backend API path.
///
/// URL structure (from core/urls.py):
///   accounts  → root
///   customer  → customer/
///   pharmacy  → root (DRF router: register-pharmacy/)
///   medicine  → medicine/
class ApiEndpoints {
  ApiEndpoints._();

  // ── Auth ────────────────────────────────────────────────
  /// POST  /login  — unified login (all roles)
  static const String login = 'login';

  /// POST  /send-otp  — send OTP to email
  static const String sendOtp = 'send-otp';

  /// POST  /verify-otp  — verify OTP code
  static const String verifyOtp = 'verify-otp';

  // ── Customer ─────────────────────────────────────────────
  /// POST  /customer/register/  — register new patient (after OTP)
  static const String customerRegister = 'customer/register/';

  /// GET / PUT  /customer/profile/  — get or update customer profile
  static const String customerProfile = 'customer/profile/';

  /// GET  /customer/requests/  — list customer's own medicine requests
  static const String customerRequests = 'customer/requests/';

  // ── Pharmacy ─────────────────────────────────────────────
  /// POST  /register-pharmacy/  — register a new pharmacy
  /// GET   /register-pharmacy/  — list all pharmacies
  static const String pharmacyList = 'register-pharmacy/';

  /// GET   /register-pharmacy/{id}/  — retrieve single pharmacy
  static String pharmacyDetail(int id) => 'register-pharmacy/$id/';

  /// GET / POST / PUT / PATCH  /pharmacy/profile/
  static const String pharmacyProfile = 'pharmacy/profile/';

  /// POST  /pharmacy/document/upload/
  static const String pharmacyDocumentUpload = 'pharmacy/document/upload/';

  /// POST / DELETE  /pharmacy/profile-photo/upload/
  static const String pharmacyProfilePhoto = 'pharmacy/profile-photo/upload/';

  // ── Medicine ─────────────────────────────────────────────
  /// POST  /medicine/request/  — customer broadcasts medicine request
  /// GET   /medicine/request/  — get requests (patient: own; pharmacy: nearby)
  static const String medicineRequest = 'medicine/request/';

  /// POST  /medicine/response/  — pharmacy responds accept/reject
  static const String medicineResponse = 'medicine/response/';
}
