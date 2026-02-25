import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/core/providers/notification_provider.dart';
import 'package:sanjeevani/core/service/fcm_service.dart';
import 'package:sanjeevani/features/home/screens/add_screen.dart';
import 'package:sanjeevani/features/home/screens/notification_screen.dart';
import 'package:sanjeevani/features/home/screens/patient_home_content.dart';
import 'package:sanjeevani/features/home/screens/pharmacy_home_content.dart';
import 'package:sanjeevani/features/home/screens/profile_screen.dart';
import 'package:sanjeevani/features/home/screens/search_screen.dart';
import 'package:sanjeevani/shared/widgets/bottom_nav_bar.dart';
import 'package:sanjeevani/shared/widgets/role_selector.dart';

/// The main shell after login. Holds the bottom navigation and swaps the
/// body between the tabs. The [role] decides which home content to show.
///
/// **Patient** tabs: Home, Search, Broadcast, Notifications, Profile  (5 tabs)
/// **Pharmacy** tabs: Home, Notifications, Profile                    (3 tabs)
class MainScreen extends StatefulWidget {
  final UserRole role;

  const MainScreen({super.key, required this.role});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  bool get _isPharmacy => widget.role == UserRole.pharmacy;

  late final List<Widget> _tabs;

  @override
  void initState() {
    super.initState();

    if (_isPharmacy) {
      _tabs = [
        const PharmacyHomeContent(), // 0 – Home
        const NotificationScreen(), // 1 – Notifications
        const ProfileScreen(), // 2 – Profile
      ];
    } else {
      _tabs = [
        PatientHomeContent(
          onSwitchTab: (index) => setState(() => _currentIndex = index),
        ), // 0 – Home
        const SearchScreen(), // 1 – Search
        const AddScreen(), // 2 – Broadcast
        const NotificationScreen(), // 3 – Notifications
        const ProfileScreen(), // 4 – Profile
      ];
    }

    // Initialise the notification provider for customer role.
    // Pharmacy role init is handled inside PharmacyHomeContent.
    if (widget.role == UserRole.patient) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.read<NotificationProvider>().init();
      });
    }

    // Initialise FCM (register device token, listen for pushes).
    // Done here instead of main() because the JWT token is now available.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await FcmService.instance.init();

      // Wire FCM broadcast events to NotificationProvider so that push
      // notifications arriving via FCM trigger the same UI updates as
      // WebSocket messages (refresh requests, show notifications, etc.).
      if (mounted) {
        final provider = context.read<NotificationProvider>();
        FcmService.instance.onBroadcastEvent = (data) {
          provider.fetchRequests(); // refresh on any broadcast push
        };
      }
    });
  }

  String get _appBarTitle {
    switch (widget.role) {
      case UserRole.pharmacy:
        return 'Sanjeevani Pharmacy';
      case UserRole.admin:
        return 'Sanjeevani Admin';
      default:
        return 'Sanjeevani';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          _appBarTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.support_agent_outlined,
              color: Colors.white,
              size: 26,
            ),
            tooltip: 'AI Health Assistant',
            onPressed: () => Navigator.pushNamed(context, AppRoutes.chatbot),
          ),
        ],
      ),
      body: SafeArea(child: _tabs[_currentIndex]),
      bottomNavigationBar: Consumer<NotificationProvider>(
        builder: (context, provider, _) => AppBottomNavBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          notificationBadge: provider.unreadCount,
          isPharmacy: _isPharmacy,
        ),
      ),
    );
  }
}
