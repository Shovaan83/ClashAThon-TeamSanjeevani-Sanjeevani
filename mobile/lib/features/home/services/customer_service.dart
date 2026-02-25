import 'package:sanjeevani/core/constants/api_endpoints.dart';
import 'package:sanjeevani/core/service/api_service.dart';
import 'package:sanjeevani/features/auth/models/user_model.dart';
import 'package:sanjeevani/features/home/broadcast/models/medicine_request_model.dart';

/// Service layer for customer-specific operations.
///
/// All endpoints require a valid JWT access token ([requiresAuth: true]).
///
/// Endpoints used:
///   GET /PUT  /customer/profile/   — [getProfile], [updateProfile]
///   GET       /customer/requests/  — [getMyRequests]
class CustomerService {
  final ApiService _api = ApiService();

  // ── Profile ───────────────────────────────────────────────────────────────

  /// Fetches the authenticated customer's profile.
  ///
  /// Returns fields: id, email, name, phone_number, role, date_joined.
  Future<UserModel> getProfile() async {
    final raw = await _api.get(
      ApiEndpoints.customerProfile,
      requiresAuth: true,
    );
    final data = (raw as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// Partially updates the authenticated customer's profile.
  ///
  /// Only [name] and [phoneNumber] can be updated (email/role are read-only).
  Future<UserModel> updateProfile({String? name, String? phoneNumber}) async {
    final raw = await _api.put(
      ApiEndpoints.customerProfile,
      body: {
        if (name != null) 'name': name,
        if (phoneNumber != null) 'phone_number': phoneNumber,
      },
      requiresAuth: true,
    );
    final data = (raw as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  // ── Medicine requests ─────────────────────────────────────────────────────

  /// Returns all medicine requests placed by the logged-in customer,
  /// ordered by most-recent first.
  Future<List<MedicineRequestModel>> getMyRequests() async {
    final raw = await _api.get(
      ApiEndpoints.customerRequests,
      requiresAuth: true,
    );
    final data = (raw as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    final list = data['requests'] as List<dynamic>;
    return list
        .map((e) => MedicineRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
