import 'package:flutter/material.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';

/// Pulsing "LIVE RADAR ACTIVE" indicator shown at the top of the broadcast panel.
class LiveRadarBadge extends StatefulWidget {
  const LiveRadarBadge({super.key});

  @override
  State<LiveRadarBadge> createState() => _LiveRadarBadgeState();
}

class _LiveRadarBadgeState extends State<LiveRadarBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(
      begin: 0.4,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedBuilder(
          animation: _pulseAnim,
          builder: (_, __) => Opacity(
            opacity: _pulseAnim.value,
            child: Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.accent,
                shape: BoxShape.circle,
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
        const Text(
          'LIVE RADAR ACTIVE',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.accent,
            letterSpacing: 0.8,
          ),
        ),
      ],
    );
  }
}
