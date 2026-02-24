import 'package:flutter/material.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';

/// Green location chip shown when GPS is acquired.
/// Shows "Detecting location..." when [lat] and [lng] are null.
class LocationStatusChip extends StatelessWidget {
  final double? lat;
  final double? lng;

  const LocationStatusChip({super.key, this.lat, this.lng});

  @override
  Widget build(BuildContext context) {
    final hasLocation = lat != null && lng != null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: hasLocation
            ? AppColors.primary.withValues(alpha: 0.08)
            : AppColors.border.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: hasLocation
              ? AppColors.primary.withValues(alpha: 0.25)
              : AppColors.border,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.location_on_outlined,
            size: 15,
            color: hasLocation ? AppColors.primary : AppColors.textSecondary,
          ),
          const SizedBox(width: 6),
          Text(
            hasLocation
                ? 'Location detected — ${lat!.toStringAsFixed(4)}, ${lng!.toStringAsFixed(4)}'
                : 'Detecting location...',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: hasLocation ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
