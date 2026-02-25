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

// ── Parsing helpers (backend sends mixed types) ─────────────────────────────

/// Backend sends `pharmacy_location` as `{'lat': ..., 'lng': ...}` (Map) from
/// both the REST serializer and WebSocket consumer.  Convert to a display string.
String? _parseLocation(dynamic raw) {
  if (raw == null) return null;
  if (raw is String) return raw;
  if (raw is Map) {
    final lat = raw['lat'];
    final lng = raw['lng'];
    if (lat != null && lng != null) return '$lat, $lng';
  }
  return raw.toString();
}

/// `substitute_price` arrives as a `String` from WebSocket (`str(price)`) and
/// as a `String` from DRF's `DecimalField` serialization.  Handle both.
double? _parsePrice(dynamic raw) {
  if (raw == null) return null;
  if (raw is num) return raw.toDouble();
  if (raw is String) return double.tryParse(raw);
  return null;
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

  /// Computed field from `serializers.py` (pharmacy location string).
  final String? pharmacyLocation;

  final PharmacyResponseType responseType;

  /// Full URL to an optional voice/audio message from the pharmacy.
  final String? audioUrl;

  /// Optional text message from the pharmacy.
  final String textMessage;

  /// Substitute medicine name suggested by the pharmacy.
  final String? substituteName;

  /// Substitute medicine price suggested by the pharmacy.
  final double? substitutePrice;

  final DateTime respondedAt;

  const PharmacyResponseModel({
    required this.id,
    required this.requestId,
    required this.pharmacyId,
    this.pharmacyName,
    this.pharmacyLocation,
    required this.responseType,
    this.audioUrl,
    required this.textMessage,
    this.substituteName,
    this.substitutePrice,
    required this.respondedAt,
  });

  /// Parse from REST API JSON (`GET /medicine/response/`).
  ///
  /// The backend `PharmacyResponseSerializer` returns `audio_url` as an
  /// absolute URL via `SerializerMethodField`.
  factory PharmacyResponseModel.fromJson(Map<String, dynamic> json) =>
      PharmacyResponseModel(
        id: json['id'] as int,
        requestId: json['request'] as int,
        pharmacyId: json['pharmacy'] as int,
        pharmacyName: json['pharmacy_name'] as String?,
        pharmacyLocation: _parseLocation(json['pharmacy_location']),
        responseType: PharmacyResponseType.fromString(
          json['response_type'] as String,
        ),
        // Backend serializer sends 'audio_url' (SerializerMethodField)
        audioUrl: UrlHelper.resolveMediaUrl(
          (json['audio_url'] as String?) ?? (json['audio'] as String?),
        ),
        textMessage: (json['text_message'] as String?) ?? '',
        substituteName: json['substitute_name'] as String?,
        substitutePrice: _parsePrice(json['substitute_price']),
        respondedAt: DateTime.parse(json['responded_at'] as String),
      );

  /// Parse from a WebSocket `pharmacy_response` message.
  ///
  /// WebSocket payloads use slightly different keys:
  /// `response_id`, `message`, `timestamp`, `audio_url`.
  factory PharmacyResponseModel.fromWebSocket(Map<String, dynamic> msg) {
    final responseId = msg['response_id'];
    final requestId = msg['request_id'];
    final pharmacyId = msg['pharmacy_id'];

    return PharmacyResponseModel(
      id: responseId is int
          ? responseId
          : int.tryParse(responseId?.toString() ?? '0') ?? 0,
      requestId: requestId is int
          ? requestId
          : int.tryParse(requestId?.toString() ?? '0') ?? 0,
      pharmacyId: pharmacyId is int
          ? pharmacyId
          : int.tryParse(pharmacyId?.toString() ?? '0') ?? 0,
      pharmacyName: msg['pharmacy_name'] as String?,
      pharmacyLocation: _parseLocation(msg['pharmacy_location']),
      responseType: PharmacyResponseType.fromString(
        (msg['response_type'] as String?) ?? 'ACCEPTED',
      ),
      audioUrl: UrlHelper.resolveMediaUrl(msg['audio_url'] as String?),
      textMessage: (msg['message'] as String?) ?? '',
      substituteName: msg['substitute_name'] as String?,
      substitutePrice: _parsePrice(msg['substitute_price']),
      respondedAt: msg['timestamp'] != null
          ? DateTime.tryParse(msg['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'request': requestId,
    'pharmacy': pharmacyId,
    if (pharmacyName != null) 'pharmacy_name': pharmacyName,
    if (pharmacyLocation != null) 'pharmacy_location': pharmacyLocation,
    'response_type': responseType.toBackend(),
    if (audioUrl != null) 'audio_url': audioUrl,
    'text_message': textMessage,
    if (substituteName != null) 'substitute_name': substituteName,
    if (substitutePrice != null) 'substitute_price': substitutePrice,
    'responded_at': respondedAt.toIso8601String(),
  };

  @override
  String toString() =>
      'PharmacyResponseModel(id: $id, type: ${responseType.toBackend()})';
}
