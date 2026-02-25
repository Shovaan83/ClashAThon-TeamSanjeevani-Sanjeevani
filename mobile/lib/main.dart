import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:sanjeevani/app.dart';
import 'package:sanjeevani/core/providers/notification_provider.dart';
import 'package:sanjeevani/core/service/api_service.dart';
import 'package:sanjeevani/core/service/fcm_service.dart';
import 'package:sanjeevani/firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  await ApiService().init(); // restore saved JWT token

  // ── Firebase ───────────────────────────────────────────────
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  // Register the background message handler (must be top-level function)
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  // NOTE: FcmService.instance.init() is called from MainScreen.initState()
  // AFTER login, when a JWT token is available for device-token registration.

  runApp(
    ChangeNotifierProvider(
      create: (_) => NotificationProvider(),
      child: const MyApp(),
    ),
  );
}
