/// Mirrors the `CustomUser` model in the Django backend.
///
/// Fields: id, email, name, phone_number, role (CUSTOMER | PHARMACY | ADMIN)
/// Also includes `dateJoined` which is returned by the profile endpoint.
class UserModel {
  final int id;
  final String email;
  final String name;
  final String phoneNumber;

  /// One of "CUSTOMER", "PHARMACY", "ADMIN" — raw backend string.
  final String role;

  /// Returned only by the profile endpoint (nullable elsewhere).
  final DateTime? dateJoined;

  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.phoneNumber,
    required this.role,
    this.dateJoined,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id: json['id'] as int,
    email: json['email'] as String,
    name: json['name'] as String,
    phoneNumber: json['phone_number'] as String,
    role: json['role'] as String,
    dateJoined: json['date_joined'] != null
        ? DateTime.tryParse(json['date_joined'] as String)
        : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'name': name,
    'phone_number': phoneNumber,
    'role': role,
    if (dateJoined != null) 'date_joined': dateJoined!.toIso8601String(),
  };

  UserModel copyWith({
    int? id,
    String? email,
    String? name,
    String? phoneNumber,
    String? role,
    DateTime? dateJoined,
  }) => UserModel(
    id: id ?? this.id,
    email: email ?? this.email,
    name: name ?? this.name,
    phoneNumber: phoneNumber ?? this.phoneNumber,
    role: role ?? this.role,
    dateJoined: dateJoined ?? this.dateJoined,
  );

  @override
  String toString() =>
      'UserModel(id: $id, email: $email, name: $name, role: $role)';
}
