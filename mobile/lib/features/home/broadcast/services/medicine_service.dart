import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:sanjeevani/core/constants/api_endpoints.dart';
import 'package:sanjeevani/core/service/api_service.dart';
import 'package:sanjeevani/features/home/broadcast/models/medicine_request_model.dart';
import 'package:sanjeevani/features/home/broadcast/models/pharmacy_response_model.dart';

/// Service layer for medicine-request broadcast operations.
///
/// Endpoints used:
///   POST / GET  /medicine/request/   — [createRequest], [getRequests]
///   POST        /medicine/response/  — [respondToRequest]
///   GET         /medicine/response/?request_id=  — [getResponsesForRequest]
///   POST        /medicine/select/    — [selectPharmacy]
///
/// The create endpoint accepts a **multipart** form (image file + fields).
class MedicineService {
  final ApiService _api = ApiService();

  // ── Customer — create broadcast ───────────────────────────────────────────

  /// Creates a medicine request and broadcasts it to nearby pharmacies.
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

  // ── Customer — fetch pharmacy offers for a request ────────────────────────

  /// Fetches all pharmacy responses (offers) for a given [requestId].
  ///
  /// Calls `GET /medicine/response/?request_id=<id>`.
  /// Returns a list of [PharmacyResponseModel] with audio URLs, substitute
  /// info, pharmacy name / location, etc.
  Future<List<PharmacyResponseModel>> getResponsesForRequest(
    int requestId,
  ) async {
    final raw = await _api.get(
      ApiEndpoints.medicineResponse,
      queryParams: {'request_id': requestId},
      requiresAuth: true,
    );
    final body = raw as Map<String, dynamic>;
    final list = body['responses'] as List<dynamic>;
    return list
        .map((e) => PharmacyResponseModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Customer — select a pharmacy offer ────────────────────────────────────

  /// Patient selects a specific pharmacy response (offer).
  ///
  /// Calls `POST /medicine/select/` with `{ "response_id": <id> }`.
  /// The backend sets the request to ACCEPTED and notifies the chosen pharmacy
  /// plus any other pharmacies that the request is taken.
  Future<Map<String, dynamic>> selectPharmacy(int responseId) async {
    final raw = await _api.post(
      ApiEndpoints.medicineSelect,
      body: {'response_id': responseId},
      requiresAuth: true,
    );
    return raw as Map<String, dynamic>;
  }

  // ── Pharmacy — respond ────────────────────────────────────────────────────

  /// Pharmacy accepts or rejects a medicine request.
  Future<Map<String, dynamic>> respondToRequest({
    required int requestId,
    required PharmacyResponseType responseType,
    String textMessage = '',
    File? audioFile,
  }) async {
    final fields = <String, String>{
      'request_id': requestId.toString(),
      'response_type': responseType.toBackend(),
      'text_message': textMessage,
    };

    final files = <http.MultipartFile>[];
    if (audioFile != null) {
      files.add(await http.MultipartFile.fromPath('audio', audioFile.path));
    }

    final raw = await _api.postMultipart(
      ApiEndpoints.medicineResponse,
      fields: fields,
      files: files,
      requiresAuth: true,
    );
    return raw as Map<String, dynamic>;
  }
}
