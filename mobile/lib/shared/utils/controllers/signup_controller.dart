import 'package:flutter/material.dart';

/// Holds all TextEditingControllers for the signup form.
/// Dispose via [dispose()] when the screen is destroyed.
class SignupController {
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final passwordController = TextEditingController();
  final formKey = GlobalKey<FormState>();

  String get name => nameController.text.trim();
  String get email => emailController.text.trim();
  String get phone => phoneController.text.trim();
  String get password => passwordController.text;

  bool validate() => formKey.currentState?.validate() ?? false;

  void dispose() {
    nameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    passwordController.dispose();
  }
}
