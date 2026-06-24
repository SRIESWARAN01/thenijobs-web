import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';

final platformStatsProvider = FutureProvider<PlatformStats>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service.getPlatformStats();
});

final employerStatsProvider = FutureProvider.family<EmployerStats, String>((
  ref,
  companyId,
) {
  final service = ref.watch(firestoreServiceProvider);
  return service.getEmployerStats(companyId);
});

final seekerStatsProvider = FutureProvider.family<SeekerStats, String>((
  ref,
  seekerId,
) {
  final service = ref.watch(firestoreServiceProvider);
  return service.getSeekerStats(seekerId);
});

final currentSeekerStatsProvider = FutureProvider<SeekerStats?>((ref) {
  final user = ref.watch(authStateStreamProvider).value;
  if (user == null) return Future.value(null);

  final service = ref.watch(firestoreServiceProvider);
  return service.getSeekerStats(user.uid);
});

final currentUserNotificationsProvider =
    StreamProvider<List<FirestoreDocument>>((ref) {
      final user = ref.watch(authStateStreamProvider).value;
      if (user == null) return Stream.value(const []);

      final service = ref.watch(firestoreServiceProvider);
      return service.streamNotifications(user.uid);
    });

final currentUserConversationsProvider =
    StreamProvider<List<FirestoreDocument>>((ref) {
      final user = ref.watch(authStateStreamProvider).value;
      if (user == null) return Stream.value(const []);

      final service = ref.watch(firestoreServiceProvider);
      return service.streamConversations(user.uid);
    });

final leaderboardProvider = FutureProvider<List<FirestoreDocument>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service.getLeaderboard();
});
