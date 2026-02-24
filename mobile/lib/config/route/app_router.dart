import 'package:flutter/material.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/features/auth/screens/login_screen.dart';
import 'package:sanjeevani/features/auth/screens/signup_screen.dart';
import 'package:sanjeevani/features/auth/screens/splash_screen.dart';
import 'package:sanjeevani/features/home/screens/home_screen.dart';

class AppRouter {
  Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());

      case AppRoutes.loginScreen:
        return MaterialPageRoute(builder: (_) => const LoginScreen());

      case AppRoutes.signupScreen:
        return MaterialPageRoute(builder: (_) => const SignupScreen());

      case AppRoutes.home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());

      default:
        return MaterialPageRoute(
          builder: (context) => Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'No route defined for ${settings.name}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.of(
                        context,
                      ).pushReplacementNamed(AppRoutes.loginScreen);
                    },
                    child: const Text('Go to Login'),
                  ),
                ],
              ),
            ),
          ),
        );
    }
  }
}
