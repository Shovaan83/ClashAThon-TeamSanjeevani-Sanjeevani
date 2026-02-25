import 'package:sanjeevani/shared/utils/url_helper.dart';

/// Mirrors `medicine/models.py :: PharmacyResponse`.
///
/// RESPONSE_CHOICES: ACCEPTED | REJECTED
enum PharmacyResponseType {
  accepted,
  rejected;

  static PharmacyResponseType fromString(String value) =>
      value.toUpperCase() == 'ACCEPTED'
      ? PharmacyResponseType.accepted
      : PharmacyResponseType.rejected;

  String toBackend() => name.toUpperCase();
}

/// Dart representation of a `PharmacyResponse` record.
///
/// One response per pharmacy per request (enforced by `unique_together`).
class PharmacyResponseModel {
  final int id;
  final int requestId;
  final int pharmacyId;

  /// Computed field from `serializers.py` (pharmacy.user.name).
  final String? pharmacyName;

  final PharmacyResponseType responseType;

  /// Full URL to an optional voice/audio message from the pharmacy.
  final String? audioUrl;

  /// Optional text message from the pharmacy.
  final String textMessage;

  final DateTime respondedAt;

  const PharmacyResponseModel({
    required this.id,
    required this.requestId,
    required this.pharmacyId,
    this.pharmacyName,
    required this.responseType,
    this.audioUrl,
    required this.textMessage,
    required this.respondedAt,
  });

  factory PharmacyResponseModel.fromJson(Map<String, dynamic> json) =>
      PharmacyResponseModel(
        id: json['id'] as int,
        requestId: json['request'] as int,
        pharmacyId: json['pharmacy'] as int,
        pharmacyName: json['pharmacy_name'] as String?,
        responseType: PharmacyResponseType.fromString(
          json['response_type'] as String,
        ),
        audioUrl: UrlHelper.resolveMediaUrl(json['audio'] as String?),
        textMessage: (json['text_message'] as String?) ?? '',
        respondedAt: DateTime.parse(json['responded_at'] as String),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'request': requestId,
    'pharmacy': pharmacyId,
    if (pharmacyName != null) 'pharmacy_name': pharmacyName,
    'response_type': responseType.toBackend(),
    if (audioUrl != null) 'audio': audioUrl,
    'text_message': textMessage,
    'responded_at': respondedAt.toIso8601String(),
  };

  @override
  String toString() =>
      'PharmacyResponseModel(id: $id, type: ${responseType.toBackend()})';
}
