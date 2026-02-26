import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sanjeevani/config/storage/storage_service.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/providers/notification_provider.dart';
import 'package:sanjeevani/features/home/broadcast/models/medicine_request_model.dart';
import 'package:sanjeevani/features/home/screens/request_detail_screen.dart';
import 'package:sanjeevani/features/home/services/pharmacy_profile_service.dart';
import 'package:sanjeevani/shared/utils/time_utils.dart';
import 'package:sanjeevani/shared/widgets/voice_recorder_sheet.dart';

/// Home tab content for **Pharmacy** users.
///
/// Fetches nearby pending medicine requests from `GET /medicine/request/`
/// and lets the pharmacy accept / reject each request.
class PharmacyHomeContent extends StatefulWidget {
  const PharmacyHomeContent({super.key});

  @override
  State<PharmacyHomeContent> createState() => _PharmacyHomeContentState();
}

class _PharmacyHomeContentState extends State<PharmacyHomeContent> {
  String _pharmacyName = 'Pharmacy';
  String? _documentStatus; // PENDING, APPROVED, REJECTED

  @override
  void initState() {
    super.initState();
    _loadPharmacyName();
    _loadDocumentStatus();

    // Initialise the provider (WebSocket + fetch requests) after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().init();
    });
  }

  Future<void> _loadPharmacyName() async {
    final name = await StorageService().getUserName();
    if (mounted && name != null && name.isNotEmpty) {
      setState(() => _pharmacyName = name);
    }
  }

  Future<void> _loadDocumentStatus() async {
    try {
      final data = await PharmacyProfileService().getProfile();
      if (mounted && data is Map<String, dynamic>) {
        setState(() {
          _documentStatus = data['document_status'] as String?;
        });
      }
    } catch (_) {
      // Silently ignore — status banner simply won't show
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<NotificationProvider>(
      builder: (context, provider, _) {
        final requests = provider.requests;
        final pendingRequests = requests
            .where((r) => r.status == RequestStatus.pending)
            .toList();

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => provider.fetchRequests(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Greeting ──────────────────────────
                      Text(
                        'Hello, $_pharmacyName',
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Manage incoming medicine requests.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),

                      const SizedBox(height: 20),

                      // ── Verification status banner ────────
                      if (_documentStatus != null &&
                          _documentStatus != 'APPROVED')
                        Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: _documentStatus == 'REJECTED'
                                ? AppColors.error.withValues(alpha: 0.08)
                                : AppColors.accent.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _documentStatus == 'REJECTED'
                                  ? AppColors.error.withValues(alpha: 0.3)
                                  : AppColors.accent.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                _documentStatus == 'REJECTED'
                                    ? Icons.cancel_outlined
                                    : Icons.hourglass_top_rounded,
                                color: _documentStatus == 'REJECTED'
                                    ? AppColors.error
                                    : AppColors.accent,
                                size: 22,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _documentStatus == 'REJECTED'
                                          ? 'Document Rejected'
                                          : 'Pending - Not Verified',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                        color: _documentStatus == 'REJECTED'
                                            ? AppColors.error
                                            : AppColors.accent,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _documentStatus == 'REJECTED'
                                          ? 'Your pharmacy document was rejected. Please upload a valid document.'
                                          : 'Your pharmacy is awaiting admin verification. Some features may be limited.',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                      // ── Connection status ─────────────────
                      _ConnectionStatusChip(connected: provider.isConnected),

                      const SizedBox(height: 20),

                      // ── Stats row ─────────────────────────
                      Row(
                        children: [
                          _StatCard(
                            label: 'Pending',
                            value: '${pendingRequests.length}',
                            icon: Icons.pending_actions,
                            color: AppColors.accent,
                          ),
                          const SizedBox(width: 12),
                          _StatCard(
                            label: 'Total Requests',
                            value: '${requests.length}',
                            icon: Icons.receipt_long,
                            color: AppColors.primary,
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      Row(
                        children: [
                          _StatCard(
                            label: 'Notifications',
                            value: '${provider.unreadCount}',
                            icon: Icons.notifications_active,
                            color: const Color(0xFF6366F1),
                          ),
                          const SizedBox(width: 12),
                          _StatCard(
                            label: 'Status',
                            value: provider.isConnected ? 'Online' : 'Offline',
                            icon: provider.isConnected
                                ? Icons.wifi
                                : Icons.wifi_off,
                            color: provider.isConnected
                                ? AppColors.success
                                : AppColors.error,
                          ),
                        ],
                      ),

                      const SizedBox(height: 28),

                      // ── Section header ────────────────────
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Pending Requests',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          if (pendingRequests.length > 1)
                            _AcceptAllButton(
                              onPressed: () => _handleAcceptAll(context),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              ),

              // ── Requests list ─────────────────────────────
              if (provider.isLoading)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(top: 48),
                    child: Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                        strokeWidth: 2.5,
                      ),
                    ),
                  ),
                )
              else if (provider.error != null && requests.isEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 40,
                    ),
                    child: _ErrorState(
                      message: provider.error!,
                      onRetry: () => provider.fetchRequests(),
                    ),
                  ),
                )
              else if (pendingRequests.isEmpty)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 40),
                    child: _EmptyState(),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _MedicineRequestCard(
                        request: pendingRequests[index],
                        onAccept: () =>
                            _handleAccept(context, pendingRequests[index]),
                        onReject: () =>
                            _handleReject(context, pendingRequests[index]),
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => RequestDetailScreen(
                              request: pendingRequests[index],
                            ),
                          ),
                        ),
                      ),
                      childCount: pendingRequests.length,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  void _handleAccept(BuildContext context, MedicineRequestModel request) async {
    final provider = context.read<NotificationProvider>();
    final messenger = ScaffoldMessenger.of(context);

    // Show option to attach a voice message
    final audioFile = await showModalBottomSheet<File?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const VoiceRecorderSheet(),
    );

    // null means user dismissed/cancelled — still accept without audio
    final ok = await provider.acceptRequest(request.id, audioFile: audioFile);
    if (mounted) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            ok
                ? 'Request #${request.id} accepted!'
                : 'Failed to accept request',
          ),
          backgroundColor: ok ? AppColors.primary : AppColors.error,
        ),
      );
    }
  }

  void _handleReject(BuildContext context, MedicineRequestModel request) async {
    final provider = context.read<NotificationProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final ok = await provider.rejectRequest(request.id);
    if (mounted) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            ok ? 'Request #${request.id} rejected' : 'Failed to reject request',
          ),
          backgroundColor: ok ? AppColors.textSecondary : AppColors.error,
        ),
      );
    }
  }

  void _handleAcceptAll(BuildContext context) async {
    final provider = context.read<NotificationProvider>();
    final messenger = ScaffoldMessenger.of(context);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Accept All Requests'),
        content: const Text(
          'Are you sure you want to accept all pending requests?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Accept All'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final count = await provider.acceptAllRequests();
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Accepted $count request(s)'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    }
  }
}

// ── Connection status chip ───────────────────────────────────────────────────

class _ConnectionStatusChip extends StatelessWidget {
  final bool connected;

  const _ConnectionStatusChip({required this.connected});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: connected
            ? AppColors.success.withValues(alpha: 0.1)
            : AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: connected
              ? AppColors.success.withValues(alpha: 0.3)
              : AppColors.error.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: connected ? AppColors.success : AppColors.error,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            connected ? 'Live — Receiving broadcasts' : 'Disconnected',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: connected ? AppColors.success : AppColors.error,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Stat card ────────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 10),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Accept All button ────────────────────────────────────────────────────────

class _AcceptAllButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _AcceptAllButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: onPressed,
      icon: const Icon(Icons.done_all, size: 16),
      label: const Text(
        'Accept All',
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        backgroundColor: AppColors.primary.withValues(alpha: 0.08),
      ),
    );
  }
}

// ── Medicine request card ────────────────────────────────────────────────────

class _MedicineRequestCard extends StatelessWidget {
  final MedicineRequestModel request;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  final VoidCallback? onTap;

  const _MedicineRequestCard({
    required this.request,
    required this.onAccept,
    required this.onReject,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            // ── Top section ──────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avatar
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.accent.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.person,
                      color: AppColors.accent,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                              child: Text(
                                request.patientName ??
                                    'Patient #${request.patientId}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.accent.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                request.status.toBackend(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.accent,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        // Info chips
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            _InfoChip(
                              icon: Icons.medical_services_outlined,
                              label: 'Qty: ${request.quantity}',
                            ),
                            _InfoChip(
                              icon: Icons.radar,
                              label:
                                  '${request.radiusKm.toStringAsFixed(1)} km',
                            ),
                            _InfoChip(
                              icon: Icons.access_time,
                              label: timeAgo(request.createdAt),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── Prescription image preview ────────────────
            if (request.imageUrl.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(
                    request.imageUrl,
                    height: 120,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 60,
                      decoration: BoxDecoration(
                        color: AppColors.border.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.image_not_supported,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ),
              ),

            // ── Location info ───────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
              child: Row(
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${request.patientLat.toStringAsFixed(4)}, ${request.patientLng.toStringAsFixed(4)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),

            // ── Action buttons ────────────────────────────
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onReject,
                      icon: const Icon(Icons.close, size: 16),
                      label: const Text('Reject'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: onAccept,
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Accept'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Info chip ────────────────────────────────────────────────────────────────

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.backgroundLight,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.textSecondary),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Empty & Error states ─────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(
          Icons.inbox_outlined,
          size: 64,
          color: AppColors.textSecondary.withValues(alpha: 0.5),
        ),
        const SizedBox(height: 16),
        Text(
          'No pending requests',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 8),
        Text(
          'New medicine requests from nearby patients will appear here.',
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(
          Icons.wifi_off_outlined,
          size: 56,
          color: AppColors.error.withValues(alpha: 0.6),
        ),
        const SizedBox(height: 16),
        Text(
          'Could not load requests',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(color: AppColors.textPrimary),
        ),
        const SizedBox(height: 6),
        Text(
          message,
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh, size: 18),
          label: const Text('Retry'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            side: const BorderSide(color: AppColors.primary),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
      ],
    );
  }
}
