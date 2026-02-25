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

  // Initialise FCM (requests permission, registers device token)
  await FcmService.instance.init();

  runApp(
    ChangeNotifierProvider(
      create: (_) => NotificationProvider(),
      child: const MyApp(),
    ),
  );
}
