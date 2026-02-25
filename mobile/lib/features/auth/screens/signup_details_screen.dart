import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:sanjeevani/config/exception/api_exception.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/features/auth/services/auth_service.dart';
import 'package:sanjeevani/shared/utils/validators/validators.dart';
import 'package:sanjeevani/shared/widgets/app_button.dart';
import 'package:sanjeevani/shared/widgets/app_text_field.dart';
import 'package:sanjeevani/shared/widgets/location_picker.dart';
import 'package:sanjeevani/shared/widgets/role_selector.dart';

/// Step 3 of signup: full name / pharmacy name, phone, password, confirm password.
///
/// Expects route arguments: `{ 'email': String, 'role': UserRole }`.
class SignupDetailsScreen extends StatefulWidget {
  const SignupDetailsScreen({super.key});

  @override
  State<SignupDetailsScreen> createState() => _SignupDetailsScreenState();
}

class _SignupDetailsScreenState extends State<SignupDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _authService = AuthService();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;

  // Pharmacy location
  double? _latitude;
  double? _longitude;
  bool get _hasLocation => _latitude != null && _longitude != null;

  late String _email;
  late UserRole _role;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    _email = (args?['email'] as String?) ?? '';
    _role = (args?['role'] as UserRole?) ?? UserRole.patient;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  String get _nameLabel =>
      _role == UserRole.pharmacy ? 'Pharmacy Name' : 'Full Name';

  String get _nameHint =>
      _role == UserRole.pharmacy ? 'e.g. Hamro Pharmacy' : 'e.g. Rame Sharma';

  Future<void> _handleSignup() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    if (_role == UserRole.pharmacy && !_hasLocation) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please pin your pharmacy location on the map'),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (_role == UserRole.pharmacy) {
        // Pharmacy registration — no tokens returned, redirect to login
        await _authService.registerPharmacy(
          email: _email,
          name: _nameController.text.trim(),
          phoneNumber: _phoneController.text.trim(),
          password: _passwordController.text,
          lat: _latitude!,
          lng: _longitude!,
        );

        if (mounted) {
          Navigator.pushNamedAndRemoveUntil(
            context,
            AppRoutes.loginScreen,
            (route) => false,
          );
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Pharmacy registered! Please log in.'),
            ),
          );
        }
      } else {
        // Patient registration — returns tokens, auto-login
        final authResponse = await _authService.registerCustomer(
          email: _email,
          name: _nameController.text.trim(),
          phoneNumber: _phoneController.text.trim(),
          password: _passwordController.text,
          confirmPassword: _confirmPasswordController.text,
        );

        await _authService.persistSession(authResponse);

        final role = UserRoleX.fromBackend(authResponse.user.role);

        if (mounted) {
          Navigator.pushNamedAndRemoveUntil(
            context,
            AppRoutes.home,
            (route) => false,
            arguments: {'role': role},
          );
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Welcome to Sanjeevani!'),
              backgroundColor: AppColors.primary,
            ),
          );
        }
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Registration failed. Please try again.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),

                // ── Back button ──────────────────────────
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back),
                  padding: EdgeInsets.zero,
                  alignment: Alignment.centerLeft,
                ),

                const SizedBox(height: 8),

                // ── Step indicator ───────────────────────
                _StepIndicator(currentStep: 3, totalSteps: 3),

                const SizedBox(height: 24),

                // ── Heading ──────────────────────────────
                Text(
                  'Complete Profile',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 6),
                Text(
                  'Fill in your details to finish registration.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),

                const SizedBox(height: 8),

                // ── Email chip (read-only) ───────────────
                Chip(
                  avatar: const Icon(Icons.mail_outline, size: 16),
                  label: Text(_email, style: const TextStyle(fontSize: 13)),
                  backgroundColor: AppColors.primary.withValues(alpha: 0.08),
                  side: BorderSide.none,
                ),

                const SizedBox(height: 20),

                // ── Full Name / Pharmacy Name ────────────
                AppTextField(
                  label: _nameLabel,
                  hintText: _nameHint,
                  controller: _nameController,
                  prefixIcon: _role == UserRole.pharmacy
                      ? Icons.local_pharmacy_outlined
                      : Icons.person_outline,
                  validator: Validators.name,
                ),

                const SizedBox(height: 16),

                // ── Phone ────────────────────────────────
                AppTextField(
                  label: 'Phone Number',
                  hintText: '+977 9800000000',
                  controller: _phoneController,
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: Validators.phone,
                ),

                const SizedBox(height: 16),

                // ── Password ─────────────────────────────
                AppTextField(
                  label: 'Password',
                  hintText: '••••••••',
                  controller: _passwordController,
                  prefixIcon: Icons.lock_outline,
                  obscureText: _obscurePassword,
                  validator: Validators.password,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 20,
                    ),
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),

                const SizedBox(height: 16),

                // ── Confirm Password ─────────────────────
                AppTextField(
                  label: 'Confirm Password',
                  hintText: '••••••••',
                  controller: _confirmPasswordController,
                  prefixIcon: Icons.lock_outline,
                  obscureText: _obscureConfirm,
                  validator: Validators.confirmPassword(
                    _passwordController.text,
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureConfirm
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 20,
                    ),
                    onPressed: () =>
                        setState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                ),

                // ── Pharmacy location picker (only for pharmacy) ──
                if (_role == UserRole.pharmacy) ...[
                  const SizedBox(height: 16),
                  LocationPickerWidget(
                    initialLocation: _hasLocation
                        ? LatLng(_latitude!, _longitude!)
                        : null,
                    onLocationPicked: (latLng) {
                      _latitude = latLng.latitude;
                      _longitude = latLng.longitude;
                    },
                  ),
                ],

                const SizedBox(height: 32),

                // ── Create Account button ────────────────
                AppButton(
                  text: 'Create Account',
                  icon: Icons.arrow_forward,
                  isLoading: _isLoading,
                  onPressed: _handleSignup,
                ),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Horizontal step dots indicator.
class _StepIndicator extends StatelessWidget {
  final int currentStep;
  final int totalSteps;

  const _StepIndicator({required this.currentStep, required this.totalSteps});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(totalSteps, (i) {
        final step = i + 1;
        final isActive = step <= currentStep;
        return Expanded(
          child: Container(
            height: 4,
            margin: EdgeInsets.only(right: i < totalSteps - 1 ? 8 : 0),
            decoration: BoxDecoration(
              color: isActive ? AppColors.primary : AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        );
      }),
    );
  }
}
