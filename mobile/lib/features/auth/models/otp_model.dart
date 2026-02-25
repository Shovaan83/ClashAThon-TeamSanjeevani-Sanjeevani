/// Mirrors the `Otp` model in the backend (`accounts/models.py`).
///
/// Used to represent OTP verification state returned by
/// `POST /send-otp` and `POST /verify-otp`.
class OtpModel {
  final String email;
  final String? otp;
  final bool isVerified;

  const OtpModel({required this.email, this.otp, required this.isVerified});

  factory OtpModel.fromJson(Map<String, dynamic> json) => OtpModel(
    email: json['email'] as String,
    otp: json['otp'] as String?,
    isVerified: (json['is_verified'] as bool?) ?? false,
  );

  Map<String, dynamic> toJson() => {
    'email': email,
    if (otp != null) 'otp': otp,
    'is_verified': isVerified,
  };
}
