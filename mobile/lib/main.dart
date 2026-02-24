import 'package:flutter/material.dart';
import 'package:sanjeevani/app.dart';
import 'package:sanjeevani/core/service/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService().init(); // restore saved JWT token
  runApp(const MyApp());
}