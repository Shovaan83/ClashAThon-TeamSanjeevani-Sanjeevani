import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/features/daily_rem/models/alarm_model.dart';
import 'package:sanjeevani/features/daily_rem/models/dashboard_model.dart';
import 'package:sanjeevani/features/daily_rem/models/medicine_model.dart';
import 'package:sanjeevani/features/daily_rem/models/occurrence_model.dart';
import 'package:sanjeevani/features/daily_rem/screens/add_alarm_screen.dart';
import 'package:sanjeevani/features/daily_rem/services/daily_reminder_service.dart';

/// Main Daily Reminders screen.
///
/// Shows a dashboard summary, today's upcoming occurrences (with
/// take / skip actions), and the list of all alarms with CRUD options.
class DailyRemindersScreen extends StatefulWidget {
  const DailyRemindersScreen({super.key});

  @override
  State<DailyRemindersScreen> createState() => _DailyRemindersScreenState();
}

class _DailyRemindersScreenState extends State<DailyRemindersScreen>
    with SingleTickerProviderStateMixin {
  final DailyReminderService _service = DailyReminderService();
  late TabController _tabController;

  bool _isLoading = true;
  String? _error;

  ReminderDashboard? _dashboard;
  List<ReminderAlarm> _alarms = [];
  List<AlarmOccurrence> _todayOccurrences = [];
  List<ReminderMedicine> _medicines = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAll();
    // Trigger backend to send any pending push notifications now.
    _service.syncNotifications();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        _service.getDashboard(),
        _service.getAlarms(),
        _service.getOccurrences(),
        _service.getMedicines(),
      ]);
      if (!mounted) return;
      setState(() {
        _dashboard = results[0] as ReminderDashboard;
        _alarms = results[1] as List<ReminderAlarm>;
        _todayOccurrences = results[2] as List<AlarmOccurrence>;
        _medicines = results[3] as List<ReminderMedicine>;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  Future<void> _markOccurrence(int id, String status) async {
    try {
      await _service.updateOccurrence(id, status: status);
      await _loadAll();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Failed: ${e.toString().replaceAll('Exception: ', '')}',
          ),
        ),
      );
    }
  }

  Future<void> _deleteAlarm(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Deactivate Alarm'),
        content: const Text('This alarm will be deactivated. Continue?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Deactivate'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _service.deleteAlarm(id);
      await _loadAll();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Failed: ${e.toString().replaceAll('Exception: ', '')}',
          ),
        ),
      );
    }
  }

  Future<void> _addMedicine() async {
    final name = await _showTextDialog('Add Medicine', 'Medicine name');
    if (name == null || name.trim().isEmpty) return;
    try {
      await _service.createMedicine(name.trim());
      await _loadAll();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Failed: ${e.toString().replaceAll('Exception: ', '')}',
          ),
        ),
      );
    }
  }

  Future<void> _deleteMedicine(ReminderMedicine med) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Medicine'),
        content: Text(
          'Delete "${med.name}"? All related alarms will also be removed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Delete',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _service.deleteMedicine(med.id);
      await _loadAll();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Failed: ${e.toString().replaceAll('Exception: ', '')}',
          ),
        ),
      );
    }
  }

  Future<String?> _showTextDialog(String title, String hint) {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(hintText: hint),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, controller.text),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _openAddAlarm() async {
    final created = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => AddAlarmScreen(medicines: _medicines)),
    );
    if (created == true) _loadAll();
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Daily Reminders'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Dashboard'),
            Tab(text: 'Today'),
            Tab(text: 'Alarms'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _buildError()
          : TabBarView(
              controller: _tabController,
              children: [
                _buildDashboardTab(),
                _buildTodayTab(),
                _buildAlarmsTab(),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: _openAddAlarm,
        child: const Icon(Icons.add_alarm),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: AppColors.error.withValues(alpha: 0.6),
            ),
            const SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _loadAll,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  // ── Dashboard Tab ──────────────────────────────────────────────────────────

  Widget _buildDashboardTab() {
    final d = _dashboard;
    if (d == null) return const Center(child: Text('No data'));

    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Stats grid
          _StatsGrid(dashboard: d),
          const SizedBox(height: 20),

          // Adherence
          _AdherenceCard(rate: d.adherenceRate, streak: d.currentStreak),
          const SizedBox(height: 20),

          // Upcoming occurrences
          if (d.upcomingOccurrences.isNotEmpty) ...[
            Text(
              'Upcoming',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ...d.upcomingOccurrences.map(
              (o) => _OccurrenceCard(
                occurrence: o,
                onTake: () => _markOccurrence(o.id, 'taken'),
                onSkip: () => _markOccurrence(o.id, 'skipped'),
              ),
            ),
          ],

          // Medicines list
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Text(
                  'My Medicines',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(
                  Icons.add_circle_outline,
                  color: AppColors.primary,
                ),
                onPressed: _addMedicine,
                tooltip: 'Add Medicine',
              ),
            ],
          ),
          const SizedBox(height: 4),
          if (_medicines.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'No medicines yet. Tap + to add one.',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            )
          else
            ..._medicines.map(
              (m) => ListTile(
                dense: true,
                leading: const Icon(Icons.medication, color: AppColors.primary),
                title: Text(m.name),
                trailing: IconButton(
                  icon: const Icon(
                    Icons.delete_outline,
                    color: AppColors.error,
                    size: 20,
                  ),
                  onPressed: () => _deleteMedicine(m),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ── Today Tab ──────────────────────────────────────────────────────────────

  Widget _buildTodayTab() {
    if (_todayOccurrences.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadAll,
        child: ListView(
          children: const [
            SizedBox(height: 80),
            Center(
              child: Column(
                children: [
                  Icon(
                    Icons.event_available,
                    size: 56,
                    color: AppColors.textSecondary,
                  ),
                  SizedBox(height: 12),
                  Text(
                    'No reminders for today',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _todayOccurrences.length,
        itemBuilder: (context, i) {
          final o = _todayOccurrences[i];
          return _OccurrenceCard(
            occurrence: o,
            onTake: o.status == OccurrenceStatus.scheduled
                ? () => _markOccurrence(o.id, 'taken')
                : null,
            onSkip: o.status == OccurrenceStatus.scheduled
                ? () => _markOccurrence(o.id, 'skipped')
                : null,
          );
        },
      ),
    );
  }

  // ── Alarms Tab ─────────────────────────────────────────────────────────────

  Widget _buildAlarmsTab() {
    if (_alarms.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadAll,
        child: ListView(
          children: const [
            SizedBox(height: 80),
            Center(
              child: Column(
                children: [
                  Icon(
                    Icons.alarm_off,
                    size: 56,
                    color: AppColors.textSecondary,
                  ),
                  SizedBox(height: 12),
                  Text(
                    'No alarms yet',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Tap + to create one',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _alarms.length,
        itemBuilder: (context, i) {
          final alarm = _alarms[i];
          return _AlarmCard(
            alarm: alarm,
            onDelete: () => _deleteAlarm(alarm.id),
            onEdit: () async {
              final edited = await Navigator.push<bool>(
                context,
                MaterialPageRoute(
                  builder: (_) => AddAlarmScreen(
                    medicines: _medicines,
                    existingAlarm: alarm,
                  ),
                ),
              );
              if (edited == true) _loadAll();
            },
          );
        },
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Private sub-widgets
// ═════════════════════════════════════════════════════════════════════════════

/// 2x2 stats grid showing counts.
class _StatsGrid extends StatelessWidget {
  final ReminderDashboard dashboard;
  const _StatsGrid({required this.dashboard});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.2,
      children: [
        _StatTile(
          icon: Icons.medication,
          label: 'Medicines',
          value: '${dashboard.totalMedicines}',
          color: AppColors.primary,
        ),
        _StatTile(
          icon: Icons.alarm,
          label: 'Active Alarms',
          value: '${dashboard.activeAlarms}',
          color: Colors.orange,
        ),
        _StatTile(
          icon: Icons.check_circle,
          label: 'Taken Today',
          value: '${dashboard.todayTaken}/${dashboard.todayScheduled}',
          color: AppColors.success,
        ),
        _StatTile(
          icon: Icons.pending_actions,
          label: 'Pending Today',
          value: '${dashboard.todayPending}',
          color: Colors.blue,
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Adherence rate + streak card.
class _AdherenceCard extends StatelessWidget {
  final double rate;
  final int streak;
  const _AdherenceCard({required this.rate, required this.streak});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primaryLight],
        ),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Adherence Rate',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  '${rate.toStringAsFixed(1)}%',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.local_fire_department,
                  color: Colors.orangeAccent,
                  size: 20,
                ),
                const SizedBox(width: 4),
                Text(
                  '$streak day streak',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Card for a single occurrence with take/skip actions.
class _OccurrenceCard extends StatelessWidget {
  final AlarmOccurrence occurrence;
  final VoidCallback? onTake;
  final VoidCallback? onSkip;
  const _OccurrenceCard({required this.occurrence, this.onTake, this.onSkip});

  Color _statusColor() {
    switch (occurrence.status) {
      case OccurrenceStatus.taken:
        return AppColors.success;
      case OccurrenceStatus.missed:
        return AppColors.error;
      case OccurrenceStatus.skipped:
        return Colors.orange;
      case OccurrenceStatus.scheduled:
        return Colors.blue;
    }
  }

  IconData _statusIcon() {
    switch (occurrence.status) {
      case OccurrenceStatus.taken:
        return Icons.check_circle;
      case OccurrenceStatus.missed:
        return Icons.cancel;
      case OccurrenceStatus.skipped:
        return Icons.skip_next;
      case OccurrenceStatus.scheduled:
        return Icons.schedule;
    }
  }

  @override
  Widget build(BuildContext context) {
    final time = DateFormat.jm().format(occurrence.scheduledAt.toLocal());
    final color = _statusColor();

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(_statusIcon(), color: color, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    occurrence.medicineName ?? 'Medicine',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$time  ·  ${occurrence.status.name.toUpperCase()}',
                    style: TextStyle(fontSize: 12, color: color),
                  ),
                ],
              ),
            ),
            if (occurrence.status == OccurrenceStatus.scheduled) ...[
              IconButton(
                icon: const Icon(
                  Icons.check_circle_outline,
                  color: AppColors.success,
                ),
                tooltip: 'Mark as Taken',
                onPressed: onTake,
              ),
              IconButton(
                icon: const Icon(
                  Icons.skip_next_outlined,
                  color: Colors.orange,
                ),
                tooltip: 'Skip',
                onPressed: onSkip,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Card for a single alarm with edit/delete.
class _AlarmCard extends StatelessWidget {
  final ReminderAlarm alarm;
  final VoidCallback onDelete;
  final VoidCallback onEdit;
  const _AlarmCard({
    required this.alarm,
    required this.onDelete,
    required this.onEdit,
  });

  String _frequencyText() {
    if (alarm.customWeekdays != null && alarm.customWeekdays!.isNotEmpty) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return alarm.customWeekdays!.map((d) => days[d]).join(', ');
    }
    if (alarm.intervalDays == 1) return 'Daily';
    if (alarm.intervalDays == 7) return 'Weekly';
    return 'Every ${alarm.intervalDays} days';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.medication_outlined,
                  color: alarm.isActive
                      ? AppColors.primary
                      : AppColors.textSecondary,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    alarm.medicineName ?? 'Medicine #${alarm.medicineId}',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: alarm.isActive
                          ? AppColors.textPrimary
                          : AppColors.textSecondary,
                    ),
                  ),
                ),
                if (!alarm.isActive)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'Inactive',
                      style: TextStyle(fontSize: 10, color: AppColors.error),
                    ),
                  ),
                PopupMenuButton<String>(
                  onSelected: (v) {
                    if (v == 'edit') onEdit();
                    if (v == 'delete') onDelete();
                  },
                  itemBuilder: (_) => [
                    const PopupMenuItem(value: 'edit', child: Text('Edit')),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Text('Deactivate'),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                _InfoChip(
                  icon: Icons.access_time,
                  text: alarm.startTime.substring(0, 5),
                ),
                const SizedBox(width: 8),
                _InfoChip(icon: Icons.repeat, text: _frequencyText()),
                const SizedBox(width: 8),
                _InfoChip(
                  icon: Icons.medication_liquid,
                  text: '${alarm.timesPerDay}x/day',
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${alarm.startDate}${alarm.endDate != null ? ' → ${alarm.endDate}' : ' → ongoing'}',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: AppColors.primary),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(fontSize: 11, color: AppColors.primary),
          ),
        ],
      ),
    );
  }
}
