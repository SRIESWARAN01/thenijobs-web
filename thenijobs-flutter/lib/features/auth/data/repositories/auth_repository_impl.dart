// ============================================================
// THENIJOBS — Auth Repository Implementation
// ============================================================

import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:thenijobs/core/services/platform_actions_service.dart';
import 'package:thenijobs/features/auth/domain/repositories/auth_repository.dart';
import 'package:thenijobs/shared/data/models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  static const String _webGoogleClientId =
      '1057136000588-25l3iapj7mhdcg7gekb31pppggg1h5o1.apps.googleusercontent.com';
  static const String demoEmail = 'demo@thenijobs.com';
  static const String demoPassword = 'Demo@123';
  static const bool demoLoginEnabled = bool.fromEnvironment(
    'THENIJOBS_ENABLE_DEMO_LOGIN',
    defaultValue: false,
  );

  final fb.FirebaseAuth _firebaseAuth;
  final FirebaseFirestore _firestore;
  final GoogleSignIn _googleSignIn;
  final PlatformActionsService _platformActions;

  UserModel? _cachedUser;
  bool _isDemoSession = false;
  final StreamController<UserModel?> _demoAuthController =
      StreamController<UserModel?>.broadcast();

  AuthRepositoryImpl({
    fb.FirebaseAuth? firebaseAuth,
    FirebaseFirestore? firestore,
    GoogleSignIn? googleSignIn,
    PlatformActionsService? platformActions,
  }) : _firebaseAuth = firebaseAuth ?? fb.FirebaseAuth.instance,
       _firestore = firestore ?? FirebaseFirestore.instance,
       _googleSignIn =
           googleSignIn ??
           GoogleSignIn(clientId: kIsWeb ? _webGoogleClientId : null),
       _platformActions = platformActions ?? PlatformActionsService();

  @override
  Stream<UserModel?> get authStateChanges {
    final controller = StreamController<UserModel?>();
    StreamSubscription<UserModel?>? firebaseSubscription;
    StreamSubscription<UserModel?>? demoSubscription;

    controller.onListen = () {
      controller.add(_cachedUser);

      firebaseSubscription = _firebaseAuth
          .authStateChanges()
          .asyncMap((fbUser) async {
            if (_isDemoSession) {
              return _cachedUser;
            }
            if (fbUser == null) {
              _cachedUser = null;
              return null;
            }
            return _fetchUserModel(fbUser.uid);
          })
          .listen((user) {
            if (!controller.isClosed) {
              controller.add(user);
            }
          }, onError: controller.addError);

      demoSubscription = _demoAuthController.stream.listen((user) {
        if (!controller.isClosed) {
          controller.add(user);
        }
      }, onError: controller.addError);
    };

    controller.onCancel = () async {
      await firebaseSubscription?.cancel();
      await demoSubscription?.cancel();
    };

    return controller.stream;
  }

  @override
  UserModel? get currentUser => _cachedUser;

  UserModel _buildDemoUser() {
    return UserModel(
      uid: 'demo-seeker',
      email: demoEmail,
      displayName: 'Demo Job Seeker',
      phone: '+919876543210',
      role: UserRole.jobSeeker,
      district: 'Demo District',
      preferences: UserPreferences(
        openToWork: true,
        jobTypes: const ['Full-time', 'Part-time'],
        locations: const ['Tamil Nadu', 'Remote'],
        expectedSalary: 300000,
      ),
      isVerified: true,
      lastLoginAt: DateTime.now(),
      createdAt: DateTime(2026, 1, 1),
      updatedAt: DateTime.now(),
    );
  }

  bool _matchesDemoCredentials(String email, String password) {
    return demoLoginEnabled &&
        email.trim().toLowerCase() == demoEmail &&
        password == demoPassword;
  }

  Future<UserModel?> _fetchUserModel(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (doc.exists && doc.data() != null) {
        _cachedUser = UserModel.fromFirestore(doc.data()!, uid);
        return _cachedUser;
      }
      return null;
    } catch (e) {
      // Fallback or log error
      return null;
    }
  }

  Future<void> _syncMobileVerificationIfPossible() async {
    try {
      await _platformActions.syncMobileVerification();
    } catch (_) {
      // Keep auth usable even if callable functions are not deployed locally.
    }
  }

  @override
  Future<void> signInWithEmail(String email, String password) async {
    if (_matchesDemoCredentials(email, password)) {
      _isDemoSession = true;
      _cachedUser = _buildDemoUser();
      await _firebaseAuth.signOut();
      await _googleSignIn.signOut();
      _demoAuthController.add(_cachedUser);
      return;
    }

    _isDemoSession = false;
    await _firebaseAuth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    // Trigger cache refresh
    final fbUser = _firebaseAuth.currentUser;
    if (fbUser != null) {
      await _fetchUserModel(fbUser.uid);
    }
  }

  @override
  Future<void> signInWithGoogle() async {
    _isDemoSession = false;
    final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
    if (googleUser == null) {
      throw fb.FirebaseAuthException(
        code: 'ERROR_ABORTED_BY_USER',
        message: 'Sign in aborted by user',
      );
    }

    final GoogleSignInAuthentication googleAuth =
        await googleUser.authentication;
    final fb.AuthCredential credential = fb.GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final fb.UserCredential userCredential = await _firebaseAuth
        .signInWithCredential(credential);
    final fb.User? fbUser = userCredential.user;

    if (fbUser != null) {
      // Seed Firestore document if first time
      final doc = await _firestore.collection('users').doc(fbUser.uid).get();
      if (!doc.exists) {
        final newUser = UserModel(
          uid: fbUser.uid,
          email: fbUser.email ?? '',
          displayName: fbUser.displayName ?? '',
          photoURL: fbUser.photoURL,
          phone: fbUser.phoneNumber,
          role: UserRole.jobSeeker,
          isVerified: fbUser.emailVerified,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        await _firestore
            .collection('users')
            .doc(fbUser.uid)
            .set(newUser.toFirestore());
      }
      await _fetchUserModel(fbUser.uid);
    }
  }

  @override
  Future<void> sendPasswordResetEmail(String email) async {
    await _firebaseAuth.sendPasswordResetEmail(email: email);
  }

  @override
  Future<String> sendPhoneOTP(String phoneNumber) async {
    _isDemoSession = false;
    final completer = Completer<String>();

    await _firebaseAuth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (fb.PhoneAuthCredential credential) async {
        await _firebaseAuth.signInWithCredential(credential);
        final fbUser = _firebaseAuth.currentUser;
        if (fbUser != null) {
          await _syncMobileVerificationIfPossible();
          await _fetchUserModel(fbUser.uid);
          if (!completer.isCompleted) {
            completer.complete('');
          }
        }
      },
      verificationFailed: (fb.FirebaseAuthException e) {
        if (!completer.isCompleted) {
          completer.completeError(e);
        }
      },
      codeSent: (String verificationId, int? resendToken) {
        if (!completer.isCompleted) {
          completer.complete(verificationId);
        }
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        // Handle timeout if needed
      },
    );

    return completer.future;
  }

  @override
  Future<void> verifyPhoneOTP(String verificationId, String smsCode) async {
    _isDemoSession = false;
    final fb.AuthCredential credential = fb.PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );

    final fb.UserCredential userCredential = await _firebaseAuth
        .signInWithCredential(credential);
    final fb.User? fbUser = userCredential.user;

    if (fbUser != null) {
      // Seed Firestore doc if first-time phone sign-in
      final docSnapshot = await _firestore
          .collection('users')
          .doc(fbUser.uid)
          .get();
      if (!docSnapshot.exists) {
        final newUser = UserModel(
          uid: fbUser.uid,
          email: '',
          displayName: fbUser.phoneNumber ?? 'User',
          phone: fbUser.phoneNumber,
          role: UserRole.jobSeeker,
          isVerified: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        await _firestore
            .collection('users')
            .doc(fbUser.uid)
            .set(newUser.toFirestore());
      }
      await _syncMobileVerificationIfPossible();
      await _fetchUserModel(fbUser.uid);
    }
  }

  @override
  Future<void> createAccount({
    required String email,
    required String password,
    required String displayName,
    required String role,
    String? phone,
  }) async {
    _isDemoSession = false;
    final fb.UserCredential cred = await _firebaseAuth
        .createUserWithEmailAndPassword(email: email, password: password);
    final fb.User? fbUser = cred.user;

    if (fbUser != null) {
      await fbUser.updateDisplayName(displayName);

      final newUser = UserModel(
        uid: fbUser.uid,
        email: email,
        displayName: displayName,
        phone: phone,
        role: UserRole.fromString(role),
        isVerified: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await _firestore
          .collection('users')
          .doc(fbUser.uid)
          .set(newUser.toFirestore());
      await _fetchUserModel(fbUser.uid);
    }
  }

  @override
  Future<void> logout() async {
    if (_isDemoSession) {
      _isDemoSession = false;
      _cachedUser = null;
      _demoAuthController.add(null);
      return;
    }

    await _firebaseAuth.signOut();
    await _googleSignIn.signOut();
    _cachedUser = null;
  }
}
