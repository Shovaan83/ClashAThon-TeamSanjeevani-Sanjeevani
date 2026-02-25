import 'package:flutter/material.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/features/auth/screens/email_screen.dart';
import 'package:sanjeevani/features/auth/screens/login_screen.dart';
import 'package:sanjeevani/features/auth/screens/otp_verification_screen.dart';
import 'package:sanjeevani/features/auth/screens/signup_details_screen.dart';
import 'package:sanjeevani/features/static/splash_screen.dart';
import 'package:sanjeevani/features/home/screens/main_screen.dart';
import 'package:sanjeevani/features/chatbot/screens/chatbot_screen.dart';
import 'package:sanjeevani/features/daily_rem/screens/daily_reminders_screen.dart';
import 'package:sanjeevani/shared/widgets/role_selector.dart';

class AppRouter {
  Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());

      case AppRoutes.loginScreen:
        return MaterialPageRoute(builder: (_) => const LoginScreen());

      case AppRoutes.signupScreen:
        return MaterialPageRoute(builder: (_) => const EmailScreen());

      case AppRoutes.otpVerification:
        return MaterialPageRoute(
          builder: (_) => const OtpVerificationScreen(),
          settings: settings,
        );

      case AppRoutes.signupDetails:
        return MaterialPageRoute(
          builder: (_) => const SignupDetailsScreen(),
          settings: settings,
        );

      case AppRoutes.home:
        final args = settings.arguments as Map<String, dynamic>?;
        final role = (args?['role'] as UserRole?) ?? UserRole.patient;
        return MaterialPageRoute(builder: (_) => MainScreen(role: role));

      case AppRoutes.chatbot:
        return MaterialPageRoute(builder: (_) => const ChatbotScreen());

      case AppRoutes.dailyReminders:
        return MaterialPageRoute(builder: (_) => const DailyRemindersScreen());

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
