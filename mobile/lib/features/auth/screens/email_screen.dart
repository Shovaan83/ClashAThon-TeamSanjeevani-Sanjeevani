import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:sanjeevani/config/exception/api_exception.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/api_endpoints.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/core/service/api_service.dart';
import 'package:sanjeevani/shared/utils/validators/validators.dart';
import 'package:sanjeevani/shared/widgets/app_button.dart';
import 'package:sanjeevani/shared/widgets/app_text_field.dart';
import 'package:sanjeevani/shared/widgets/role_selector.dart';

/// Step 1 of signup: choose role + enter email → send OTP.
class EmailScreen extends StatefulWidget {
  const EmailScreen({super.key});

  @override
  State<EmailScreen> createState() => _EmailScreenState();
}

class _EmailScreenState extends State<EmailScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  UserRole _selectedRole = UserRole.patient;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleSendOtp() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _isLoading = true);

    try {
      await ApiService().post(
        ApiEndpoints.sendOtp,
        body: {'email': _emailController.text.trim()},
      );

      if (mounted) {
        Navigator.pushNamed(
          context,
          AppRoutes.otpVerification,
          arguments: {
            'email': _emailController.text.trim(),
            'role': _selectedRole,
          },
        );
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
            content: Text('Something went wrong. Please try again.'),
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

                // ── Logo & branding ──────────────────────────
                Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.local_hospital,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'SANJEEVANI',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 28),

                // ── Step indicator ───────────────────────────
                _StepIndicator(currentStep: 1, totalSteps: 3),

                const SizedBox(height: 24),

                // ── Heading ──────────────────────────────────
                Text(
                  'Get Started',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 6),
                Text(
                  'Choose your portal and enter your email.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),

                const SizedBox(height: 24),

                // ── Role selector ────────────────────────────
                RoleSelector(
                  selectedRole: _selectedRole,
                  onChanged: (role) => setState(() => _selectedRole = role),
                ),

                const SizedBox(height: 24),

                // ── Email ────────────────────────────────────
                AppTextField(
                  label: 'Email Address',
                  hintText: 'name@example.com',
                  controller: _emailController,
                  prefixIcon: Icons.mail_outline,
                  keyboardType: TextInputType.emailAddress,
                  validator: Validators.email,
                ),

                const SizedBox(height: 32),

                // ── Continue button ──────────────────────────
                AppButton(
                  text: 'Send OTP',
                  icon: Icons.arrow_forward,
                  isLoading: _isLoading,
                  onPressed: _handleSendOtp,
                ),

                const SizedBox(height: 24),

                // ── Already have an account ──────────────────
                Center(
                  child: RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                      children: [
                        const TextSpan(text: 'Already have an account? '),
                        TextSpan(
                          text: 'Log in',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () {
                              Navigator.pushReplacementNamed(
                                context,
                                AppRoutes.loginScreen,
                              );
                            },
                        ),
                      ],
                    ),
                  ),
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

/// Horizontal step dots indicator — reused across signup steps.
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
