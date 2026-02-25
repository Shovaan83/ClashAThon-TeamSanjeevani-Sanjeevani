import 'package:flutter/material.dart';
import 'package:sanjeevani/config/storage/storage_service.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/shared/widgets/role_selector.dart';

/// Shown at app launch while we check for a stored JWT token.
/// Routes to [AppRoutes.home] if token exists, [AppRoutes.loginScreen] otherwise.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final storage = StorageService();
    final token = await storage.getAuthToken();

    if (!mounted) return;

    if (token != null && token.isNotEmpty) {
      // Restore the stored role so the correct home content is shown
      final roleStr = await storage.getUserRole();
      final role = roleStr != null
          ? UserRoleX.fromBackend(roleStr)
          : UserRole.patient;

      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          AppRoutes.home,
          arguments: {'role': role},
        );
      }
    } else {
      Navigator.pushReplacementNamed(context, AppRoutes.loginScreen);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.local_hospital,
                color: AppColors.primary,
                size: 36,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'SANJEEVANI',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 32),
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
