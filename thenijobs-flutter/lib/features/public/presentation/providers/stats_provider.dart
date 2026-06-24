// ============================================================
// THENIJOBS — Real-time Stats & Home Page Providers
// ============================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/shared/data/models/activity_log_model.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';
import 'package:thenijobs/shared/data/models/company_model.dart';
import 'package:thenijobs/shared/data/models/service_model.dart';
import 'package:thenijobs/shared/data/models/review_model.dart';
import 'package:thenijobs/shared/data/models/seeker_profile_model.dart';

Stream<int> _publicStatStream(FirestoreService service, String key) {
  return service.streamDocument('settings', 'publicStats').map((doc) {
    final value = doc?[key];
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  });
}

final activeJobsCountProvider = StreamProvider<int>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return _publicStatStream(service, 'activeJobs');
});

final totalCompaniesCountProvider = StreamProvider<int>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return _publicStatStream(service, 'totalCompanies');
});

final totalUsersCountProvider = StreamProvider<int>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return _publicStatStream(service, 'totalUsers');
});

final totalSeekersCountProvider = StreamProvider<int>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return _publicStatStream(service, 'totalSeekers');
});

final verifiedCompaniesCountProvider = StreamProvider<int>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return _publicStatStream(service, 'verifiedCompanies');
});

final liveUpdatesProvider = StreamProvider<List<ActivityLog>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamCollection(
        'activityLogs',
        orderBy: const [FirestoreOrder('timestamp', descending: true)],
        limitCount: 3,
      )
      .map(
        (docs) => docs
            .map((doc) => ActivityLog.fromFirestore(doc, doc['id'] as String))
            .toList(),
      );
});

// Stream of trending (approved & active) jobs
final trendingJobsProvider = StreamProvider<List<Job>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamCollection(
        'jobs',
        filters: const [FirestoreWhere('isActive', true)],
        limitCount: 6,
      )
      .map(
        (docs) => docs
            .map((doc) => Job.fromFirestore(doc, doc['id'] as String))
            .toList(),
      );
});

// Stream of featured & verified companies
final featuredBusinessesProvider = StreamProvider<List<Company>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamCollection(
        'companies',
        filters: const [
          FirestoreWhere('verificationStatus', 'verified'),
          FirestoreWhere('isFeatured', true),
        ],
        limitCount: 4,
      )
      .map(
        (docs) => docs
            .map((doc) => Company.fromFirestore(doc, doc['id'] as String))
            .toList(),
      );
});

// Stream of latest active services
final latestServicesProvider = StreamProvider<List<Service>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamCollection(
        'services',
        filters: const [FirestoreWhere('status', 'active')],
        limitCount: 3,
      )
      .map(
        (docs) => docs
            .map((doc) => Service.fromFirestore(doc, doc['id'] as String))
            .toList(),
      );
});

// Stream of approved community reviews
final testimonialsReviewsProvider = StreamProvider<List<Review>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service.streamCollection('reviews', limitCount: 24).map((docs) {
    return docs
        .where(
          (doc) => doc['isVerified'] == true || doc['status'] == 'approved',
        )
        .take(6)
        .map((doc) => Review.fromFirestore(doc, doc['id'] as String))
        .toList();
  });
});

// Stream of all active/approved jobs
final allJobsProvider = StreamProvider<List<Job>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamCollection(
        'jobs',
        filters: const [FirestoreWhere('isActive', true)],
      )
      .map(
        (docs) => docs
            .map((doc) => Job.fromFirestore(doc, doc['id'] as String))
            .toList(),
      );
});

// Stream of all verified companies
final allCompaniesProvider = StreamProvider<List<Company>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamCollection(
        'companies',
        filters: const [FirestoreWhere('verificationStatus', 'verified')],
      )
      .map(
        (docs) => docs
            .map((doc) => Company.fromFirestore(doc, doc['id'] as String))
            .toList(),
      );
});

// Stream of all active services
final allServicesProvider = StreamProvider<List<Service>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamCollection(
        'services',
        filters: const [FirestoreWhere('status', 'active')],
      )
      .map(
        (docs) => docs
            .map((doc) => Service.fromFirestore(doc, doc['id'] as String))
            .toList(),
      );
});

// Stream of saved job IDs for the current user
final savedJobsStreamProvider = StreamProvider<List<String>>((ref) {
  final authState = ref.watch(authStateStreamProvider);
  final user = authState.value;
  if (user == null) return Stream.value([]);
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamCollection(
        'savedJobs',
        filters: [FirestoreWhere('userId', user.uid)],
      )
      .map((docs) => docs.map((doc) => doc['jobId'] as String).toList());
});

// Stream of seeker profile for the logged in user
final seekerProfileProvider = StreamProvider<JobSeekerProfile?>((ref) {
  final authState = ref.watch(authStateStreamProvider);
  final user = authState.value;
  if (user == null) return Stream.value(null);
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamDocument('seekerProfiles', user.uid)
      .map(
        (doc) => doc == null
            ? null
            : JobSeekerProfile.fromFirestore(doc, doc['id'] as String),
      );
});

// Stream of a single job detail by ID
final jobDetailProvider = StreamProvider.family<Job?, String>((ref, jobId) {
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamDocument('jobs', jobId)
      .map(
        (doc) =>
            doc == null ? null : Job.fromFirestore(doc, doc['id'] as String),
      );
});

// Stream of a single company by ID or Slug
final companyDetailProvider = StreamProvider.family<Company?, String>((
  ref,
  identifier,
) {
  final service = ref.watch(firestoreServiceProvider);
  return service.streamDocument('companies', identifier).asyncMap((doc) async {
    if (doc != null) return Company.fromFirestore(doc, doc['id'] as String);

    final slugResults = await service.fetchCollection(
      'companies',
      filters: [FirestoreWhere('slug', identifier)],
      limitCount: 1,
    );
    if (slugResults.isEmpty) return null;
    final company = slugResults.first;
    return Company.fromFirestore(company, company['id'] as String);
  });
});

// Stream of jobs for a company
final companyJobsProvider = StreamProvider.family<List<Job>, String>((
  ref,
  companyId,
) {
  final service = ref.watch(firestoreServiceProvider);
  return service
      .streamCollection(
        'jobs',
        filters: [
          FirestoreWhere('companyId', companyId),
          const FirestoreWhere('isActive', true),
        ],
      )
      .map(
        (docs) => docs
            .map((doc) => Job.fromFirestore(doc, doc['id'] as String))
            .toList(),
      );
});

// Stream of reviews for a company
final companyReviewsProvider = StreamProvider.family<List<Review>, String>((
  ref,
  companyId,
) {
  final service = ref.watch(firestoreServiceProvider);
  return service.streamCollection('reviews').map((docs) {
    return docs
        .where((doc) {
          final matchesCompany =
              doc['targetId'] == companyId || doc['companyId'] == companyId;
          final approved =
              doc['isVerified'] == true || doc['status'] == 'approved';
          return matchesCompany && approved;
        })
        .map((doc) => Review.fromFirestore(doc, doc['id'] as String))
        .toList();
  });
});
