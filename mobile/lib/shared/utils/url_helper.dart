import 'package:sanjeevani/core/constants/api_base_url.dart';

/// Normalises media URLs returned by the backend.
///
/// The Django backend may return:
/// - A **relative** path like `prescriptions/photo.jpg` (most common — no
///   `MEDIA_URL` is configured on the server).
/// - An **absolute** URL with `localhost` / `127.0.0.1` which is unreachable
///   from an Android emulator or real device.
/// - A proper absolute URL starting with `http://` or `https://`.
/// - `null` / empty string for optional fields (e.g. audio).
///
/// This helper ensures every non-null value becomes a fully-qualified URL
/// that the mobile app can load directly.
class UrlHelper {
  UrlHelper._();

  /// Hosts the backend may use that are unreachable from the mobile device.
  static const _unreachableHosts = ['localhost', '127.0.0.1', '0.0.0.0'];

  /// Returns a full URL for a media path, or `null` when [raw] is absent.
  static String? resolveMediaUrl(String? raw) {
    if (raw == null || raw.isEmpty) return null;

    // Already absolute — check if the host is unreachable from mobile.
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      final uri = Uri.tryParse(raw);
      if (uri != null && _unreachableHosts.contains(uri.host)) {
        // Rewrite to use the correct base URL the app is configured with.
        final baseUri = Uri.parse(ApiBaseUrl.baseUrl);
        final fixed = uri.replace(host: baseUri.host, port: baseUri.port);
        return fixed.toString();
      }
      return raw;
    }

    // Strip any leading slash so we don't get a double-slash.
    final cleaned = raw.startsWith('/') ? raw.substring(1) : raw;
    return '${ApiBaseUrl.baseUrl}$cleaned';
  }
}
