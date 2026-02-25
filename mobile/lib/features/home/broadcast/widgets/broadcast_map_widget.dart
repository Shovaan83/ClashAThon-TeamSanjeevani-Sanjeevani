import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';

/// Flutter map view centered on [center] with a filled radius circle and
/// a location pin. Falls back to a placeholder card when location is null.
class BroadcastMapWidget extends StatelessWidget {
  /// User's GPS location. Shows a placeholder when null.
  final LatLng? center;

  /// Broadcast radius in kilometres.
  final double radiusKm;

  const BroadcastMapWidget({
    super.key,
    required this.center,
    required this.radiusKm,
  });

  @override
  Widget build(BuildContext context) {
    if (center == null) {
      return _LocationPlaceholder();
    }

    return FlutterMap(
      options: MapOptions(
        initialCenter: center!,
        initialZoom: _zoomForRadius(radiusKm),
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag,
        ),
      ),
      children: [
        // ── Base tile layer ──────────────────────────────────
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.sanjeevani.app',
        ),

        // ── Radius circle (filled + border) ─────────────────
        CircleLayer(
          circles: [
            CircleMarker(
              point: center!,
              radius: radiusKm * 1000,
              useRadiusInMeter: true,
              color: AppColors.accent.withValues(alpha: 0.12),
              borderColor: AppColors.accent,
              borderStrokeWidth: 2,
            ),
          ],
        ),

        // ── User location pin ────────────────────────────────
        MarkerLayer(
          markers: [
            Marker(
              point: center!,
              width: 36,
              height: 36,
              child: const _LocationPin(),
            ),
          ],
        ),
      ],
    );
  }

  /// Returns a sensible map zoom level for the given radius.
  double _zoomForRadius(double km) {
    if (km <= 1.0) return 14.5;
    if (km <= 2.0) return 13.5;
    if (km <= 3.5) return 13.0;
    if (km <= 5.0) return 12.5;
    return 12.0;
  }
}

// ── Private sub-widgets ───────────────────────────────────────────────────────

class _LocationPin extends StatelessWidget {
  const _LocationPin();

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            color: Colors.blue.shade600,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 4,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LocationPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFE8EFF0),
      child: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.location_searching,
              size: 40,
              color: AppColors.textSecondary,
            ),
            SizedBox(height: 8),
            Text(
              'Acquiring GPS location…',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
