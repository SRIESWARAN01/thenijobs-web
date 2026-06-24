import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:thenijobs/core/config/firebase_config.dart';

const String _functionsRegion = 'asia-south1';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp(options: FirebaseConfig.currentPlatform);
  } catch (_) {
    // Firebase may already be initialized in the background isolate.
  }
  debugPrint('Background FCM message received: ${message.messageId}');
}

class PushNotificationService {
  PushNotificationService({
    FirebaseMessaging? messaging,
    fb.FirebaseAuth? auth,
    FirebaseFunctions? functions,
  }) : _messaging = messaging ?? FirebaseMessaging.instance,
       _auth = auth ?? fb.FirebaseAuth.instance,
       _functions =
           functions ?? FirebaseFunctions.instanceFor(region: _functionsRegion);

  final FirebaseMessaging _messaging;
  final fb.FirebaseAuth _auth;
  final FirebaseFunctions _functions;

  Future<String?> initialize() async {
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    await _messaging.requestPermission(alert: true, badge: true, sound: true);
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
    FirebaseMessaging.onMessage.listen((message) {
      debugPrint(
        'Foreground FCM message received: ${message.notification?.title ?? message.messageId}',
      );
    });
    _messaging.onTokenRefresh.listen(_registerToken);
    _auth.authStateChanges().listen((user) async {
      if (user == null) return;
      await _registerToken(await _messaging.getToken());
    });

    final token = await _messaging.getToken();
    await _registerToken(token);
    return token;
  }

  Stream<RemoteMessage> get foregroundMessages => FirebaseMessaging.onMessage;

  Future<void> _registerToken(String? token) async {
    if (token == null || token.isEmpty || _auth.currentUser == null) return;
    try {
      await _functions.httpsCallable('registerFcmToken').call({
        'token': token,
        'platform': _platformName(),
      });
    } catch (e) {
      debugPrint('FCM token registration skipped: $e');
    }
  }

  String _platformName() {
    if (kIsWeb) return 'web';
    return defaultTargetPlatform.name;
  }
}
