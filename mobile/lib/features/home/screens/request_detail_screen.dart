import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/providers/notification_provider.dart';
import 'package:sanjeevani/features/home/broadcast/models/medicine_request_model.dart';
import 'package:sanjeevani/shared/widgets/voice_recorder_sheet.dart';

/// Full‐detail screen for a pharmacy to inspect a medicine request.
///
/// Shows patient info, prescription image (full-size), location, quantity,
/// radius, timestamps, and accept / reject buttons.
class RequestDetailScreen extends StatelessWidget {
  final MedicineRequestModel request;

  const RequestDetailScreen({super.key, required this.request});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text('Request #${request.id}'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Prescription image (full width) ──────────
            if (request.imageUrl.isNotEmpty)
              _PrescriptionImage(url: request.imageUrl),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Status badge ───────────────────────
                  _StatusBadge(status: request.status),
                  const SizedBox(height: 16),

                  // ── Patient info card ──────────────────
                  _SectionCard(
                    icon: Icons.person_outline,
                    title: 'Patient Information',
                    children: [
                      _DetailRow(
                        label: 'Name',
                        value:
                            request.patientName ??
                            'Patient #${request.patientId}',
                      ),
                      _DetailRow(
                        label: 'Patient ID',
                        value: '#${request.patientId}',
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ── Medicine details card ──────────────
                  _SectionCard(
                    icon: Icons.medical_services_outlined,
                    title: 'Medicine Details',
                    children: [
                      _DetailRow(
                        label: 'Quantity Needed',
                        value: '${request.quantity}',
                      ),
                      _DetailRow(
                        label: 'Search Radius',
                        value: '${request.radiusKm.toStringAsFixed(1)} km',
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ── Location card ──────────────────────
                  _SectionCard(
                    icon: Icons.location_on_outlined,
                    title: 'Patient Location',
                    children: [
                      _DetailRow(
                        label: 'Latitude',
                        value: request.patientLat.toStringAsFixed(6),
                      ),
                      _DetailRow(
                        label: 'Longitude',
                        value: request.patientLng.toStringAsFixed(6),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ── Timestamps card ────────────────────
                  _SectionCard(
                    icon: Icons.schedule_outlined,
                    title: 'Timestamps',
                    children: [
                      _DetailRow(
                        label: 'Created',
                        value: _formatDateTime(request.createdAt),
                      ),
                      _DetailRow(
                        label: 'Last Updated',
                        value: _formatDateTime(request.updatedAt),
                      ),
                    ],
                  ),

                  // ── Pharmacy info (if assigned) ────────
                  if (request.pharmacyName != null) ...[
                    const SizedBox(height: 16),
                    _SectionCard(
                      icon: Icons.local_pharmacy_outlined,
                      title: 'Assigned Pharmacy',
                      children: [
                        _DetailRow(label: 'Name', value: request.pharmacyName!),
                        _DetailRow(
                          label: 'Pharmacy ID',
                          value: '#${request.pharmacyId}',
                        ),
                      ],
                    ),
                  ],

                  const SizedBox(height: 28),

                  // ── Action buttons ─────────────────────
                  if (request.status == RequestStatus.pending)
                    _ActionButtons(request: request),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dt) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final h = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final amPm = dt.hour >= 12 ? 'PM' : 'AM';
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year} '
        '${h.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')} $amPm';
  }
}

// ── Prescription image ───────────────────────────────────────────────────────

class _PrescriptionImage extends StatelessWidget {
  final String url;
  const _PrescriptionImage({required this.url});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showFullImage(context),
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxHeight: 260),
        color: Colors.grey.shade100,
        child: Image.network(
          url,
          fit: BoxFit.cover,
          loadingBuilder: (_, child, progress) {
            if (progress == null) return child;
            return SizedBox(
              height: 200,
              child: Center(
                child: CircularProgressIndicator(
                  value: progress.expectedTotalBytes != null
                      ? progress.cumulativeBytesLoaded /
                            progress.expectedTotalBytes!
                      : null,
                  color: AppColors.primary,
                  strokeWidth: 2.5,
                ),
              ),
            );
          },
          errorBuilder: (_, __, ___) => const SizedBox(
            height: 120,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.image_not_supported,
                    size: 40,
                    color: AppColors.textSecondary,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Could not load image',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showFullImage(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: const EdgeInsets.all(12),
        child: Stack(
          children: [
            InteractiveViewer(child: Image.network(url, fit: BoxFit.contain)),
            Positioned(
              top: 8,
              right: 8,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 28),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Status badge ─────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final RequestStatus status;
  const _StatusBadge({required this.status});

  Color get _color {
    switch (status) {
      case RequestStatus.pending:
        return AppColors.accent;
      case RequestStatus.accepted:
        return AppColors.success;
      case RequestStatus.rejected:
        return AppColors.error;
      case RequestStatus.cancelled:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _color.withValues(alpha: 0.3)),
      ),
      child: Text(
        status.toBackend(),
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: _color,
        ),
      ),
    );
  }
}

// ── Section card ─────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final List<Widget> children;

  const _SectionCard({
    required this.icon,
    required this.title,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const Divider(height: 20),
          ...children,
        ],
      ),
    );
  }
}

// ── Detail row ───────────────────────────────────────────────────────────────

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Action buttons ───────────────────────────────────────────────────────────

class _ActionButtons extends StatefulWidget {
  final MedicineRequestModel request;
  const _ActionButtons({required this.request});

  @override
  State<_ActionButtons> createState() => _ActionButtonsState();
}

class _ActionButtonsState extends State<_ActionButtons> {
  bool _loading = false;

  Future<void> _handleAccept() async {
    // Show voice recorder bottom sheet
    final audioFile = await showModalBottomSheet<File?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const VoiceRecorderSheet(),
    );

    if (!mounted) return;
    setState(() => _loading = true);

    final provider = context.read<NotificationProvider>();
    final ok = await provider.acceptRequest(
      widget.request.id,
      audioFile: audioFile,
    );

    if (mounted) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            ok
                ? 'Request #${widget.request.id} accepted!'
                : provider.error ?? 'Failed to accept request',
          ),
          backgroundColor: ok ? AppColors.primary : AppColors.error,
        ),
      );
      if (ok) Navigator.pop(context, true);
    }
  }

  Future<void> _handleReject() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject Request'),
        content: const Text('Are you sure you want to reject this request?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;
    setState(() => _loading = true);

    final provider = context.read<NotificationProvider>();
    final ok = await provider.rejectRequest(widget.request.id);

    if (mounted) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ok ? 'Request rejected' : 'Failed to reject request'),
          backgroundColor: ok ? AppColors.textSecondary : AppColors.error,
        ),
      );
      if (ok) Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _loading ? null : _handleReject,
            icon: const Icon(Icons.close, size: 18),
            label: const Text(
              'Reject',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          flex: 2,
          child: ElevatedButton.icon(
            onPressed: _loading ? null : _handleAccept,
            icon: _loading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2.5,
                    ),
                  )
                : const Icon(Icons.check, size: 18),
            label: Text(
              _loading ? 'Processing…' : 'Accept & Record Voice',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
