import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:sanjeevani/core/constants/api_endpoints.dart';
import 'package:sanjeevani/core/service/api_service.dart';
import 'package:sanjeevani/features/home/broadcast/models/medicine_request_model.dart';
// ignore: unused_import kept for PharmacyResponseType enum
import 'package:sanjeevani/features/home/broadcast/models/pharmacy_response_model.dart';

/// Service layer for medicine-request broadcast operations.
///
/// Endpoints used:
///   POST / GET  /medicine/request/   — [createRequest], [getRequests]
///   POST        /medicine/response/  — [respondToRequest]
///
/// The create endpoint accepts a **multipart** form (image file + fields).
class MedicineService {
  final ApiService _api = ApiService();

  // ── Customer — create broadcast ───────────────────────────────────────────

  /// Creates a medicine request and broadcasts it to nearby pharmacies.
  ///
  /// [patientLat]  — current latitude of the patient.
  /// [patientLng]  — current longitude of the patient.
  /// [radiusKm]    — search radius in kilometres (default 5).
  /// [quantity]    — number of medicines needed.
  /// [imageFile]   — prescription image to upload.
  ///
  /// Returns a map with `request_id`, `pharmacies_notified`, `message`.
  Future<Map<String, dynamic>> createRequest({
    required double patientLat,
    required double patientLng,
    required double radiusKm,
    required int quantity,
    required File imageFile,
  }) async {
    final multipartImage = await http.MultipartFile.fromPath(
      'image',
      imageFile.path,
    );

    final raw = await _api.postMultipart(
      ApiEndpoints.medicineRequest,
      fields: {
        'patient_lat': patientLat.toString(),
        'patient_lng': patientLng.toString(),
        'radius_km': radiusKm.toString(),
        'quantity': quantity.toString(),
      },
      files: [multipartImage],
      requiresAuth: true,
    );

    return raw as Map<String, dynamic>;
  }

  // ── Shared — list requests ────────────────────────────────────────────────

  /// Returns medicine requests for the authenticated user.
  ///
  /// - **Patient**: returns own requests (any status), newest first.
  /// - **Pharmacy**: returns nearby PENDING requests within pharmacy's radius.
  Future<List<MedicineRequestModel>> getRequests() async {
    final raw = await _api.get(
      ApiEndpoints.medicineRequest,
      requiresAuth: true,
    );
    final body = raw as Map<String, dynamic>;
    final list = body['requests'] as List<dynamic>;
    return list
        .map((e) => MedicineRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Pharmacy — respond ────────────────────────────────────────────────────

  /// Pharmacy accepts or rejects a medicine request.
  ///
  /// [requestId]    — ID of the [MedicineRequestModel] to respond to.
  /// [responseType] — `PharmacyResponseType.accepted` or `.rejected`.
  /// [textMessage]  — optional text message for the patient.
  ///
  /// Returns a map with `response_id`, `response_type`, `request_status`.
  Future<Map<String, dynamic>> respondToRequest({
    required int requestId,
    required PharmacyResponseType responseType,
    String textMessage = '',
  }) async {
    final raw = await _api.post(
      ApiEndpoints.medicineResponse,
      body: {
        'request_id': requestId,
        'response_type': responseType.toBackend(),
        'text_message': textMessage,
      },
      requiresAuth: true,
    );
    return raw as Map<String, dynamic>;
  }
}
