import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:sanjeevani/config/exception/api_exception.dart';
import 'package:sanjeevani/config/storage/storage_service.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/api_endpoints.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/core/service/api_service.dart';
import 'package:sanjeevani/shared/utils/controllers/login_controller.dart';
import 'package:sanjeevani/shared/utils/validators/validators.dart';
import 'package:sanjeevani/shared/widgets/app_button.dart';
import 'package:sanjeevani/shared/widgets/app_text_field.dart';
import 'package:sanjeevani/shared/widgets/role_selector.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _controller = LoginController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_controller.validate()) return;

    setState(() => _isLoading = true);

    try {
      final response = await ApiService().post(
        ApiEndpoints.login,
        body: {'email': _controller.email, 'password': _controller.password},
      );

      // Backend returns { status, message, data: { user: {..., role}, tokens: { access, refresh } } }
      final data = response['data'] as Map<String, dynamic>;
      final user = data['user'] as Map<String, dynamic>;
      final tokens = data['tokens'] as Map<String, dynamic>;

      await ApiService().saveTokens(
        access: tokens['access'] as String,
        refresh: tokens['refresh'] as String,
      );

      // Persist user info for splash-screen role routing
      final storage = StorageService();
      await storage.saveUserRole(user['role'] as String);
      await storage.saveUserName(user['name'] as String);
      await storage.saveUserEmail(user['email'] as String);

      // Route to the correct home screen based on role
      final role = UserRoleX.fromBackend(user['role'] as String);

      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          AppRoutes.home,
          arguments: {'role': role},
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
          const SnackBar(content: Text('Login failed. Please try again.')),
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
            key: _controller.formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),

                // ── Logo & branding ──────────────────────────────────────
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

                const SizedBox(height: 40),

                // ── Heading ──────────────────────────────────────────────
                Text(
                  'Welcome Back',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 6),
                Text(
                  'Sign in to continue your journey.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),

                const SizedBox(height: 32),

                // ── Email ────────────────────────────────────────────────
                AppTextField(
                  label: 'Email Address',
                  hintText: 'name@example.com',
                  controller: _controller.emailController,
                  prefixIcon: Icons.mail_outline,
                  keyboardType: TextInputType.emailAddress,
                  validator: Validators.email,
                ),

                const SizedBox(height: 16),

                // ── Password ─────────────────────────────────────────────
                AppTextField(
                  label: 'Password',
                  hintText: '••••••••',
                  controller: _controller.passwordController,
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

                const SizedBox(height: 8),

                //  Forgot password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      // TODO: navigate to forgot password
                    },
                    child: const Text('Forgot Password?'),
                  ),
                ),

                const SizedBox(height: 16),

                // ── Login button ─────────────────────────────────────────
                AppButton(
                  text: 'Log In',
                  icon: Icons.arrow_forward,
                  isLoading: _isLoading,
                  onPressed: _handleLogin,
                ),

                const SizedBox(height: 24),

                // ── Don't have an account ────────────────────────────────
                Center(
                  child: RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                      children: [
                        const TextSpan(text: "Don't have an account? "),
                        TextSpan(
                          text: 'Sign up',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () {
                              Navigator.pushReplacementNamed(
                                context,
                                AppRoutes.signupScreen,
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
