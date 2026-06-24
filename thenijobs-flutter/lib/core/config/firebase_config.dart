// ============================================================
// THENIJOBS — Firebase Platform Configurations
// ============================================================

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class FirebaseConfig {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return const FirebaseOptions(
        apiKey: 'AIzaSyAAXHgdvKXi4pFPNGciMbZE8lPITN9Hsug',
        authDomain: 'thenijobs-9f01d.firebaseapp.com',
        projectId: 'thenijobs-9f01d',
        storageBucket: 'thenijobs-9f01d.firebasestorage.app',
        messagingSenderId: '1057136000588',
        appId: '1:1057136000588:web:12506f87f1f502596a7ee9',
        measurementId: 'G-T21WC74YFY',
      );
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return const FirebaseOptions(
          apiKey: 'AIzaSyAy1BNIoQL2pw9UAWnAyc_HJDu2i8aNSeg',
          appId: '1:1057136000588:android:0765ac24f3dc62186a7ee9',
          messagingSenderId: '1057136000588',
          projectId: 'thenijobs-9f01d',
          storageBucket: 'thenijobs-9f01d.firebasestorage.app',
        );
      case TargetPlatform.iOS:
        return const FirebaseOptions(
          apiKey: 'AIzaSyAAXHgdvKXi4pFPNGciMbZE8lPITN9Hsug',
          appId: '1:1057136000588:ios:a4d6f87b27b8764b6a7ee9',
          messagingSenderId: '1057136000588',
          projectId: 'thenijobs-9f01d',
          storageBucket: 'thenijobs-9f01d.firebasestorage.app',
          iosBundleId: 'com.thenijobs.thenijobs',
        );
      default:
        throw UnsupportedError(
          'FirebaseOptions are not supported for this platform.',
        );
    }
  }
}
