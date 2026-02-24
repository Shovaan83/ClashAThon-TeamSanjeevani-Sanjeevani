import 'package:flutter/material.dart';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: _tabs[_currentIndex]),
      bottomNavigationBar: AppBottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }
}
