import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/features/daily_rem/models/alarm_model.dart';
import 'package:sanjeevani/features/daily_rem/models/medicine_model.dart';
import 'package:sanjeevani/features/daily_rem/services/daily_reminder_service.dart';

/// Screen to create or edit an alarm.
///
/// If [existingAlarm] is provided, operates in edit mode.
class AddAlarmScreen extends StatefulWidget {
  final List<ReminderMedicine> medicines;
  final ReminderAlarm? existingAlarm;

  const AddAlarmScreen({
    super.key,
    required this.medicines,
    this.existingAlarm,
  });

  @override
  State<AddAlarmScreen> createState() => _AddAlarmScreenState();
}

class _AddAlarmScreenState extends State<AddAlarmScreen> {
  final DailyReminderService _service = DailyReminderService();
  final _formKey = GlobalKey<FormState>();

  bool _isSaving = false;
  bool get _isEdit => widget.existingAlarm != null;

  // Form values
  int? _selectedMedicineId;
  DateTime _startDate = DateTime.now();
  DateTime? _endDate;
  TimeOfDay _startTime = const TimeOfDay(hour: 8, minute: 0);
  TimeOfDay? _endTime;
  int _timesPerDay = 1;
  int _intervalDays = 1;
  List<int> _selectedWeekdays = [];
  bool _useCustomWeekdays = false;

  static const _weekdayNames = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ];

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      final a = widget.existingAlarm!;
      _selectedMedicineId = a.medicineId;
      _startDate = DateTime.tryParse(a.startDate) ?? DateTime.now();
      _endDate = a.endDate != null ? DateTime.tryParse(a.endDate!) : null;
      _startTime = _parseTime(a.startTime);
      _endTime = a.endTime != null ? _parseTime(a.endTime!) : null;
      _timesPerDay = a.timesPerDay;
      _intervalDays = a.intervalDays;
      if (a.customWeekdays != null && a.customWeekdays!.isNotEmpty) {
        _useCustomWeekdays = true;
        _selectedWeekdays = List.from(a.customWeekdays!);
      }
    } else if (widget.medicines.isNotEmpty) {
      _selectedMedicineId = widget.medicines.first.id;
    }
  }

  TimeOfDay _parseTime(String t) {
    final parts = t.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}:00';

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedMedicineId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a medicine first')),
      );
      return;
    }

    setState(() => _isSaving = true);

    final body = <String, dynamic>{
      'medicine': _selectedMedicineId,
      'start_date': DateFormat('yyyy-MM-dd').format(_startDate),
      'start_time': _formatTime(_startTime),
      'times_per_day': _timesPerDay,
      'interval_days': _intervalDays,
      'timezone': 'Asia/Kathmandu',
      'is_active': true,
    };
    if (_endDate != null)
      body['end_date'] = DateFormat('yyyy-MM-dd').format(_endDate!);
    if (_endTime != null) body['end_time'] = _formatTime(_endTime!);
    if (_useCustomWeekdays && _selectedWeekdays.isNotEmpty) {
      body['custom_weekdays'] = _selectedWeekdays;
    }

    try {
      if (_isEdit) {
        await _service.updateAlarm(widget.existingAlarm!.id, body);
      } else {
        await _service.createAlarm(body);
      }
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Failed: ${e.toString().replaceAll('Exception: ', '')}',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  // ── Pickers ──────────────────────────────────────────────────────────────

  Future<void> _pickDate(bool isStart) async {
    final initial = isStart ? _startDate : (_endDate ?? _startDate);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2024),
      lastDate: DateTime(2030),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
      } else {
        _endDate = picked;
      }
    });
  }

  Future<void> _pickTime(bool isStart) async {
    final initial = isStart
        ? _startTime
        : (_endTime ?? const TimeOfDay(hour: 20, minute: 0));
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startTime = picked;
      } else {
        _endTime = picked;
      }
    });
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Alarm' : 'New Alarm'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Medicine selector
            _sectionLabel('Medicine'),
            if (widget.medicines.isEmpty)
              const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: Text(
                  'No medicines found. Add one from the Dashboard tab first.',
                  style: TextStyle(color: AppColors.error),
                ),
              )
            else
              DropdownButtonFormField<int>(
                value: _selectedMedicineId,
                decoration: _inputDecoration('Select medicine'),
                items: widget.medicines
                    .map(
                      (m) => DropdownMenuItem(value: m.id, child: Text(m.name)),
                    )
                    .toList(),
                onChanged: (v) => setState(() => _selectedMedicineId = v),
                validator: (v) => v == null ? 'Required' : null,
              ),
            const SizedBox(height: 20),

            // Date range
            _sectionLabel('Date Range'),
            Row(
              children: [
                Expanded(
                  child: _dateTile('Start', _startDate, () => _pickDate(true)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _dateTile(
                    'End (optional)',
                    _endDate,
                    () => _pickDate(false),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Time range
            _sectionLabel('Time Window'),
            Row(
              children: [
                Expanded(
                  child: _timeTile('From', _startTime, () => _pickTime(true)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _timeTile(
                    'To (optional)',
                    _endTime,
                    () => _pickTime(false),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Times per day
            _sectionLabel('Times Per Day'),
            Row(
              children: [
                IconButton(
                  onPressed: _timesPerDay > 1
                      ? () => setState(() => _timesPerDay--)
                      : null,
                  icon: const Icon(Icons.remove_circle_outline),
                ),
                Text(
                  '$_timesPerDay',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: _timesPerDay < 12
                      ? () => setState(() => _timesPerDay++)
                      : null,
                  icon: const Icon(Icons.add_circle_outline),
                ),
                const SizedBox(width: 12),
                const Text(
                  'dose(s) per day',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Frequency
            _sectionLabel('Frequency'),
            SwitchListTile(
              title: const Text('Custom weekdays'),
              subtitle: const Text('Pick specific days of the week'),
              value: _useCustomWeekdays,
              activeColor: AppColors.primary,
              onChanged: (v) => setState(() => _useCustomWeekdays = v),
            ),
            if (_useCustomWeekdays)
              Wrap(
                spacing: 6,
                children: List.generate(7, (i) {
                  final selected = _selectedWeekdays.contains(i);
                  return FilterChip(
                    label: Text(_weekdayNames[i]),
                    selected: selected,
                    selectedColor: AppColors.primary.withValues(alpha: 0.2),
                    checkmarkColor: AppColors.primary,
                    onSelected: (v) {
                      setState(() {
                        if (v) {
                          _selectedWeekdays.add(i);
                        } else {
                          _selectedWeekdays.remove(i);
                        }
                      });
                    },
                  );
                }),
              )
            else ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Text('Every '),
                  SizedBox(
                    width: 60,
                    child: TextFormField(
                      initialValue: '$_intervalDays',
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      decoration: _inputDecoration(''),
                      onChanged: (v) {
                        final n = int.tryParse(v);
                        if (n != null && n > 0) _intervalDays = n;
                      },
                    ),
                  ),
                  const Text(' day(s)'),
                ],
              ),
            ],

            const SizedBox(height: 36),

            // Save button
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(_isEdit ? 'Update Alarm' : 'Create Alarm'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(
      text,
      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
    ),
  );

  InputDecoration _inputDecoration(String hint) => InputDecoration(
    hintText: hint,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
  );

  Widget _dateTile(String label, DateTime? value, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value != null
                  ? DateFormat('yyyy-MM-dd').format(value)
                  : 'Not set',
              style: const TextStyle(fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _timeTile(String label, TimeOfDay? value, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value != null ? value.format(context) : 'Not set',
              style: const TextStyle(fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
