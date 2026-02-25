/// Dart model for DailyRemainder Alarm entity.
class ReminderAlarm {
  final int id;
  final int medicineId;
  final String? medicineName;
  final String startDate; // yyyy-MM-dd
  final String? endDate;
  final String startTime; // HH:mm:ss
  final String? endTime;
  final int timesPerDay;
  final int intervalDays;
  final List<int>? customWeekdays; // [0..6], 0=Mon
  final String timezone;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Detail-only fields (from AlarmDetailSerializer)
  final int? totalOccurrences;
  final int? takenCount;
  final int? missedCount;

  const ReminderAlarm({
    required this.id,
    required this.medicineId,
    this.medicineName,
    required this.startDate,
    this.endDate,
    required this.startTime,
    this.endTime,
    required this.timesPerDay,
    required this.intervalDays,
    this.customWeekdays,
    required this.timezone,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
    this.totalOccurrences,
    this.takenCount,
    this.missedCount,
  });

  factory ReminderAlarm.fromJson(Map<String, dynamic> json) => ReminderAlarm(
    id: json['id'] as int,
    medicineId: json['medicine'] as int,
    medicineName: json['medicine_name'] as String?,
    startDate: json['start_date'] as String,
    endDate: json['end_date'] as String?,
    startTime: json['start_time'] as String,
    endTime: json['end_time'] as String?,
    timesPerDay: json['times_per_day'] as int,
    intervalDays: json['interval_days'] as int? ?? 1,
    customWeekdays: (json['custom_weekdays'] as List<dynamic>?)
        ?.map((e) => e as int)
        .toList(),
    timezone: json['timezone'] as String? ?? 'Asia/Kathmandu',
    isActive: json['is_active'] as bool? ?? true,
    createdAt: DateTime.parse(json['created_at'] as String),
    updatedAt: DateTime.parse(json['updated_at'] as String),
    totalOccurrences: json['total_occurrences'] as int?,
    takenCount: json['taken_count'] as int?,
    missedCount: json['missed_count'] as int?,
  );

  Map<String, dynamic> toJson() => {
    'medicine': medicineId,
    'start_date': startDate,
    if (endDate != null) 'end_date': endDate,
    'start_time': startTime,
    if (endTime != null) 'end_time': endTime,
    'times_per_day': timesPerDay,
    'interval_days': intervalDays,
    if (customWeekdays != null) 'custom_weekdays': customWeekdays,
    'timezone': timezone,
    'is_active': isActive,
  };

  @override
  String toString() =>
      'ReminderAlarm(id: $id, medicine: $medicineName, active: $isActive)';
}
