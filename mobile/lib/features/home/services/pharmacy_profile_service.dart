import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:sanjeevani/core/constants/api_endpoints.dart';
import 'package:sanjeevani/core/service/api_service.dart';

/// Service layer for pharmacy profile operations.
///
/// Endpoints used:
///   GET / POST / PUT / PATCH  /pharmacy/profile/
///   POST                      /pharmacy/document/upload/
///   POST / DELETE              /pharmacy/profile-photo/upload/
class PharmacyProfileService {
  final ApiService _api = ApiService();

  /// Get the current pharmacy's profile.
  Future<Map<String, dynamic>> getProfile() async {
    final raw = await _api.get(
      ApiEndpoints.pharmacyProfile,
      requiresAuth: true,
    );
    return (raw as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  }

  /// Create a pharmacy profile (POST).
  Future<Map<String, dynamic>> createProfile({
    required String name,
    String? address,
    String? phoneNumber,
    double? lat,
    double? lng,
    File? document,
    File? profilePhoto,
  }) async {
    final fields = <String, String>{
      'name': name,
      if (address != null) 'address': address,
      if (phoneNumber != null) 'phone_number': phoneNumber,
      if (lat != null) 'lat': lat.toString(),
      if (lng != null) 'lng': lng.toString(),
    };

    final files = <http.MultipartFile>[];
    if (document != null) {
      files.add(await http.MultipartFile.fromPath('document', document.path));
    }
    if (profilePhoto != null) {
      files.add(
        await http.MultipartFile.fromPath('profile_photo', profilePhoto.path),
      );
    }

    final raw = await _api.postMultipart(
      ApiEndpoints.pharmacyProfile,
      fields: fields,
      files: files,
      requiresAuth: true,
    );
    return (raw as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  }

  /// Update pharmacy profile (PATCH for partial update).
  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? address,
    String? phoneNumber,
    double? lat,
    double? lng,
  }) async {
    final body = <String, dynamic>{
      if (name != null) 'name': name,
      if (address != null) 'address': address,
      if (phoneNumber != null) 'phone_number': phoneNumber,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
    };

    final raw = await _api.patch(
      ApiEndpoints.pharmacyProfile,
      body: body,
      requiresAuth: true,
    );
    return (raw as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  }

  /// Upload pharmacy document.
  Future<Map<String, dynamic>> uploadDocument(File document) async {
    final file = await http.MultipartFile.fromPath('document', document.path);
    final raw = await _api.postMultipart(
      ApiEndpoints.pharmacyDocumentUpload,
      fields: {},
      files: [file],
      requiresAuth: true,
    );
    return raw as Map<String, dynamic>;
  }

  /// Upload pharmacy profile photo.
  Future<Map<String, dynamic>> uploadProfilePhoto(File photo) async {
    final file = await http.MultipartFile.fromPath('profile_photo', photo.path);
    final raw = await _api.postMultipart(
      ApiEndpoints.pharmacyProfilePhoto,
      fields: {},
      files: [file],
      requiresAuth: true,
    );
    return raw as Map<String, dynamic>;
  }
}
