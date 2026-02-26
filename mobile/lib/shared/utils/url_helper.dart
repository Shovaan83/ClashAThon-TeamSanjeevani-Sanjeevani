import 'package:sanjeevani/core/constants/api_base_url.dart';

/// Normalises media URLs returned by the backend.
///
/// The Django backend may return:
/// - A **relative** path like `prescriptions/photo.jpg` (most common — no
///   `MEDIA_URL` is configured on the server).
/// - An **absolute** URL starting with `http://` or `https://`.
/// - `null` / empty string for optional fields (e.g. audio).
///
/// This helper ensures every non-null value becomes a fully-qualified URL
/// that the mobile app can load directly.
class UrlHelper {
  UrlHelper._();

  /// Returns a full URL for a media path, or `null` when [raw] is absent.
  static String? resolveMediaUrl(String? raw) {
    if (raw == null || raw.isEmpty) return null;

    // Already absolute — use as-is.
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }

    // Strip any leading slash so we don't get a double-slash.
    final cleaned = raw.startsWith('/') ? raw.substring(1) : raw;
    return '${ApiBaseUrl.baseUrl}$cleaned';
  }
}
