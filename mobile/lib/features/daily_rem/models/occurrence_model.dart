/// Status for an alarm occurrence.
enum OccurrenceStatus {
  scheduled,
  taken,
  missed,
  skipped;

  static OccurrenceStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'taken':
        return OccurrenceStatus.taken;
      case 'missed':
        return OccurrenceStatus.missed;
      case 'skipped':
        return OccurrenceStatus.skipped;
      default:
        return OccurrenceStatus.scheduled;
    }
  }

  String toBackend() => name;
}

/// Dart model for DailyRemainder AlarmOccurrence entity.
class AlarmOccurrence {
  final int id;
  final int alarmId;
  final String? medicineName;
  final DateTime scheduledAt;
  final DateTime? takenAt;
  final OccurrenceStatus status;
  final DateTime createdAt;

  const AlarmOccurrence({
    required this.id,
    required this.alarmId,
    this.medicineName,
    required this.scheduledAt,
    this.takenAt,
    required this.status,
    required this.createdAt,
  });

  factory AlarmOccurrence.fromJson(Map<String, dynamic> json) =>
      AlarmOccurrence(
        id: json['id'] as int,
        alarmId: json['alarm_id'] as int,
        medicineName: json['medicine_name'] as String?,
        scheduledAt: DateTime.parse(json['scheduled_at'] as String),
        takenAt: json['taken_at'] != null
            ? DateTime.parse(json['taken_at'] as String)
            : null,
        status: OccurrenceStatus.fromString(
          json['status'] as String? ?? 'scheduled',
        ),
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  @override
  String toString() =>
      'AlarmOccurrence(id: $id, medicine: $medicineName, status: ${status.name})';
}
