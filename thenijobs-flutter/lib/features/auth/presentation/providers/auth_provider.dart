// ============================================================
// THENIJOBS — Auth Riverpod Providers
// ============================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:thenijobs/features/auth/domain/repositories/auth_repository.dart';
import 'package:thenijobs/shared/data/models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl();
});

final authStateStreamProvider = StreamProvider<UserModel?>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return repository.authStateChanges;
});

class AuthStateData {
  final UserModel? user;
  final bool isLoading;
  final String? errorMessage;

  const AuthStateData({this.user, this.isLoading = false, this.errorMessage});

  AuthStateData copyWith({
    UserModel? user,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthStateData(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthStateData> {
  static const String demoEmail = AuthRepositoryImpl.demoEmail;
  static const String demoPassword = AuthRepositoryImpl.demoPassword;
  static const bool demoLoginEnabled = AuthRepositoryImpl.demoLoginEnabled;

  final AuthRepository _repository;
  final Ref _ref;

  AuthNotifier(this._repository, this._ref) : super(const AuthStateData()) {
    // Listen to firestore stream to update current user state
    _ref.listen(authStateStreamProvider, (previous, next) {
      next.when(
        data: (user) {
          state = state.copyWith(user: user, isLoading: false);
        },
        error: (err, stack) {
          state = state.copyWith(
            errorMessage: err.toString(),
            isLoading: false,
          );
        },
        loading: () {
          state = state.copyWith(isLoading: true);
        },
      );
    });
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  Future<void> signIn(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.signInWithEmail(email, password);
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      rethrow;
    }
  }

  Future<void> signInWithDemoAccount() async {
    if (!demoLoginEnabled) {
      const message = 'Demo login is disabled for this build.';
      state = state.copyWith(errorMessage: message, isLoading: false);
      throw StateError(message);
    }
    await signIn(demoEmail, demoPassword);
  }

  Future<void> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.signInWithGoogle();
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      rethrow;
    }
  }

  Future<void> sendPasswordResetEmail(String email) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.sendPasswordResetEmail(email);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      rethrow;
    }
  }

  Future<String> sendOtp(String phone) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final verificationId = await _repository.sendPhoneOTP(phone);
      state = state.copyWith(isLoading: false);
      return verificationId;
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      rethrow;
    }
  }

  Future<void> verifyOtp(String verificationId, String code) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.verifyPhoneOTP(verificationId, code);
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      rethrow;
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String displayName,
    required String role,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.createAccount(
        email: email,
        password: password,
        displayName: displayName,
        role: role,
        phone: phone,
      );
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      rethrow;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.logout();
      state = const AuthStateData();
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e), isLoading: false);
      rethrow;
    }
  }

  String _parseError(dynamic error) {
    if (error is String) return error;
    try {
      return error.message ?? error.toString();
    } catch (_) {
      return error.toString();
    }
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthStateData>(
  (ref) {
    final repository = ref.watch(authRepositoryProvider);
    return AuthNotifier(repository, ref);
  },
);
