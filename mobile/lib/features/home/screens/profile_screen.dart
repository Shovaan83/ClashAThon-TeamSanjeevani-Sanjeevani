import 'package:flutter/material.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/core/service/api_service.dart';

/// Patient profile screen — matches the reference design with editable
/// personal info, health records, saved pharmacies and security settings.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // ── Form state ─────────────────────────────────────────
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController(text: 'Dev Patient');
  final _emailController = TextEditingController(text: 'patient@dev.com');
  final _phoneController = TextEditingController(text: '+977 984-723-4567');
  String _bloodGroup = 'B+';
  bool _isSaving = false;

  // ── Security state ─────────────────────────────────────
  bool _pushNotifications = true;
  bool _twoFactor = false;

  // ── Placeholder health records ─────────────────────────
  static const _healthRecords = [
    (
      label: 'General Checkup.pdf',
      date: 'Feb 21, 2026',
      icon: Icons.picture_as_pdf,
    ),
    (
      label: 'Pharmacy Receipt.jpg',
      date: 'Feb 22, 2026',
      icon: Icons.image_outlined,
    ),
    (label: 'Add New', date: '', icon: Icons.add),
  ];

  // ── Placeholder pharmacies ─────────────────────────────
  static const _savedPharmacies = [
    (name: 'Everest Pharmacy', addr: 'Thamel, Kathmandu'),
    (name: 'Himalayan Meds', addr: 'New Road, Pokhara'),
  ];

  static const _bloodGroups = [
    'A+',
    'A-',
    'B+',
    'B-',
    'O+',
    'O-',
    'AB+',
    'AB-',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _saveChanges() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _isSaving = true);
    // TODO: Call ApiService to update profile on backend
    await Future.delayed(const Duration(milliseconds: 900));
    if (mounted) {
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully.'),
          backgroundColor: AppColors.primary,
        ),
      );
    }
  }

  // ── Build ──────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Profile header ─────────────────────────────
          _ProfileHeader(name: _nameController.text, onEditTap: () {}),

          const SizedBox(height: 16),

          // ── Stats row ──────────────────────────────────
          const _StatsRow(),

          const SizedBox(height: 16),

          // ── Personal information ───────────────────────
          _SectionCard(
            icon: Icons.person_outline,
            title: 'Personal Information',
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _FieldGroup(
                          label: 'Full Name',
                          child: TextFormField(
                            controller: _nameController,
                            style: _fieldStyle,
                            decoration: _inputDeco('Full Name'),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _FieldGroup(
                          label: 'Email Address',
                          child: TextFormField(
                            controller: _emailController,
                            style: _fieldStyle,
                            keyboardType: TextInputType.emailAddress,
                            decoration: _inputDeco('Email address'),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _FieldGroup(
                          label: 'Phone Number',
                          child: TextFormField(
                            controller: _phoneController,
                            style: _fieldStyle,
                            keyboardType: TextInputType.phone,
                            decoration: _inputDeco('+977 XXXX-XXXXXX'),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _FieldGroup(
                          label: 'Blood Group',
                          child: DropdownButtonFormField<String>(
                            value: _bloodGroup,
                            decoration: _inputDeco('Select'),
                            style: _fieldStyle.copyWith(
                              color: AppColors.textPrimary,
                            ),
                            items: _bloodGroups
                                .map(
                                  (g) => DropdownMenuItem(
                                    value: g,
                                    child: Text(g),
                                  ),
                                )
                                .toList(),
                            onChanged: (v) {
                              if (v != null) setState(() => _bloodGroup = v);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerRight,
                    child: SizedBox(
                      height: 38,
                      child: ElevatedButton(
                        onPressed: _isSaving ? null : _saveChanges,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                        ),
                        child: _isSaving
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Save Changes',
                                style: TextStyle(fontSize: 13),
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // ── Health records ─────────────────────────────
          _SectionCard(
            icon: Icons.folder_outlined,
            title: 'Health Records',
            trailing: TextButton.icon(
              onPressed: () {},
              icon: const Icon(
                Icons.upload_outlined,
                size: 14,
                color: AppColors.primary,
              ),
              label: const Text(
                'Upload New',
                style: TextStyle(fontSize: 12, color: AppColors.primary),
              ),
            ),
            child: Row(
              children: _healthRecords
                  .map((r) => Expanded(child: _HealthRecordTile(record: r)))
                  .toList(),
            ),
          ),

          const SizedBox(height: 16),

          // ── Saved pharmacies ───────────────────────────
          _SectionCard(
            icon: Icons.favorite_border,
            title: 'Saved Pharmacies',
            child: Column(
              children: [
                ..._savedPharmacies.map(
                  (p) => _PharmacyRow(name: p.name, addr: p.addr),
                ),
                const SizedBox(height: 4),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {},
                    child: const Text(
                      'View all Pharmacies',
                      style: TextStyle(fontSize: 12, color: AppColors.primary),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ── Security & notifications ───────────────────
          _SectionCard(
            icon: Icons.security_outlined,
            title: 'Security & Notifications',
            child: Column(
              children: [
                _ToggleRow(
                  label: 'Push Notifications',
                  subtitle: 'Alerts for pickup and requests',
                  value: _pushNotifications,
                  onChanged: (v) => setState(() => _pushNotifications = v),
                ),
                const SizedBox(height: 8),
                _ToggleRow(
                  label: '2FA Authentication',
                  subtitle: 'Enhanced account protection',
                  value: _twoFactor,
                  onChanged: (v) => setState(() => _twoFactor = v),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 40,
                  child: OutlinedButton(
                    onPressed: () async {
                      await ApiService().clearAuthToken();
                      if (context.mounted) {
                        Navigator.pushNamedAndRemoveUntil(
                          context,
                          AppRoutes.loginScreen,
                          (r) => false,
                        );
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.error),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Logout Session',
                      style: TextStyle(color: AppColors.error, fontSize: 13),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static const _fieldStyle = TextStyle(
    fontSize: 13,
    color: AppColors.textPrimary,
  );

  InputDecoration _inputDeco(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(fontSize: 13, color: AppColors.textHint),
    isDense: true,
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
    ),
  );
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _ProfileHeader extends StatelessWidget {
  final String name;
  final VoidCallback onEditTap;

  const _ProfileHeader({required this.name, required this.onEditTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Avatar with verified badge
          Stack(
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: const Icon(
                  Icons.person,
                  size: 38,
                  color: AppColors.primary,
                ),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: const Icon(Icons.check, size: 11, color: Colors.white),
                ),
              ),
            ],
          ),

          const SizedBox(width: 14),

          // Name + location + action buttons
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.3),
                        ),
                      ),
                      child: const Text(
                        'VERIFIED',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                const Row(
                  children: [
                    Icon(
                      Icons.location_on_outlined,
                      size: 12,
                      color: AppColors.textSecondary,
                    ),
                    SizedBox(width: 3),
                    Text(
                      'Kathmandu, Nepal',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _HeaderButton(
                      label: 'Edit Profile',
                      onTap: onEditTap,
                      filled: true,
                    ),
                    const SizedBox(width: 8),
                    _HeaderButton(
                      label: 'Download ID',
                      onTap: () {},
                      filled: false,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool filled;

  const _HeaderButton({
    required this.label,
    required this.onTap,
    required this.filled,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: filled ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: filled ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: filled ? Colors.white : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow();

  @override
  Widget build(BuildContext context) {
    const stats = [
      (
        value: '24',
        label: 'Medicine\nRequests',
        icon: Icons.local_pharmacy_outlined,
      ),
      (value: '05', label: 'Active\nDrugs', icon: Icons.medication_outlined),
      (value: '2', label: 'Saved\nPharmacies', icon: Icons.bookmark_border),
    ];

    return Row(
      children: List.generate(stats.length, (i) {
        final s = stats[i];
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: i < stats.length - 1 ? 8 : 0),
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Icon(s.icon, size: 18, color: AppColors.primary),
                const SizedBox(height: 6),
                Text(
                  s.value,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  s.label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textSecondary,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;
  final Widget? trailing;

  const _SectionCard({
    required this.icon,
    required this.title,
    required this.child,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              if (trailing != null) ...[const Spacer(), trailing!],
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _FieldGroup extends StatelessWidget {
  final String label;
  final Widget child;

  const _FieldGroup({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 5),
        child,
      ],
    );
  }
}

class _HealthRecordTile extends StatelessWidget {
  final ({String label, String date, IconData icon}) record;

  const _HealthRecordTile({required this.record});

  bool get _isAddButton => record.date.isEmpty;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: _isAddButton
              ? AppColors.backgroundLight
              : AppColors.primary.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: _isAddButton
                ? AppColors.border
                : AppColors.primary.withValues(alpha: 0.15),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              record.icon,
              size: 24,
              color: _isAddButton ? AppColors.textSecondary : AppColors.primary,
            ),
            const SizedBox(height: 8),
            Text(
              record.label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: _isAddButton
                    ? AppColors.textSecondary
                    : AppColors.textPrimary,
              ),
            ),
            if (record.date.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                record.date,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PharmacyRow extends StatelessWidget {
  final String name;
  final String addr;

  const _PharmacyRow({required this.name, required this.addr});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.local_pharmacy_outlined,
              size: 18,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  addr,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.favorite, size: 18, color: AppColors.accent),
            onPressed: () {},
            constraints: const BoxConstraints(),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  final String label;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleRow({
    required this.label,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
        Transform.scale(
          scale: 0.85,
          child: Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
          ),
        ),
      ],
    );
  }
}
