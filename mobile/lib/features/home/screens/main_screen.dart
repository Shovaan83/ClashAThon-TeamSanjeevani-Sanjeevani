import 'package:flutter/material.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/routes.dart';
import 'package:sanjeevani/features/home/screens/add_screen.dart';
import 'package:sanjeevani/features/home/screens/notification_screen.dart';
import 'package:sanjeevani/features/home/screens/patient_home_content.dart';
import 'package:sanjeevani/features/home/screens/pharmacy_home_content.dart';
import 'package:sanjeevani/features/home/screens/profile_screen.dart';
import 'package:sanjeevani/features/home/screens/search_screen.dart';
import 'package:sanjeevani/shared/widgets/bottom_nav_bar.dart';
import 'package:sanjeevani/shared/widgets/role_selector.dart';

/// The main shell after login. Holds the bottom navigation and swaps the
/// body between the five tabs. The [role] decides which home content to show.
class MainScreen extends StatefulWidget {
  final UserRole role;

  const MainScreen({super.key, required this.role});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  late final List<Widget> _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = [
      // 0 – Home (different per role)
      widget.role == UserRole.pharmacy
          ? const PharmacyHomeContent()
          : const PatientHomeContent(),
      // 1 – Search
      const SearchScreen(),
      // 2 – Add
      const AddScreen(),
      // 3 – Notifications
      const NotificationScreen(),
      // 4 – Profile
      const ProfileScreen(),
    ];
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
      bottomNavigationBar: AppBottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }
}
