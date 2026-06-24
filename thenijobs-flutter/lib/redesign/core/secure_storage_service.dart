// ============================================================
// THENIJOBS — Mobile Redesign: Secure storage (Phase 10)
// ------------------------------------------------------------
// Wraps flutter_secure_storage (Keystore / Keychain backed) for
// sensitive values: auth/session hints, cached identifiers, and
// any short-lived tokens. Firebase manages its own ID-token
// refresh; this exists for app-level secrets and a single source
// of truth for "remember me" style data.
// ============================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  final FlutterSecureStorage _storage;

  static const _kSessionUid = 'session_uid';
  static const _kFcmToken = 'fcm_token';
  static const _kOnboarded = 'onboarded';

  Future<void> write(String key, String value) => _storage.write(key: key, value: value);
  Future<String?> read(String key) => _storage.read(key: key);
  Future<void> delete(String key) => _storage.delete(key: key);
  Future<void> clear() => _storage.deleteAll();

  Future<void> setSessionUid(String uid) => write(_kSessionUid, uid);
  Future<String?> getSessionUid() => read(_kSessionUid);
  Future<void> setFcmToken(String token) => write(_kFcmToken, token);
  Future<String?> getFcmToken() => read(_kFcmToken);

  Future<void> setOnboarded() => write(_kOnboarded, 'true');
  Future<bool> isOnboarded() async => (await read(_kOnboarded)) == 'true';
}
