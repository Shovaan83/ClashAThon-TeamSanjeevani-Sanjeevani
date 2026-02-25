import 'package:flutter/material.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';

/// Reusable bottom navigation bar used on the main shell screen.
///
/// **Patient** (default): 5 tabs – Home, Search, Add, Alerts, Profile
/// **Pharmacy** (`isPharmacy: true`): 3 tabs – Home, Alerts, Profile
class AppBottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final int notificationBadge;
  final bool isPharmacy;

  const AppBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.notificationBadge = 0,
    this.isPharmacy = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: isPharmacy ? _pharmacyItems() : _patientItems(),
          ),
        ),
      ),
    );
  }

  /// Pharmacy: Home (0), Alerts (1), Profile (2)
  List<Widget> _pharmacyItems() {
    return [
      _NavItem(
        icon: Icons.home_outlined,
        activeIcon: Icons.home,
        label: 'Home',
        isActive: currentIndex == 0,
        onTap: () => onTap(0),
      ),
      _NavItem(
        icon: Icons.notifications_outlined,
        activeIcon: Icons.notifications,
        label: 'Alerts',
        isActive: currentIndex == 1,
        onTap: () => onTap(1),
        badge: notificationBadge,
      ),
      _NavItem(
        icon: Icons.person_outline,
        activeIcon: Icons.person,
        label: 'Profile',
        isActive: currentIndex == 2,
        onTap: () => onTap(2),
      ),
    ];
  }

  /// Patient: Home (0), Search (1), Add (2), Alerts (3), Profile (4)
  List<Widget> _patientItems() {
    return [
      _NavItem(
        icon: Icons.home_outlined,
        activeIcon: Icons.home,
        label: 'Home',
        isActive: currentIndex == 0,
        onTap: () => onTap(0),
      ),
      _NavItem(
        icon: Icons.search_outlined,
        activeIcon: Icons.search,
        label: 'Search',
        isActive: currentIndex == 1,
        onTap: () => onTap(1),
      ),
      _AddButton(isActive: currentIndex == 2, onTap: () => onTap(2)),
      _NavItem(
        icon: Icons.notifications_outlined,
        activeIcon: Icons.notifications,
        label: 'Alerts',
        isActive: currentIndex == 3,
        onTap: () => onTap(3),
        badge: notificationBadge,
      ),
      _NavItem(
        icon: Icons.person_outline,
        activeIcon: Icons.person,
        label: 'Profile',
        isActive: currentIndex == 4,
        onTap: () => onTap(4),
      ),
    ];
  }
}

/// Standard nav item with icon + label.
class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final int badge;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
    this.badge = 0,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 56,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isActive ? activeIcon : icon,
                  size: 24,
                  color: isActive ? AppColors.primary : AppColors.textSecondary,
                ),
                if (badge > 0)
                  Positioned(
                    right: -6,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 14,
                      ),
                      child: Text(
                        badge > 99 ? '99+' : '$badge',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Elevated centre "+" button.
class _AddButton extends StatelessWidget {
  final bool isActive;
  final VoidCallback onTap;

  const _AddButton({required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: isActive ? AppColors.primaryDark : AppColors.primary,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: const Icon(Icons.add, color: Colors.white, size: 26),
      ),
    );
  }
}
