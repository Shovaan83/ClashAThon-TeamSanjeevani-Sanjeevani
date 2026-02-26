import 'package:sanjeevani/core/constants/api_endpoints.dart';
import 'package:sanjeevani/core/service/api_service.dart';
import 'package:sanjeevani/features/home/models/pharmacy_model.dart';

/// Service layer for pharmacy-related operations.
///
/// Endpoints used:
///   GET  /register-pharmacy/      — [listPharmacies]
///   GET  /register-pharmacy/{id}/ — [getPharmacy]
class PharmacyService {
  final ApiService _api = ApiService();

  // ── Listing ───────────────────────────────────────────────────────────────

  /// Returns all registered pharmacies.
  Future<List<PharmacyModel>> listPharmacies() async {
    final raw = await _api.get(ApiEndpoints.pharmacyList);
    final data = ((raw as Map<String, dynamic>)['data']) as List<dynamic>;
    return data
        .map((e) => PharmacyModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Returns a single pharmacy by [id].
  Future<PharmacyModel> getPharmacy(int id) async {
    final raw = await _api.get(ApiEndpoints.pharmacyDetail(id));
    final data = (raw as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    return PharmacyModel.fromJson(data);
  }
}
