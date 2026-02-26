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
  /// GET   /medicine/response/?request_id=<id>  — patient fetches pharmacy offers
  static const String medicineResponse = 'medicine/response/';

  /// POST  /medicine/select/  — patient selects a pharmacy offer
  static const String medicineSelect = 'medicine/select/';

  // ── Accounts Profile (pharmacy extended profile) ─────────
  /// POST  /api/profilecreate/  — create pharmacy extended profile
  static const String accountsProfileCreate = 'api/profilecreate/';

  /// PUT  /api/profileprofile/{pk}/update/  — update pharmacy extended profile
  static String accountsProfileUpdate(int pk) =>
      'api/profileprofile/$pk/update/';

  // ── Daily Reminder ───────────────────────────────────────
  /// GET / POST  /api/daily-reminder/medicines/
  static const String dailyMedicines = 'api/daily-reminder/medicines/';

  /// GET / PUT / DELETE  /api/daily-reminder/medicines/{pk}/
  static String dailyMedicineDetail(int pk) =>
      'api/daily-reminder/medicines/$pk/';

  /// GET / POST  /api/daily-reminder/alarms/
  static const String dailyAlarms = 'api/daily-reminder/alarms/';

  /// GET / PUT / DELETE  /api/daily-reminder/alarms/{pk}/
  static String dailyAlarmDetail(int pk) => 'api/daily-reminder/alarms/$pk/';

  /// GET  /api/daily-reminder/occurrences/?date_from=&date_to=&status=
  static const String dailyOccurrences = 'api/daily-reminder/occurrences/';

  /// PATCH  /api/daily-reminder/occurrences/{pk}/
  static String dailyOccurrenceDetail(int pk) =>
      'api/daily-reminder/occurrences/$pk/';

  /// POST  /api/daily-reminder/device-tokens/
  static const String dailyDeviceTokens = 'api/daily-reminder/device-tokens/';

  /// DELETE  /api/daily-reminder/device-tokens/{pk}/
  static String dailyDeviceTokenDetail(int pk) =>
      'api/daily-reminder/device-tokens/$pk/';

  /// GET  /api/daily-reminder/dashboard/
  static const String dailyDashboard = 'api/daily-reminder/dashboard/';

  /// POST  /api/daily-reminder/sync-notifications/
  static const String dailySyncNotifications =
      'api/daily-reminder/sync-notifications/';
}
