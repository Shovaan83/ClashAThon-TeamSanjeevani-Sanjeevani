import 'package:sanjeevani/features/daily_rem/models/occurrence_model.dart';

/// Dashboard summary returned by GET /api/daily-reminder/dashboard/.
class ReminderDashboard {
  final int totalMedicines;
  final int activeAlarms;
  final int todayScheduled;
  final int todayTaken;
  final int todayMissed;
  final int todayPending;
  final double adherenceRate;
  final int currentStreak;
  final int totalTakenAllTime;
  final int totalMissedAllTime;
  final List<AlarmOccurrence> upcomingOccurrences;

  const ReminderDashboard({
    required this.totalMedicines,
    required this.activeAlarms,
    required this.todayScheduled,
    required this.todayTaken,
    required this.todayMissed,
    required this.todayPending,
    required this.adherenceRate,
    required this.currentStreak,
    required this.totalTakenAllTime,
    required this.totalMissedAllTime,
    required this.upcomingOccurrences,
  });

  factory ReminderDashboard.fromJson(Map<String, dynamic> json) =>
      ReminderDashboard(
        totalMedicines: json['total_medicines'] as int? ?? 0,
        activeAlarms: json['active_alarms'] as int? ?? 0,
        todayScheduled: json['today_scheduled'] as int? ?? 0,
        todayTaken: json['today_taken'] as int? ?? 0,
        todayMissed: json['today_missed'] as int? ?? 0,
        todayPending: json['today_pending'] as int? ?? 0,
        adherenceRate: (json['adherence_rate'] as num?)?.toDouble() ?? 0.0,
        currentStreak: json['current_streak'] as int? ?? 0,
        totalTakenAllTime: json['total_taken_all_time'] as int? ?? 0,
        totalMissedAllTime: json['total_missed_all_time'] as int? ?? 0,
        upcomingOccurrences:
            (json['upcoming_occurrences'] as List<dynamic>?)
                ?.map(
                  (e) => AlarmOccurrence.fromJson(e as Map<String, dynamic>),
                )
                .toList() ??
            [],
      );
}
