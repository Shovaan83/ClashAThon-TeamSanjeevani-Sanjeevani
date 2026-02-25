import 'package:sanjeevani/core/constants/api_endpoints.dart';
import 'package:sanjeevani/core/service/api_service.dart';
import 'package:sanjeevani/features/daily_rem/models/alarm_model.dart';
import 'package:sanjeevani/features/daily_rem/models/dashboard_model.dart';
import 'package:sanjeevani/features/daily_rem/models/medicine_model.dart';
import 'package:sanjeevani/features/daily_rem/models/occurrence_model.dart';

/// Service layer for all DailyReminder REST API calls.
///
/// Backend wraps every response in `{"status":"success","data":...}`.
/// [ApiService._parseResponse] already unwraps the HTTP layer; the
/// `data` key is extracted here.
class DailyReminderService {
  final ApiService _api = ApiService();

  // ── Medicines ──────────────────────────────────────────────────────────────

  /// GET /api/daily-reminder/medicines/
  Future<List<ReminderMedicine>> getMedicines() async {
    final res = await _api.get(ApiEndpoints.dailyMedicines, requiresAuth: true);
    final data = _extractData(res);
    if (data is List) {
      return data
          .map((e) => ReminderMedicine.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// POST /api/daily-reminder/medicines/
  Future<ReminderMedicine> createMedicine(String name) async {
    final res = await _api.post(
      ApiEndpoints.dailyMedicines,
      body: {'name': name},
      requiresAuth: true,
    );
    return ReminderMedicine.fromJson(_extractData(res) as Map<String, dynamic>);
  }

  /// PUT /api/daily-reminder/medicines/{pk}/
  Future<ReminderMedicine> updateMedicine(int pk, String name) async {
    final res = await _api.put(
      ApiEndpoints.dailyMedicineDetail(pk),
      body: {'name': name},
      requiresAuth: true,
    );
    return ReminderMedicine.fromJson(_extractData(res) as Map<String, dynamic>);
  }

  /// DELETE /api/daily-reminder/medicines/{pk}/
  Future<void> deleteMedicine(int pk) async {
    await _api.delete(ApiEndpoints.dailyMedicineDetail(pk), requiresAuth: true);
  }

  // ── Alarms ─────────────────────────────────────────────────────────────────

  /// GET /api/daily-reminder/alarms/
  Future<List<ReminderAlarm>> getAlarms({bool? isActive}) async {
    String endpoint = ApiEndpoints.dailyAlarms;
    if (isActive != null) {
      endpoint += '?is_active=${isActive ? 'true' : 'false'}';
    }
    final res = await _api.get(endpoint, requiresAuth: true);
    final data = _extractData(res);
    if (data is List) {
      return data
          .map((e) => ReminderAlarm.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// POST /api/daily-reminder/alarms/
  Future<ReminderAlarm> createAlarm(Map<String, dynamic> body) async {
    final res = await _api.post(
      ApiEndpoints.dailyAlarms,
      body: body,
      requiresAuth: true,
    );
    return ReminderAlarm.fromJson(_extractData(res) as Map<String, dynamic>);
  }

  /// GET /api/daily-reminder/alarms/{pk}/
  Future<ReminderAlarm> getAlarmDetail(int pk) async {
    final res = await _api.get(
      ApiEndpoints.dailyAlarmDetail(pk),
      requiresAuth: true,
    );
    return ReminderAlarm.fromJson(_extractData(res) as Map<String, dynamic>);
  }

  /// PUT /api/daily-reminder/alarms/{pk}/
  Future<ReminderAlarm> updateAlarm(int pk, Map<String, dynamic> body) async {
    final res = await _api.put(
      ApiEndpoints.dailyAlarmDetail(pk),
      body: body,
      requiresAuth: true,
    );
    return ReminderAlarm.fromJson(_extractData(res) as Map<String, dynamic>);
  }

  /// DELETE /api/daily-reminder/alarms/{pk}/  (soft-delete: sets is_active=false)
  Future<void> deleteAlarm(int pk) async {
    await _api.delete(ApiEndpoints.dailyAlarmDetail(pk), requiresAuth: true);
  }

  // ── Occurrences ────────────────────────────────────────────────────────────

  /// GET /api/daily-reminder/occurrences/?date_from=&date_to=&status=
  Future<List<AlarmOccurrence>> getOccurrences({
    String? dateFrom,
    String? dateTo,
    String? status,
  }) async {
    final params = <String>[];
    if (dateFrom != null) params.add('date_from=$dateFrom');
    if (dateTo != null) params.add('date_to=$dateTo');
    if (status != null) params.add('status=$status');

    String endpoint = ApiEndpoints.dailyOccurrences;
    if (params.isNotEmpty) endpoint += '?${params.join('&')}';

    final res = await _api.get(endpoint, requiresAuth: true);
    final data = _extractData(res);
    if (data is List) {
      return data
          .map((e) => AlarmOccurrence.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// PATCH /api/daily-reminder/occurrences/{pk}/
  Future<AlarmOccurrence> updateOccurrence(
    int pk, {
    required String status,
  }) async {
    final res = await _api.patch(
      ApiEndpoints.dailyOccurrenceDetail(pk),
      body: {'status': status},
      requiresAuth: true,
    );
    return AlarmOccurrence.fromJson(_extractData(res) as Map<String, dynamic>);
  }

  // ── Device Tokens ──────────────────────────────────────────────────────────

  /// POST /api/daily-reminder/device-tokens/
  Future<Map<String, dynamic>> registerDeviceToken({
    required String token,
    required String platform,
  }) async {
    final res = await _api.post(
      ApiEndpoints.dailyDeviceTokens,
      body: {'token': token, 'platform': platform},
      requiresAuth: true,
    );
    return _extractData(res) as Map<String, dynamic>;
  }

  /// DELETE /api/daily-reminder/device-tokens/{pk}/
  Future<void> deleteDeviceToken(int pk) async {
    await _api.delete(
      ApiEndpoints.dailyDeviceTokenDetail(pk),
      requiresAuth: true,
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  /// GET /api/daily-reminder/dashboard/
  Future<ReminderDashboard> getDashboard() async {
    final res = await _api.get(ApiEndpoints.dailyDashboard, requiresAuth: true);
    return ReminderDashboard.fromJson(
      _extractData(res) as Map<String, dynamic>,
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /// Backend wraps payload in `{"status":"success","data":<payload>}`.
  dynamic _extractData(dynamic response) {
    if (response is Map<String, dynamic>) {
      return response['data'] ?? response;
    }
    return response;
  }
}
