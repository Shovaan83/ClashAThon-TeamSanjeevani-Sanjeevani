import 'package:flutter/material.dart';

/// Holds all TextEditingControllers for the login form.
/// Dispose via [dispose()] when the screen is destroyed.
class LoginController {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final formKey = GlobalKey<FormState>();

  String get email => emailController.text.trim();
  String get password => passwordController.text;

  bool validate() => formKey.currentState?.validate() ?? false;

  void dispose() {
    emailController.dispose();
    passwordController.dispose();
  }
}
