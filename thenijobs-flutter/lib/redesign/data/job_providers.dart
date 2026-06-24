// ============================================================
// THENIJOBS — Mobile Redesign: Job data providers (Riverpod)
// ------------------------------------------------------------
// Thin Riverpod layer over the existing FirestoreService. Returns
// strongly-typed `Job` objects so the redesigned UI never touches
// raw maps. All reads go through the same backend the web uses.
// ============================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';
import 'package:thenijobs/shared/data/models/company_model.dart';

List<Job> _mapJobs(List<FirestoreDocument> docs) {
  final jobs = <Job>[];
  for (final doc in docs) {
    final id = (doc['id'] ?? '').toString();
    if (id.isEmpty) continue;
    try {
      jobs.add(Job.fromFirestore(doc, id));
    } catch (_) {
      // Skip malformed documents rather than failing the whole list.
    }
  }
  return jobs;
}

/// Featured jobs (home hero carousel).
final featuredJobsProvider = FutureProvider.autoDispose<List<Job>>((ref) async {
  final service = ref.watch(firestoreServiceProvider);
  final docs = await service.getJobs(
    const JobFilters(isActive: true, isFeatured: true, limitCount: 12),
  );
  return _mapJobs(docs);
});

/// Latest jobs, newest first.
final latestJobsProvider = FutureProvider.autoDispose<List<Job>>((ref) async {
  final service = ref.watch(firestoreServiceProvider);
  final docs = await service.getJobs(
    const JobFilters(isActive: true, limitCount: 40),
  );
  final jobs = _mapJobs(docs)
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  return jobs.take(20).toList();
});

/// Trending = most viewed + most applied.
final trendingJobsProvider = FutureProvider.autoDispose<List<Job>>((ref) async {
  final service = ref.watch(firestoreServiceProvider);
  final docs = await service.getJobs(
    const JobFilters(isActive: true, limitCount: 60),
  );
  final jobs = _mapJobs(docs)
    ..sort((a, b) => (b.viewCount + b.applicationsCount * 3)
        .compareTo(a.viewCount + a.applicationsCount * 3));
  return jobs.take(10).toList();
});

/// Personalised recommendations. Falls back to latest for guests.
final recommendedJobsProvider =
    FutureProvider.autoDispose<List<Job>>((ref) async {
  final service = ref.watch(firestoreServiceProvider);
  final user = ref.watch(authStateStreamProvider).value;

  if (user?.district != null && user!.district!.isNotEmpty) {
    final docs = await service.getJobs(
      JobFilters(isActive: true, district: user.district, limitCount: 20),
    );
    final jobs = _mapJobs(docs);
    if (jobs.isNotEmpty) return jobs;
  }
  // Guest / no district → newest active jobs.
  final docs = await service.getJobs(
    const JobFilters(isActive: true, limitCount: 20),
  );
  final jobs = _mapJobs(docs)
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  return jobs.take(10).toList();
});

/// Single job by id (detail screen).
final jobByIdProvider =
    FutureProvider.autoDispose.family<Job?, String>((ref, id) async {
  final service = ref.watch(firestoreServiceProvider);
  final doc = await service.getJobById(id);
  if (doc == null) return null;
  return Job.fromFirestore(doc, id);
});

/// Rich job detail: typed job + optional responsibilities/benefits arrays
/// (these are not on the typed model but may exist on the document).
class JobDetail {
  const JobDetail(this.job, this.responsibilities, this.benefits);
  final Job job;
  final List<String> responsibilities;
  final List<String> benefits;
}

final jobDetailProvider =
    FutureProvider.autoDispose.family<JobDetail?, String>((ref, id) async {
  final service = ref.watch(firestoreServiceProvider);
  final doc = await service.getJobById(id);
  if (doc == null) return null;
  final job = Job.fromFirestore(doc, id);

  List<String> strList(String key) =>
      (doc[key] as List?)
          ?.map((e) => e.toString())
          .where((e) => e.trim().isNotEmpty)
          .toList() ??
      const <String>[];

  return JobDetail(job, strList('responsibilities'), strList('benefits'));
});

/// Company by id (banner / logo / map / verified badge on detail screen).
final companyByIdProvider =
    FutureProvider.autoDispose.family<Company?, String>((ref, id) async {
  if (id.isEmpty) return null;
  final service = ref.watch(firestoreServiceProvider);
  final doc = await service.getCompanyByIdentifier(id);
  if (doc == null) return null;
  return Company.fromFirestore(doc, (doc['id'] ?? id).toString());
});

/// Similar jobs (same category, excludes current job).
final similarJobsProvider =
    FutureProvider.autoDispose.family<List<Job>, Job>((ref, job) async {
  final service = ref.watch(firestoreServiceProvider);
  final docs = await service.getJobs(
    JobFilters(isActive: true, category: job.category, limitCount: 10),
  );
  return _mapJobs(docs).where((j) => j.id != job.id).take(6).toList();
});

/// Set of jobIds the current user has saved (for bookmark state).
final savedJobIdsProvider = FutureProvider.autoDispose<Set<String>>((ref) async {
  final user = ref.watch(authStateStreamProvider).value;
  if (user == null) return <String>{};
  final service = ref.watch(firestoreServiceProvider);
  final docs = await service.getSavedJobs(user.uid);
  return docs.map((d) => (d['jobId'] ?? '').toString()).toSet();
});

// ----------------------------------------------------------------
// Search / filtered query
// ----------------------------------------------------------------

/// Immutable query key for the search results provider family.
class JobQuery {
  const JobQuery({
    this.search,
    this.category,
    this.district,
    this.jobType,
    this.experience,
    this.salaryMin,
    this.salaryMax,
  });

  final String? search;
  final String? category;
  final String? district;
  final String? jobType; // already in firestore form e.g. full_time
  final String? experience;
  final num? salaryMin;
  final num? salaryMax;

  bool get hasActiveFilters =>
      category != null ||
      district != null ||
      jobType != null ||
      experience != null ||
      salaryMin != null ||
      salaryMax != null;

  JobQuery copyWith({
    Object? search = _sentinel,
    Object? category = _sentinel,
    Object? district = _sentinel,
    Object? jobType = _sentinel,
    Object? experience = _sentinel,
    Object? salaryMin = _sentinel,
    Object? salaryMax = _sentinel,
  }) {
    return JobQuery(
      search: search == _sentinel ? this.search : search as String?,
      category: category == _sentinel ? this.category : category as String?,
      district: district == _sentinel ? this.district : district as String?,
      jobType: jobType == _sentinel ? this.jobType : jobType as String?,
      experience:
          experience == _sentinel ? this.experience : experience as String?,
      salaryMin: salaryMin == _sentinel ? this.salaryMin : salaryMin as num?,
      salaryMax: salaryMax == _sentinel ? this.salaryMax : salaryMax as num?,
    );
  }

  static const Object _sentinel = Object();

  @override
  bool operator ==(Object other) =>
      other is JobQuery &&
      other.search == search &&
      other.category == category &&
      other.district == district &&
      other.jobType == jobType &&
      other.experience == experience &&
      other.salaryMin == salaryMin &&
      other.salaryMax == salaryMax;

  @override
  int get hashCode => Object.hash(search, category, district, jobType,
      experience, salaryMin, salaryMax);
}

/// Search results for a given [JobQuery].
final searchJobsProvider =
    FutureProvider.autoDispose.family<List<Job>, JobQuery>((ref, q) async {
  final service = ref.watch(firestoreServiceProvider);
  final docs = await service.getJobs(
    JobFilters(
      isActive: true,
      category: q.category,
      district: q.district,
      jobType: q.jobType,
      search: q.search,
      limitCount: 80,
    ),
  );
  var jobs = _mapJobs(docs);

  // Client-side refinement for fields the query API doesn't filter on.
  if (q.experience != null && q.experience!.isNotEmpty) {
    jobs = jobs
        .where((j) =>
            j.experience.toLowerCase().contains(q.experience!.toLowerCase()))
        .toList();
  }
  if (q.salaryMin != null) {
    jobs = jobs
        .where((j) => (j.salaryMax ?? j.salaryMin ?? 0) >= q.salaryMin!)
        .toList();
  }
  if (q.salaryMax != null && q.salaryMax != 999999) {
    jobs = jobs
        .where((j) => (j.salaryMin ?? j.salaryMax ?? 0) <= q.salaryMax!)
        .toList();
  }
  jobs.sort((a, b) => b.createdAt.compareTo(a.createdAt));
  return jobs;
});
