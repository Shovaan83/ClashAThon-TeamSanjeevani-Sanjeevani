import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sanjeevani/config/storage/storage_service.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/core/providers/notification_provider.dart';
import 'package:sanjeevani/features/daily_rem/services/daily_reminder_service.dart';
import 'package:sanjeevani/features/home/broadcast/models/medicine_request_model.dart';
import 'package:sanjeevani/features/home/broadcast/models/pharmacy_response_model.dart';
import 'package:sanjeevani/features/home/broadcast/screens/pharmacy_offers_screen.dart';
import 'package:sanjeevani/features/home/services/customer_service.dart';
import 'package:sanjeevani/shared/utils/time_utils.dart';
import 'package:sanjeevani/shared/utils/url_helper.dart';
import 'package:sanjeevani/shared/widgets/audio_player_sheet.dart';

/// Home tab content for **Patient** users.
///
/// Fetches the patient's own medicine broadcasts from `GET /customer/requests/`
/// and displays them below the quick-action row.
class PatientHomeContent extends StatefulWidget {
  /// Callback to switch the bottom-nav tab (used by "Find Pharmacy" card).
  final ValueChanged<int>? onSwitchTab;

  const PatientHomeContent({super.key, this.onSwitchTab});

  @override
  State<PatientHomeContent> createState() => _PatientHomeContentState();
}

class _PatientHomeContentState extends State<PatientHomeContent> {
  final CustomerService _customerService = CustomerService();
  final DailyReminderService _reminderService = DailyReminderService();

  late Future<List<MedicineRequestModel>> _broadcastsFuture;
  String _userName = 'Patient';

  @override
  void initState() {
    super.initState();
    _broadcastsFuture = _customerService.getMyRequests();
    _loadUserName();
    // Ask backend to fire any pending medication reminders now.
    _reminderService.syncNotifications();
  }

  Future<void> _loadUserName() async {
    final name = await StorageService().getUserName();
    if (mounted && name != null && name.isNotEmpty) {
      setState(() => _userName = name);
    }
  }

  void _refresh() {
    setState(() {
      _broadcastsFuture = _customerService.getMyRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async => _refresh(),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Greeting ────────────────────────────────
                  Text(
                    'Hello, $_userName',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'How are you feeling today?',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Quick-action cards ────────────────────────
                  _QuickActionRow(
                    actions: [
                      _QuickAction(
                        icon: Icons.search,
                        label: 'Find Pharmacy',
                        color: AppColors.primary,
                        onTap: () => widget.onSwitchTab?.call(1),
                      ),
                      _QuickAction(
                        icon: Icons.broadcast_on_personal_outlined,
                        label: 'My Broadcasts',
                        color: AppColors.accent,
                        onTap: () {}, // Already on this page
                      ),
                      _QuickAction(
                        icon: Icons.health_and_safety_outlined,
                        label: 'Health Tips',
                        color: const Color(0xFF6366F1),
                        onTap: () =>
                            Navigator.pushNamed(context, AppRoutes.chatbot),
                      ),
                    ],
                  ),

                  const SizedBox(height: 28),

                  // ── Section header ────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'My Broadcasts',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      FutureBuilder<List<MedicineRequestModel>>(
                        future: _broadcastsFuture,
                        builder: (_, snap) {
                          if (snap.hasData) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '${snap.data!.length} total',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.primary,
                                ),
                              ),
                            );
                          }
                          return const SizedBox.shrink();
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // ── Broadcasts list ────────────────────────────────────
          FutureBuilder<List<MedicineRequestModel>>(
            future: _broadcastsFuture,
            builder: (context, snapshot) {
              // Loading
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(top: 48),
                    child: Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                        strokeWidth: 2.5,
                      ),
                    ),
                  ),
                );
              }

              // Error
              if (snapshot.hasError) {
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 40,
                    ),
                    child: _ErrorState(
                      message: snapshot.error.toString(),
                      onRetry: _refresh,
                    ),
                  ),
                );
              }

              final broadcasts = snapshot.data ?? [];

              // Empty
              if (broadcasts.isEmpty) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 40),
                    child: _EmptyState(),
                  ),
                );
              }

              // List
              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) =>
                        _BroadcastCard(broadcast: broadcasts[index]),
                    childCount: broadcasts.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ── Quick-action helpers ────────────────────────────────────────────────────

class _QuickAction {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });
}

class _QuickActionRow extends StatelessWidget {
  final List<_QuickAction> actions;

  const _QuickActionRow({required this.actions});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: actions.map((a) {
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: a == actions.last ? 0 : 12),
            child: _QuickActionCard(action: a),
          ),
        );
      }).toList(),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final _QuickAction action;

  const _QuickActionCard({required this.action});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: action.onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: action.color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Icon(action.icon, color: action.color, size: 28),
            const SizedBox(height: 8),
            Text(
              action.label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: action.color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Broadcast card ───────────────────────────────────────────────────────────

class _BroadcastCard extends StatelessWidget {
  final MedicineRequestModel broadcast;

  const _BroadcastCard({required this.broadcast});

  Color get _statusColor {
    switch (broadcast.status) {
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

  IconData get _statusIcon {
    switch (broadcast.status) {
      case RequestStatus.pending:
        return Icons.hourglass_top_rounded;
      case RequestStatus.accepted:
        return Icons.check_circle_outline;
      case RequestStatus.rejected:
        return Icons.cancel_outlined;
      case RequestStatus.cancelled:
        return Icons.block_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
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
              // ── Prescription thumbnail ──────────────────
              if (broadcast.imageUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(
                    broadcast.imageUrl,
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.image_outlined,
                        color: AppColors.primary,
                        size: 24,
                      ),
                    ),
                  ),
                )
              else
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.medical_services_outlined,
                    color: AppColors.primary,
                    size: 24,
                  ),
                ),
              const SizedBox(width: 14),

              // ── Details ─────────────────────────────────
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Broadcast #${broadcast.id}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Qty: ${broadcast.quantity}  •  Radius: ${broadcast.radiusKm.toStringAsFixed(1)} km',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    if (broadcast.pharmacyName != null) ...[
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          const Icon(
                            Icons.local_pharmacy,
                            size: 13,
                            color: AppColors.success,
                          ),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              broadcast.pharmacyName!,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.success,
                                fontWeight: FontWeight.w500,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              // ── Status badge + time ─────────────────────
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: _statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_statusIcon, size: 12, color: _statusColor),
                        const SizedBox(width: 4),
                        Text(
                          broadcast.status.toBackend(),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _statusColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    relativeTime(broadcast.createdAt),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),

          // ── Pharmacy offers / audio section ────────────
          if (broadcast.status == RequestStatus.pending ||
              broadcast.status == RequestStatus.accepted)
            _PharmacyResponseSection(broadcast: broadcast),
        ],
      ),
    );
  }
}

/// Shows pharmacy responses / offers for a broadcast.
///
/// For **PENDING** requests: fetches offers from REST API and shows a button
/// to view all offers + select a pharmacy.
///
/// For **ACCEPTED** requests: shows the accepted pharmacy's audio message
/// loaded from the REST API (or cached / WebSocket).
class _PharmacyResponseSection extends StatefulWidget {
  final MedicineRequestModel broadcast;
  const _PharmacyResponseSection({required this.broadcast});

  @override
  State<_PharmacyResponseSection> createState() =>
      _PharmacyResponseSectionState();
}

class _PharmacyResponseSectionState extends State<_PharmacyResponseSection> {
  List<PharmacyResponseModel>? _responses;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadResponses();
  }

  Future<void> _loadResponses() async {
    final provider = Provider.of<NotificationProvider>(context, listen: false);
    try {
      final responses = await provider.fetchResponsesForRequest(
        widget.broadcast.id,
      );
      if (mounted) {
        setState(() {
          _responses = responses;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.only(top: 8),
        child: SizedBox(
          height: 20,
          width: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppColors.primary,
          ),
        ),
      );
    }

    final accepted = (_responses ?? [])
        .where((r) => r.responseType == PharmacyResponseType.accepted)
        .toList();

    // ── PENDING: show "View Offers" button ──────────
    if (widget.broadcast.status == RequestStatus.pending) {
      if (accepted.isEmpty) {
        return Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.hourglass_top_rounded,
                size: 16,
                color: AppColors.textSecondary.withValues(alpha: 0.6),
              ),
              const SizedBox(width: 4),
              Text(
                'Waiting for pharmacy offers…',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary.withValues(alpha: 0.6),
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        );
      }

      return Padding(
        padding: const EdgeInsets.only(top: 10),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () async {
              final nav = Navigator.of(context);
              final parentState = context
                  .findAncestorStateOfType<_PatientHomeContentState>();
              final result = await nav.push<bool>(
                MaterialPageRoute(
                  builder: (_) =>
                      PharmacyOffersScreen(requestId: widget.broadcast.id),
                ),
              );
              if (result == true && mounted) {
                // Pharmacy was selected — tell parent to refresh
                parentState?._refresh();
              }
            },
            icon: const Icon(Icons.local_pharmacy_outlined, size: 18),
            label: Text(
              'View ${accepted.length} Offer${accepted.length == 1 ? '' : 's'}',
            ),
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
      );
    }

    // ── ACCEPTED: show the selected pharmacy's audio ──────────
    // Find audio from REST responses first
    String? audioUrl;
    for (final r in accepted) {
      if (r.audioUrl != null && r.audioUrl!.isNotEmpty) {
        audioUrl = r.audioUrl;
        break;
      }
    }

    // Fall back to WebSocket / persisted audio
    if (audioUrl == null) {
      return _AudioFallback(requestId: widget.broadcast.id);
    }

    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: GestureDetector(
        onTap: () => AudioPlayerSheet.show(
          context,
          url: audioUrl!,
          title: 'Pharmacy Voice Message',
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.play_circle_outline,
                color: AppColors.primary,
                size: 20,
              ),
              SizedBox(width: 6),
              Text(
                'Play Voice Message',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Fallback audio lookup from WebSocket notifications + SharedPreferences
/// when the REST API didn't return an audio URL.
class _AudioFallback extends StatefulWidget {
  final int requestId;
  const _AudioFallback({required this.requestId});

  @override
  State<_AudioFallback> createState() => _AudioFallbackState();
}

class _AudioFallbackState extends State<_AudioFallback> {
  String? _persistedUrl;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPersistedUrl();
  }

  Future<void> _loadPersistedUrl() async {
    final raw = await StorageService().getAudioUrl(widget.requestId);
    if (mounted) {
      setState(() {
        _persistedUrl = raw != null ? UrlHelper.resolveMediaUrl(raw) : null;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<NotificationProvider>(
      builder: (context, provider, _) {
        // 1) Check in-memory notifications.
        String? audioUrl;
        for (final n in provider.notifications) {
          if (n.type == 'pharmacy_response') {
            final nReqId = n.payload['request_id'];
            if (nReqId != null &&
                nReqId.toString() == widget.requestId.toString()) {
              final raw = n.payload['audio_url'] as String?;
              audioUrl = UrlHelper.resolveMediaUrl(raw);
              if (raw != null && raw.isNotEmpty) {
                StorageService().saveAudioUrl(widget.requestId, raw);
              }
              break;
            }
          }
        }

        // 2) Fall back to persisted audio URL.
        audioUrl ??= _persistedUrl;

        if (_loading) return const SizedBox.shrink();

        if (audioUrl == null) {
          return Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.mic_none,
                  size: 16,
                  color: AppColors.textSecondary.withValues(alpha: 0.6),
                ),
                const SizedBox(width: 4),
                Text(
                  'Voice message will appear here',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary.withValues(alpha: 0.6),
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.only(top: 10),
          child: GestureDetector(
            onTap: () => AudioPlayerSheet.show(
              context,
              url: audioUrl!,
              title: 'Pharmacy Voice Message',
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.play_circle_outline,
                    color: AppColors.primary,
                    size: 20,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'Play Voice Message',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// ── Empty / Error states ─────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(
          Icons.broadcast_on_personal_outlined,
          size: 64,
          color: AppColors.textSecondary.withValues(alpha: 0.5),
        ),
        const SizedBox(height: 16),
        Text(
          'No broadcasts yet',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 8),
        Text(
          'Create a broadcast to find nearby pharmacies.',
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
          'Could not load broadcasts',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(color: AppColors.textPrimary),
        ),
        const SizedBox(height: 6),
        Text(
          message.replaceAll('Exception: ', ''),
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
