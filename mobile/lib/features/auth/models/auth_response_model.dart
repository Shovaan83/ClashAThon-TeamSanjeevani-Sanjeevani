import 'package:sanjeevani/features/auth/models/user_model.dart';

/// Wraps the response returned by both the **login** and **register** endpoints.
///
/// Backend shape (both `POST /login` and `POST /customer/register/`):
/// ```json
/// {
///   "status": "success",
///   "message": "...",
///   "data": {
///     "user": { "id", "email", "name", "phone_number", "role" },
///     "tokens": { "access": "...", "refresh": "..." }
///   }
/// }
/// ```
class AuthResponse {
  final UserModel user;
  final String accessToken;
  final String refreshToken;

  const AuthResponse({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  /// Parses the top-level API envelope (the full `response` map).
  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>;
    final tokens = data['tokens'] as Map<String, dynamic>;
    return AuthResponse(
      user: UserModel.fromJson(data['user'] as Map<String, dynamic>),
      accessToken: tokens['access'] as String,
      refreshToken: tokens['refresh'] as String,
    );
  }

  @override
  String toString() =>
      'AuthResponse(user: $user, accessToken: [hidden], refreshToken: [hidden])';
}
