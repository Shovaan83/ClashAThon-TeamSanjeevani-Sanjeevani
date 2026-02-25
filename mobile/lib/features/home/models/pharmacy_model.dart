import 'package:sanjeevani/features/auth/models/user_model.dart';

/// Mirrors `pharmacy/models.py :: Pharmacy`.
class PharmacyModel {
  final int id;

  /// Embedded user (from `user = OneToOneField(CustomUser)`).
  final UserModel user;

  final double lat;
  final double lng;

  /// Nested document info — present when the serializer includes it.
  final PharmacyDocumentModel? document;

  const PharmacyModel({
    required this.id,
    required this.user,
    required this.lat,
    required this.lng,
    this.document,
  });

  factory PharmacyModel.fromJson(Map<String, dynamic> json) => PharmacyModel(
    id: json['id'] as int,
    user: json['user'] is Map<String, dynamic>
        ? UserModel.fromJson(json['user'] as Map<String, dynamic>)
        : UserModel(
            id: 0,
            email: '',
            name: json['user'].toString(),
            phoneNumber: '',
            role: 'PHARMACY',
          ),
    lat: (json['lat'] as num).toDouble(),
    lng: (json['lng'] as num).toDouble(),
    document: json['document'] != null
        ? PharmacyDocumentModel.fromJson(
            json['document'] as Map<String, dynamic>,
          )
        : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'user': user.toJson(),
    'lat': lat,
    'lng': lng,
    if (document != null) 'document': document!.toJson(),
  };

  @override
  String toString() =>
      'PharmacyModel(id: $id, name: ${user.name}, lat: $lat, lng: $lng)';
}

/// Document status choices from `pharmacy/models.py :: PharmacyDocument.Status`.
enum DocumentStatus {
  pending,
  approved,
  rejected;

  static DocumentStatus fromString(String value) {
    switch (value.toUpperCase()) {
      case 'APPROVED':
        return DocumentStatus.approved;
      case 'REJECTED':
        return DocumentStatus.rejected;
      default:
        return DocumentStatus.pending;
    }
  }

  String toBackend() => name.toUpperCase();
}

/// Mirrors `pharmacy/models.py :: PharmacyDocument`.
class PharmacyDocumentModel {
  final int id;
  final String? documentUrl;
  final bool isActive;
  final DocumentStatus status;

  const PharmacyDocumentModel({
    required this.id,
    this.documentUrl,
    required this.isActive,
    required this.status,
  });

  factory PharmacyDocumentModel.fromJson(Map<String, dynamic> json) =>
      PharmacyDocumentModel(
        id: json['id'] as int,
        documentUrl: json['document'] as String?,
        isActive: (json['is_active'] as bool?) ?? true,
        status: DocumentStatus.fromString(
          (json['status'] as String?) ?? 'PENDING',
        ),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    if (documentUrl != null) 'document': documentUrl,
    'is_active': isActive,
    'status': status.toBackend(),
  };
}
