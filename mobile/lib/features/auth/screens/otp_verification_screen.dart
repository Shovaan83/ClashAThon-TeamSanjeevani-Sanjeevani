import 'dart:async';
import 'package:flutter/material.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/shared/widgets/app_button.dart';
import 'package:sanjeevani/shared/widgets/otp_input_field.dart';
import 'package:sanjeevani/shared/widgets/role_selector.dart';

/// Step 2 of signup: verify the OTP sent to email.
///
/// Expects route arguments: `{ 'email': String, 'role': UserRole }`.
class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  String _otp = '';
  bool _isLoading = false;
  int _resendSeconds = 60;
  Timer? _timer;

  late String _email;
  late UserRole _role;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args =
        ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    _email = args['email'] as String;
    _role = args['role'] as UserRole;
    _startResendTimer();
  }

  void _startResendTimer() {
    _timer?.cancel();
    setState(() => _resendSeconds = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_resendSeconds <= 1) {
        t.cancel();
      }
      if (mounted) setState(() => _resendSeconds--);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _handleVerify() async {
    if (_otp.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the complete OTP')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // TODO: Call ApiService to verify OTP
      await Future.delayed(const Duration(seconds: 1)); // placeholder

      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          AppRoutes.signupDetails,
          arguments: {'email': _email, 'role': _role},
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleResend() async {
    // TODO: Call ApiService to resend OTP
    _startResendTimer();
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('OTP resent to your email')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),

              // ── Back button ────────────────────────────
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back),
                padding: EdgeInsets.zero,
                alignment: Alignment.centerLeft,
              ),

              const SizedBox(height: 8),

              // ── Step indicator ─────────────────────────
              _StepIndicator(currentStep: 2, totalSteps: 3),

              const SizedBox(height: 24),

              // ── Heading ────────────────────────────────
              Text(
                'Verify Email',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 6),
              Text(
                'We sent a 6-digit code to',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 2),
              Text(
                _email,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),

              const SizedBox(height: 32),

              // ── OTP input ──────────────────────────────
              OtpInputField(
                length: 6,
                onCompleted: (otp) => _otp = otp,
                onChanged: (otp) => _otp = otp,
              ),

              const SizedBox(height: 24),

              // ── Resend timer ───────────────────────────
              Center(
                child: _resendSeconds > 0
                    ? Text(
                        'Resend code in ${_resendSeconds}s',
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                        ),
                      )
                    : TextButton(
                        onPressed: _handleResend,
                        child: const Text('Resend Code'),
                      ),
              ),

              const SizedBox(height: 32),

              // ── Verify button ──────────────────────────
              AppButton(
                text: 'Verify & Continue',
                icon: Icons.arrow_forward,
                isLoading: _isLoading,
                onPressed: _handleVerify,
              ),

              const SizedBox(height: 32),
            ],
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
