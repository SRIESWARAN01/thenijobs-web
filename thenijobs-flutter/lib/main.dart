// ============================================================
// THENIJOBS — App Entry Point
// ============================================================

import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:thenijobs/core/config/firebase_config.dart';
import 'package:thenijobs/core/routes/app_router.dart';
import 'package:thenijobs/core/services/analytics_service.dart';
import 'package:thenijobs/core/services/push_notification_service.dart';
import 'package:thenijobs/core/widgets/premium_splash.dart';
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';

void main() async {
  // Ensure Flutter engine bindings are fully initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase using custom options configuration
  await Firebase.initializeApp(options: FirebaseConfig.currentPlatform);
  FirebaseFirestore.instance.settings = const Settings(
    persistenceEnabled: true,
  );

  // Initialize Hive for local persistent caching/settings
  await Hive.initFlutter();
  await Hive.openBox('settings');

  runApp(const ProviderScope(child: MyApp()));
  unawaited(_initializeIntegrations());
}

Future<void> _initializeIntegrations() async {
  try {
    final token = await PushNotificationService().initialize();
    debugPrint(
      'FCM initialized: ${token == null ? 'no token' : 'token ready'}',
    );
  } catch (e) {
    debugPrint('Push initialization skipped: $e');
  }

  try {
    await AnalyticsService().event('app_open', {'surface': 'mobile'});
  } catch (e) {
    debugPrint('Analytics initialization skipped: $e');
  }
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'TheNiJobs',
      theme: AppX.theme(),
      themeMode: ThemeMode.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      // Clamp the OS text-scale so very large accessibility font sizes
      // cannot break tight mobile layouts (overflow), while still
      // honouring user preferences within a safe range.
      builder: (context, child) {
        final mediaQuery = MediaQuery.of(context);
        final clampedTextScaler = mediaQuery.textScaler.clamp(
          minScaleFactor: 0.85,
          maxScaleFactor: 1.2,
        );
        return MediaQuery(
          data: mediaQuery.copyWith(textScaler: clampedTextScaler),
          child: PremiumSplash(child: child ?? const SizedBox.shrink()),
        );
      },
    );
  }
}

class AppBackNavigationGuard extends StatefulWidget {
  const AppBackNavigationGuard({
    super.key,
    required this.router,
    required this.child,
  });

  final GoRouter router;
  final Widget child;

  @override
  State<AppBackNavigationGuard> createState() => _AppBackNavigationGuardState();
}

class _AppBackNavigationGuardState extends State<AppBackNavigationGuard> {
  DateTime? _lastHomeBackPress;

  Future<bool> _handleBackButton() async {
    final currentUri = widget.router.routeInformationProvider.value.uri;
    final currentPath = currentUri.path.isEmpty ? '/' : currentUri.path;

    if (widget.router.canPop()) {
      widget.router.pop();
      return true;
    }

    if (currentPath != '/') {
      widget.router.go('/');
      return true;
    }

    final now = DateTime.now();
    final pressedAgain =
        _lastHomeBackPress != null &&
        now.difference(_lastHomeBackPress!) < const Duration(seconds: 2);

    if (pressedAgain) {
      return false;
    }

    _lastHomeBackPress = now;
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger != null) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(content: Text('Press back again to exit')),
        );
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return BackButtonListener(
      onBackButtonPressed: _handleBackButton,
      child: widget.child,
    );
  }
}
