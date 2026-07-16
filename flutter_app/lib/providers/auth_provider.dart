import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/models/user.dart';
import 'package:thenijobs/services/auth_service.dart';

class AuthState {
  final AppUser? user;
  final bool isLoading;
  final String? errorMessage;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.errorMessage,
  });

  AuthState copyWith({
    AppUser? user,
    bool? isLoading,
    String? errorMessage,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AuthState()) {
    // Listen to Firebase Auth state changes
    _authService.authStateChanges.listen((appUser) {
      state = AuthState(user: appUser, isLoading: false);
    });
  }

  Future<void> loginWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await _authService.signInWithEmail(email, password);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> sendOtp(String phoneNumber) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await _authService.sendOtp(phoneNumber);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> verifyOtp(String phoneNumber, String code) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await _authService.verifyOtpAndSignIn(phoneNumber, code);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> loginWithGoogle() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await _authService.signInWithGoogle();
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await _authService.signOut();
      state = const AuthState();
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> registerWithEmail(String email, String password, String displayName, UserRole role) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await _authService.registerWithEmail(
        email: email,
        password: password,
        displayName: displayName,
        role: role,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }
}

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});
