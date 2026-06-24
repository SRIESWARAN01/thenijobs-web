import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:thenijobs/features/auth/domain/repositories/auth_repository.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/features/auth/presentation/screens/login_screen.dart';
import 'package:thenijobs/core/widgets/premium_splash.dart';
import 'package:thenijobs/shared/data/models/user_model.dart';

class FakeAuthRepository implements AuthRepository {
  final StreamController<UserModel?> _controller =
      StreamController<UserModel?>.broadcast();

  @override
  Stream<UserModel?> get authStateChanges => _controller.stream;

  @override
  UserModel? get currentUser => null;

  @override
  Future<void> createAccount({
    required String email,
    required String password,
    required String displayName,
    required String role,
    String? phone,
  }) async {}

  @override
  Future<void> logout() async {}

  @override
  Future<void> sendPasswordResetEmail(String email) async {}

  @override
  Future<String> sendPhoneOTP(String phoneNumber) async => 'test-verification';

  @override
  Future<void> signInWithEmail(String email, String password) async {}

  @override
  Future<void> signInWithGoogle() async {}

  @override
  Future<void> verifyPhoneOTP(String verificationId, String smsCode) async {}

  Future<void> dispose() => _controller.close();
}

void main() {
  testWidgets('Login screen supports email and mobile OTP modes', (
    WidgetTester tester,
  ) async {
    final authRepository = FakeAuthRepository();
    addTearDown(authRepository.dispose);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [authRepositoryProvider.overrideWithValue(authRepository)],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );
    await tester.pump();

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.textContaining('Mobile OTP'), findsOneWidget);

    await tester.tap(find.textContaining('Mobile OTP'));
    await tester.pumpAndSettle();

    expect(find.text('Mobile Number'), findsOneWidget);
    expect(find.text('Send OTP'), findsOneWidget);
  });

  testWidgets('Premium splash shows intro animation before app content', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: PremiumSplash(
          duration: Duration(milliseconds: 50),
          child: Center(child: Text('Home Ready')),
        ),
      ),
    );

    expect(find.byKey(const ValueKey('premium-splash')), findsOneWidget);
    expect(find.text('THENIJOBS'), findsOneWidget);
    expect(find.text('Home Ready'), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 60));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('premium-splash')), findsNothing);
    expect(find.text('Home Ready'), findsOneWidget);
  });
}
