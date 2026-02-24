import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:location/location.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';

/// A reusable map widget that lets the user pick a location by tapping.
/// Requests location permission and centres on the user's current position.
///
/// Returns the selected [LatLng] via [onLocationPicked].
class LocationPickerWidget extends StatefulWidget {
  final LatLng? initialLocation;
  final ValueChanged<LatLng> onLocationPicked;
  final double height;

  const LocationPickerWidget({
    super.key,
    this.initialLocation,
    required this.onLocationPicked,
    this.height = 250,
  });

  @override
  State<LocationPickerWidget> createState() => _LocationPickerWidgetState();
}

class _LocationPickerWidgetState extends State<LocationPickerWidget> {
  final MapController _mapController = MapController();
  final Location _location = Location();

  LatLng? _pickedLocation;
  bool _isLoadingLocation = false;
  String? _errorMessage;

  // Default: Kathmandu, Nepal
  static const LatLng _defaultCenter = LatLng(27.7172, 85.3240);

  @override
  void initState() {
    super.initState();
    _pickedLocation = widget.initialLocation;
    _requestAndMoveToCurrentLocation();
  }

  Future<void> _requestAndMoveToCurrentLocation() async {
    setState(() {
      _isLoadingLocation = true;
      _errorMessage = null;
    });

    try {
      // Check if service is enabled
      bool serviceEnabled = await _location.serviceEnabled();
      if (!serviceEnabled) {
        serviceEnabled = await _location.requestService();
        if (!serviceEnabled) {
          setState(() {
            _errorMessage = 'Location services are disabled';
            _isLoadingLocation = false;
          });
          return;
        }
      }

      // Check permission
      PermissionStatus permission = await _location.hasPermission();
      if (permission == PermissionStatus.denied) {
        permission = await _location.requestPermission();
        if (permission != PermissionStatus.granted &&
            permission != PermissionStatus.grantedLimited) {
          setState(() {
            _errorMessage = 'Location permission denied';
            _isLoadingLocation = false;
          });
          return;
        }
      }

      // Get current location
      final locationData = await _location.getLocation();
      if (locationData.latitude != null && locationData.longitude != null) {
        final currentPos = LatLng(
          locationData.latitude!,
          locationData.longitude!,
        );
        setState(() {
          if (_pickedLocation == null) {
            _pickedLocation = currentPos;
            widget.onLocationPicked(currentPos);
          }
        });
        _mapController.move(
          _pickedLocation ?? currentPos,
          15.0,
        );
      }
    } catch (e) {
      setState(() => _errorMessage = 'Could not get location');
    } finally {
      if (mounted) setState(() => _isLoadingLocation = false);
    }
  }

  void _handleTap(TapPosition tapPosition, LatLng point) {
    setState(() => _pickedLocation = point);
    widget.onLocationPicked(point);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label row
        Row(
          children: [
            const Text(
              'Pharmacy Location',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(width: 4),
            const Text('*', style: TextStyle(color: AppColors.error)),
            const Spacer(),
            if (_isLoadingLocation)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else
              GestureDetector(
                onTap: _requestAndMoveToCurrentLocation,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.my_location,
                      size: 16,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'My Location',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),

        // Map
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Container(
            height: widget.height,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(12),
            ),
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: widget.initialLocation ?? _defaultCenter,
                initialZoom: 13.0,
                onTap: _handleTap,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.sanjeevani.app',
                ),
                if (_pickedLocation != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _pickedLocation!,
                        width: 40,
                        height: 40,
                        child: const Icon(
                          Icons.location_pin,
                          color: AppColors.accent,
                          size: 40,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),

        if (_errorMessage != null) ...[
          const SizedBox(height: 6),
          Text(
            _errorMessage!,
            style: const TextStyle(fontSize: 12, color: AppColors.error),
          ),
        ],

        // Coordinates display
        if (_pickedLocation != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.pin_drop, size: 16, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${_pickedLocation!.latitude.toStringAsFixed(6)}, ${_pickedLocation!.longitude.toStringAsFixed(6)}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
