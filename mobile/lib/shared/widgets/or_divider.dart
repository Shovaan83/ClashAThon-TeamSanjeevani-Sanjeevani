import 'package:flutter/material.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';

class OrDivider extends StatelessWidget {
  final String text;

  const OrDivider({super.key, this.text = 'Or continue with'});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            text,
            style: const TextStyle(color: AppColors.textHint, fontSize: 13),
          ),
        ),
        const Expanded(child: Divider()),
      ],
    );
  }
}
