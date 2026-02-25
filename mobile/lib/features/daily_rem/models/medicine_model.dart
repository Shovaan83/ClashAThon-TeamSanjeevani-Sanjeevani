/// Dart model for DailyRemainder Medicine entity.
class ReminderMedicine {
  final int id;
  final String name;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ReminderMedicine({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ReminderMedicine.fromJson(Map<String, dynamic> json) =>
      ReminderMedicine(
        id: json['id'] as int,
        name: json['name'] as String,
        createdAt: DateTime.parse(json['created_at'] as String),
        updatedAt: DateTime.parse(json['updated_at'] as String),
      );

  Map<String, dynamic> toJson() => {'name': name};

  @override
  String toString() => 'ReminderMedicine(id: $id, name: $name)';
}
