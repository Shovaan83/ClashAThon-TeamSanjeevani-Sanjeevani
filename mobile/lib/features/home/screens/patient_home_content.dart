import 'package:flutter/material.dart';
import 'package:sanjeevani/config/storage/storage_service.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/features/home/models/pharmacy_model.dart';
import 'package:sanjeevani/features/home/services/pharmacy_service.dart';

/// Home tab content for **Patient** users.
///
/// Fetches the full pharmacy list from `GET /register-pharmacy/` and
/// displays it below the quick-action row.
class PatientHomeContent extends StatefulWidget {
  const PatientHomeContent({super.key});

  @override
  State<PatientHomeContent> createState() => _PatientHomeContentState();
}

class _PatientHomeContentState extends State<PatientHomeContent> {
  final PharmacyService _pharmacyService = PharmacyService();

  late Future<List<PharmacyModel>> _pharmaciesFuture;
  String _userName = 'Patient';

  @override
  void initState() {
    super.initState();
    _pharmaciesFuture = _pharmacyService.listPharmacies();
    _loadUserName();
  }

  Future<void> _loadUserName() async {
    final name = await StorageService().getUserName();
    if (mounted && name != null && name.isNotEmpty) {
      setState(() => _userName = name);
    }
  }

  void _refresh() {
    setState(() {
      _pharmaciesFuture = _pharmacyService.listPharmacies();
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
                    'Hello, $_userName 👋',
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
                    actions: const [
                      _QuickAction(
                        icon: Icons.search,
                        label: 'Find Pharmacy',
                        color: AppColors.primary,
                      ),
                      _QuickAction(
                        icon: Icons.receipt_long_outlined,
                        label: 'My Orders',
                        color: AppColors.accent,
                      ),
                      _QuickAction(
                        icon: Icons.health_and_safety_outlined,
                        label: 'Health Tips',
                        color: Color(0xFF6366F1),
                      ),
                    ],
                  ),

                  const SizedBox(height: 28),

                  // ── Section header ────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'All Pharmacies',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      FutureBuilder<List<PharmacyModel>>(
                        future: _pharmaciesFuture,
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
                                '${snap.data!.length} found',
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

          // ── Pharmacy list ────────────────────────────────────
          FutureBuilder<List<PharmacyModel>>(
            future: _pharmaciesFuture,
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

              final pharmacies = snapshot.data ?? [];

              // Empty
              if (pharmacies.isEmpty) {
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
                        _PharmacyCard(pharmacy: pharmacies[index]),
                    childCount: pharmacies.length,
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

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
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
    return Container(
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
    );
  }
}

// ── Pharmacy card ────────────────────────────────────────────────────────────

class _PharmacyCard extends StatelessWidget {
  final PharmacyModel pharmacy;

  const _PharmacyCard({required this.pharmacy});

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
      child: Row(
        children: [
          // ── Avatar ──────────────────────────────────────
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.local_pharmacy, color: AppColors.primary),
          ),
          const SizedBox(width: 14),

          // ── Details ─────────────────────────────────────
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pharmacy.user.name.isNotEmpty
                      ? pharmacy.user.name
                      : 'Unknown Pharmacy',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 13,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      '${pharmacy.lat.toStringAsFixed(4)}, ${pharmacy.lng.toStringAsFixed(4)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                if (pharmacy.user.phoneNumber.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      const Icon(
                        Icons.phone_outlined,
                        size: 13,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        pharmacy.user.phoneNumber,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          // ── Status badge ─────────────────────────────────
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Open',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              const Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
        ],
      ),
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
          Icons.local_pharmacy_outlined,
          size: 64,
          color: AppColors.textSecondary.withValues(alpha: 0.5),
        ),
        const SizedBox(height: 16),
        Text(
          'No pharmacies found',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 8),
        Text(
          'Pull down to refresh.',
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
          'Could not load pharmacies',
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
