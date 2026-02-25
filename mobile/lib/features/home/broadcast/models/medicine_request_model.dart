/// Mirrors `medicine/models.py :: MedicineRequest`.
///
/// STATUS_CHOICES: PENDING | ACCEPTED | REJECTED | CANCELLED
enum RequestStatus {
  pending,
  accepted,
  rejected,
  cancelled;

  static RequestStatus fromString(String value) {
    switch (value.toUpperCase()) {
      case 'ACCEPTED':
        return RequestStatus.accepted;
      case 'REJECTED':
        return RequestStatus.rejected;
      case 'CANCELLED':
        return RequestStatus.cancelled;
      default:
        return RequestStatus.pending;
    }
  }

  String toBackend() => name.toUpperCase();
}

/// Dart representation of a `MedicineRequest` record.
class MedicineRequestModel {
  final int id;
  final int patientId;

  /// Computed field from `serializers.py` (patient.name).
  final String? patientName;

  /// null until a pharmacy accepts.
  final int? pharmacyId;

  /// Computed field from `serializers.py` (pharmacy.user.name).
  final String? pharmacyName;

  final double patientLat;
  final double patientLng;

  /// Search radius in kilometres.
  final double radiusKm;

  final int quantity;

  /// Full URL to the prescription image.
  final String imageUrl;

  final RequestStatus status;

  final DateTime createdAt;
  final DateTime updatedAt;

  const MedicineRequestModel({
    required this.id,
    required this.patientId,
    this.patientName,
    this.pharmacyId,
    this.pharmacyName,
    required this.patientLat,
    required this.patientLng,
    required this.radiusKm,
    required this.quantity,
    required this.imageUrl,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MedicineRequestModel.fromJson(Map<String, dynamic> json) =>
      MedicineRequestModel(
        id: json['id'] as int,
        patientId: json['patient'] as int,
        patientName: json['patient_name'] as String?,
        pharmacyId: json['pharmacy'] as int?,
        pharmacyName: json['pharmacy_name'] as String?,
        patientLat: (json['patient_lat'] as num).toDouble(),
        patientLng: (json['patient_lng'] as num).toDouble(),
        radiusKm: (json['radius_km'] as num).toDouble(),
        quantity: json['quantity'] as int,
        imageUrl: json['image'] as String,
        status: RequestStatus.fromString(json['status'] as String),
        createdAt: DateTime.parse(json['created_at'] as String),
        updatedAt: DateTime.parse(json['updated_at'] as String),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'patient': patientId,
    if (patientName != null) 'patient_name': patientName,
    if (pharmacyId != null) 'pharmacy': pharmacyId,
    if (pharmacyName != null) 'pharmacy_name': pharmacyName,
    'patient_lat': patientLat,
    'patient_lng': patientLng,
    'radius_km': radiusKm,
    'quantity': quantity,
    'image': imageUrl,
    'status': status.toBackend(),
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
  };

  @override
  String toString() =>
      'MedicineRequestModel(id: $id, status: ${status.toBackend()}, qty: $quantity)';
}
