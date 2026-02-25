import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:location/location.dart';
import 'package:provider/provider.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/providers/notification_provider.dart';
import 'package:sanjeevani/features/home/broadcast/services/medicine_service.dart';
import 'package:sanjeevani/features/home/broadcast/widgets/broadcast_map_widget.dart';
import 'package:sanjeevani/features/home/broadcast/widgets/live_radar_badge.dart';
import 'package:sanjeevani/features/home/broadcast/widgets/location_status_chip.dart';
import 'package:sanjeevani/features/home/broadcast/widgets/pharmacy_count_badge.dart';
import 'package:sanjeevani/features/home/broadcast/widgets/prescription_uploader_widget.dart';
import 'package:sanjeevani/features/home/broadcast/widgets/radius_selector_widget.dart';

/// Patient broadcast screen — lets the patient attach a prescription,
/// pick a radius, and broadcast to nearby pharmacies.
class BroadcastRequestScreen extends StatefulWidget {
  const BroadcastRequestScreen({super.key});

  @override
  State<BroadcastRequestScreen> createState() => _BroadcastRequestScreenState();
}

class _BroadcastRequestScreenState extends State<BroadcastRequestScreen> {
  // ── State ─────────────────────────────────────────────────────────────────
  LatLng? _userLocation;
  bool _isLoadingLocation = true;

  XFile? _prescription;
  bool _autoDetectPii = true;
  bool _privacyShield = true;

  double _radius = 3.5;

  bool _isBroadcasting = false;

  /// Quantity controller for medicine count.
  final TextEditingController _quantityController =
      TextEditingController(text: '1');

  /// Placeholder — real count would come from the API.
  static const int _pharmacyCount = 12;

  final MedicineService _medicineService = MedicineService();

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _fetchLocation();
  }

  Future<void> _fetchLocation() async {
    final loc = Location();
    try {
      bool serviceEnabled = await loc.serviceEnabled();
      if (!serviceEnabled) {
        serviceEnabled = await loc.requestService();
        if (!serviceEnabled) {
          if (mounted) setState(() => _isLoadingLocation = false);
          return;
        }
      }

      PermissionStatus permission = await loc.hasPermission();
      if (permission == PermissionStatus.denied) {
        permission = await loc.requestPermission();
        if (permission != PermissionStatus.granted) {
          if (mounted) setState(() => _isLoadingLocation = false);
          return;
        }
      }

      final data = await loc.getLocation().timeout(const Duration(seconds: 10));
      if (mounted && data.latitude != null && data.longitude != null) {
        setState(() {
          _userLocation = LatLng(data.latitude!, data.longitude!);
          _isLoadingLocation = false;
        });
      }
    } catch (e) {
      debugPrint('Location error: $e');
      if (mounted) setState(() => _isLoadingLocation = false);
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  Future<void> _handleBroadcast() async {
    if (_prescription == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please attach your prescription first.')),
      );
      return;
    }
    if (_userLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Waiting for your location…')),
      );
      return;
    }

    final quantity = int.tryParse(_quantityController.text) ?? 1;
    if (quantity < 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Quantity must be at least 1.')),
      );
      return;
    }

    setState(() => _isBroadcasting = true);

    try {
      final result = await _medicineService.createRequest(
        patientLat: _userLocation!.latitude,
        patientLng: _userLocation!.longitude,
        radiusKm: _radius,
        quantity: quantity,
        imageFile: File(_prescription!.path),
      );

      final pharmaciesNotified = result['pharmacies_notified'] ?? 0;
      final message = result['message'] as String? ?? 'Broadcast sent!';

      if (mounted) {
        // Refresh notification provider requests
        context.read<NotificationProvider>().fetchRequests();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              pharmaciesNotified > 0
                  ? '$message ($pharmaciesNotified pharmacies notified)'
                  : message,
            ),
            backgroundColor: AppColors.primary,
          ),
        );

        // Reset form
        setState(() {
          _prescription = null;
          _quantityController.text = '1';
          _isBroadcasting = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isBroadcasting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.toString().replaceAll('Exception: ', ''),
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // ── Map section ────────────────────────────────────
        SizedBox(
          height: 290,
          child: Stack(
            children: [
              BroadcastMapWidget(center: _userLocation, radiusKm: _radius),

              // Pharmacy count badge — top right
              Positioned(
                top: 12,
                right: 12,
                child: PharmacyCountBadge(count: _pharmacyCount),
              ),

              // Refresh location button — bottom right
              Positioned(
                bottom: 12,
                right: 12,
                child: _MapIconButton(
                  icon: _isLoadingLocation
                      ? Icons.hourglass_empty
                      : Icons.my_location,
                  onTap: _isLoadingLocation ? null : _fetchLocation,
                ),
              ),
            ],
          ),
        ),

        // ── Control panel ──────────────────────────────────
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Live radar badge
                const LiveRadarBadge(),

                const SizedBox(height: 8),

                // Title
                Text(
                  'Broadcast Request',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Securely upload and broadcast your prescription to pharmacies within range.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),

                const SizedBox(height: 16),

                // Location chip
                LocationStatusChip(
                  lat: _userLocation?.latitude,
                  lng: _userLocation?.longitude,
                ),

                const SizedBox(height: 10),

                // Privacy shield chip
                _PrivacyShieldChip(
                  enabled: _privacyShield,
                  onToggle: (v) => setState(() => _privacyShield = v),
                ),

                const SizedBox(height: 20),

                // Prescription uploader
                PrescriptionUploaderWidget(
                  file: _prescription,
                  onFilePicked: (f) => setState(() => _prescription = f),
                  onRemove: () => setState(() => _prescription = null),
                  autoDetectPii: _autoDetectPii,
                  onAutoDetectPiiChanged: (v) =>
                      setState(() => _autoDetectPii = v),
                ),

                const SizedBox(height: 24),

                // Quantity input
                _QuantityField(controller: _quantityController),

                const SizedBox(height: 20),

                // Radius selector
                RadiusSelectorWidget(
                  value: _radius,
                  onChanged: (v) => setState(() => _radius = v),
                ),

                const SizedBox(height: 28),

                // Broadcast button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: _isBroadcasting ? null : _handleBroadcast,
                    icon: _isBroadcasting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : const Icon(Icons.sensors, size: 20),
                    label: Text(
                      _isBroadcasting ? 'BROADCASTING…' : 'BROADCAST REQUEST',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: AppColors.accent.withValues(
                        alpha: 0.5,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // Disclaimer
                const Center(
                  child: Text(
                    'Your request will expire automatically in 30 minutes.',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

class _PrivacyShieldChip extends StatelessWidget {
  final bool enabled;
  final ValueChanged<bool> onToggle;

  const _PrivacyShieldChip({required this.enabled, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onToggle(!enabled),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: enabled
              ? AppColors.primary.withValues(alpha: 0.08)
              : AppColors.border.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: enabled
                ? AppColors.primary.withValues(alpha: 0.3)
                : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.shield_outlined,
              size: 15,
              color: enabled ? AppColors.primary : AppColors.textSecondary,
            ),
            const SizedBox(width: 6),
            Text(
              enabled ? 'Privacy Shield Enabled' : 'Privacy Shield Disabled',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: enabled ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MapIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;

  const _MapIconButton({required this.icon, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Icon(icon, size: 18, color: AppColors.primary),
      ),
    );
  }
}

class _QuantityField extends StatelessWidget {
  final TextEditingController controller;

  const _QuantityField({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'MEDICINE QUANTITY',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: 120,
          child: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            decoration: InputDecoration(
              filled: true,
              fillColor: AppColors.primary.withValues(alpha: 0.05),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    BorderSide(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    BorderSide(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.primary),
              ),
              hintText: '1',
              hintStyle: const TextStyle(color: AppColors.textSecondary),
            ),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}
