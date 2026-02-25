import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:sanjeevani/config/storage/storage_service.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/core/service/api_service.dart';
import 'package:sanjeevani/features/home/services/customer_service.dart';
import 'package:sanjeevani/features/home/services/pharmacy_profile_service.dart';
import 'package:sanjeevani/shared/utils/url_helper.dart';

/// Profile screen — loads real data from the backend.
///
/// Detects user role and uses [CustomerService] or [PharmacyProfileService]
/// accordingly. Shows editable personal info, security/notification toggles
/// and a logout button.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();

  bool _isSaving = false;
  bool _isLoading = true;
  bool _isUploadingPhoto = false;
  bool _isUploadingDoc = false;
  String? _error;

  // Determined dynamically from StorageService
  bool _isPharmacy = false;
  String _userRole = '';

  // Pharmacy-specific fields
  double? _lat;
  double? _lng;
  String? _profilePhotoUrl;
  String? _documentUrl;
  String? _documentStatus;

  // Security state
  bool _pushNotifications = true;
  bool _twoFactor = false;

  final _customerService = CustomerService();
  final _pharmacyService = PharmacyProfileService();
  final _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final role = await StorageService().getUserRole();
      _userRole = role ?? '';
      _isPharmacy = _userRole.toUpperCase() == 'PHARMACY';

      if (_isPharmacy) {
        final data = await _pharmacyService.getProfile();
        if (mounted) {
          setState(() {
            _nameController.text = (data['name'] as String?) ?? '';
            _emailController.text =
                (data['user']?['email'] as String?) ??
                (data['email'] as String?) ??
                '';
            _phoneController.text =
                (data['phone_number'] as String?) ??
                (data['user']?['phone_number'] as String?) ??
                '';
            _addressController.text = (data['address'] as String?) ?? '';
            _lat = (data['lat'] as num?)?.toDouble();
            _lng = (data['lng'] as num?)?.toDouble();
            _profilePhotoUrl = UrlHelper.resolveMediaUrl(
              data['profile_photo_url'] as String?,
            );
            _documentUrl = UrlHelper.resolveMediaUrl(
              data['document_url'] as String?,
            );
            _documentStatus = data['document_status'] as String?;
            _isLoading = false;
          });
        }
      } else {
        final user = await _customerService.getProfile();
        if (mounted) {
          setState(() {
            _nameController.text = user.name;
            _emailController.text = user.email;
            _phoneController.text = user.phoneNumber;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      // Fall back to cached storage values
      final name = await StorageService().getUserName();
      final email = await StorageService().getUserEmail();
      if (mounted) {
        setState(() {
          _nameController.text = name ?? '';
          _emailController.text = email ?? '';
          _isLoading = false;
          _error = 'Could not load profile from server.\nShowing cached data.';
        });
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _saveChanges() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _isSaving = true);

    try {
      if (_isPharmacy) {
        await _pharmacyService.updateProfile(
          name: _nameController.text.trim(),
          phoneNumber: _phoneController.text.trim(),
          address: _addressController.text.trim(),
          lat: _lat,
          lng: _lng,
        );
      } else {
        await _customerService.updateProfile(
          name: _nameController.text.trim(),
          phoneNumber: _phoneController.text.trim(),
        );
      }
      // Persist name locally too
      await StorageService().saveUserName(_nameController.text.trim());

      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully.'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  // ── Photo / Document upload ────────────────────────────
  Future<void> _pickAndUploadProfilePhoto() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      imageQuality: 80,
    );
    if (picked == null) return;

    setState(() => _isUploadingPhoto = true);
    try {
      await _pharmacyService.uploadProfilePhoto(File(picked.path));
      // Reload profile to get URL
      await _loadProfile();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile photo updated.'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Photo upload failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingPhoto = false);
    }
  }

  Future<void> _pickAndUploadDocument() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      imageQuality: 85,
    );
    if (picked == null) return;

    setState(() => _isUploadingDoc = true);
    try {
      await _pharmacyService.uploadDocument(File(picked.path));
      await _loadProfile();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Document uploaded successfully.'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Document upload failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingDoc = false);
    }
  }

  // ── Build ──────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadProfile,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.accent.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.info_outline,
                        size: 16,
                        color: AppColors.accent,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.accent,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // ── Profile header ─────────────────────────────
            _ProfileHeader(
              name: _nameController.text.isNotEmpty
                  ? _nameController.text
                  : (_isPharmacy ? 'Pharmacy' : 'Patient'),
              roleLabel: _isPharmacy ? 'PHARMACY' : 'PATIENT',
              profilePhotoUrl: _profilePhotoUrl,
              onEditTap: _isPharmacy ? _pickAndUploadProfilePhoto : () {},
            ),

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
                              validator: (v) => (v == null || v.trim().isEmpty)
                                  ? 'Name is required'
                                  : null,
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
                              readOnly: true, // email not editable
                              keyboardType: TextInputType.emailAddress,
                              decoration: _inputDeco('Email address'),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _FieldGroup(
                      label: 'Phone Number',
                      child: TextFormField(
                        controller: _phoneController,
                        style: _fieldStyle,
                        keyboardType: TextInputType.phone,
                        decoration: _inputDeco('+977 XXXX-XXXXXX'),
                      ),
                    ),
                    if (_isPharmacy) ...[
                      const SizedBox(height: 12),
                      _FieldGroup(
                        label: 'Address',
                        child: TextFormField(
                          controller: _addressController,
                          style: _fieldStyle,
                          maxLines: 2,
                          decoration: _inputDeco('Full pharmacy address'),
                        ),
                      ),
                      if (_lat != null && _lng != null) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Icon(
                              Icons.location_on_outlined,
                              size: 14,
                              color: AppColors.textSecondary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Lat: ${_lat!.toStringAsFixed(5)}, Lng: ${_lng!.toStringAsFixed(5)}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
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

            // ── Pharmacy profile photo section ────────────
            if (_isPharmacy) ...[
              const SizedBox(height: 16),
              _SectionCard(
                icon: Icons.camera_alt_outlined,
                title: 'Profile Photo',
                child: Column(
                  children: [
                    if (_profilePhotoUrl != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          _profilePhotoUrl!,
                          height: 160,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            height: 120,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.broken_image,
                                size: 36,
                                color: AppColors.textHint,
                              ),
                            ),
                          ),
                        ),
                      )
                    else
                      Container(
                        height: 120,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppColors.border,
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: const Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.add_a_photo_outlined,
                                size: 32,
                                color: AppColors.textHint,
                              ),
                              SizedBox(height: 6),
                              Text(
                                'No profile photo',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textHint,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 38,
                      child: OutlinedButton.icon(
                        onPressed: _isUploadingPhoto
                            ? null
                            : _pickAndUploadProfilePhoto,
                        icon: _isUploadingPhoto
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.primary,
                                ),
                              )
                            : const Icon(Icons.upload_outlined, size: 16),
                        label: Text(
                          _isUploadingPhoto
                              ? 'Uploading…'
                              : (_profilePhotoUrl != null
                                    ? 'Change Photo'
                                    : 'Upload Photo'),
                          style: const TextStyle(fontSize: 13),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // ── Pharmacy document section ──────────────────
              const SizedBox(height: 16),
              _SectionCard(
                icon: Icons.description_outlined,
                title: 'Pharmacy Document',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_documentStatus != null)
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: _documentStatus == 'VERIFIED'
                                  ? AppColors.primary.withValues(alpha: 0.1)
                                  : AppColors.accent.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              _documentStatus!,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: _documentStatus == 'VERIFIED'
                                    ? AppColors.primary
                                    : AppColors.accent,
                              ),
                            ),
                          ),
                        ],
                      ),
                    if (_documentUrl != null) ...[
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          _documentUrl!,
                          height: 140,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            height: 100,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.insert_drive_file_outlined,
                                size: 36,
                                color: AppColors.textHint,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ] else
                      Container(
                        height: 100,
                        width: double.infinity,
                        margin: const EdgeInsets.only(top: 10),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.upload_file_outlined,
                                size: 28,
                                color: AppColors.textHint,
                              ),
                              SizedBox(height: 4),
                              Text(
                                'No document uploaded',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textHint,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 38,
                      child: OutlinedButton.icon(
                        onPressed: _isUploadingDoc
                            ? null
                            : _pickAndUploadDocument,
                        icon: _isUploadingDoc
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.primary,
                                ),
                              )
                            : const Icon(Icons.upload_outlined, size: 16),
                        label: Text(
                          _isUploadingDoc
                              ? 'Uploading…'
                              : (_documentUrl != null
                                    ? 'Re-upload Document'
                                    : 'Upload Document'),
                          style: const TextStyle(fontSize: 13),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

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
                        await StorageService().clearAll();
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
  final String roleLabel;
  final String? profilePhotoUrl;
  final VoidCallback onEditTap;

  const _ProfileHeader({
    required this.name,
    required this.roleLabel,
    this.profilePhotoUrl,
    required this.onEditTap,
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
      child: Row(
        children: [
          // Avatar with verified badge
          Stack(
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                backgroundImage: profilePhotoUrl != null
                    ? NetworkImage(profilePhotoUrl!)
                    : null,
                child: profilePhotoUrl == null
                    ? const Icon(
                        Icons.person,
                        size: 38,
                        color: AppColors.primary,
                      )
                    : null,
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
                Row(
                  children: [
                    Icon(
                      Icons.badge_outlined,
                      size: 12,
                      color: AppColors.textSecondary,
                    ),
                    SizedBox(width: 3),
                    Text(
                      roleLabel,
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

class _SectionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;

  const _SectionCard({
    required this.icon,
    required this.title,
    required this.child,
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
