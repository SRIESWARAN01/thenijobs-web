// ============================================================
// THENIJOBS — Mobile Redesign: Employer dashboard
// Stats · post / edit job · manage jobs · view applications ·
// download resumes · update candidate status.
// ============================================================

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thenijobs/core/constants/app_constants.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/core/providers/firestore_data_providers.dart';
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';
import 'package:thenijobs/redesign/widgets/ui_kit.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';

// ---------------- Providers ----------------

final employerCompanyProvider = FutureProvider.autoDispose<FirestoreDocument?>((
  ref,
) async {
  final user = ref.watch(authStateStreamProvider).value;
  if (user == null) return null;
  return ref.watch(firestoreServiceProvider).getCompanyByOwner(user.uid);
});

final employerJobsProvider = FutureProvider.autoDispose
    .family<List<Job>, String>((ref, companyId) async {
      final docs = await ref
          .watch(firestoreServiceProvider)
          .getJobs(JobFilters(companyId: companyId, limitCount: 100));
      return docs
          .map((d) => Job.fromFirestore(d, (d['id'] ?? '').toString()))
          .where((j) => j.id.isNotEmpty)
          .toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    });

final jobApplicationsProvider = FutureProvider.autoDispose
    .family<List<FirestoreDocument>, String>((ref, jobId) async {
      return ref
          .watch(firestoreServiceProvider)
          .getApplications(ApplicationFilters(jobId: jobId));
    });

// ====================================================================
// DASHBOARD
// ====================================================================

class EmployerDashboardM3 extends ConsumerWidget {
  const EmployerDashboardM3({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final companyAsync = ref.watch(employerCompanyProvider);

    return Scaffold(
      backgroundColor: AppX.bg,
      appBar: AppBar(
        title: const Text('Employer'),
        actions: [
          IconButton(
            icon: const Icon(Icons.home_outlined),
            onPressed: () => context.go('/'),
          ),
        ],
      ),
      body: companyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) =>
            ErrorRetry(onRetry: () => ref.invalidate(employerCompanyProvider)),
        data: (company) {
          if (company == null) {
            return EmptyState(
              icon: Icons.business_outlined,
              title: 'Register your company',
              message:
                  'Create a company profile to post jobs, manage applications and hire candidates.',
              actionLabel: 'Register company',
              onAction: () => context.push('/company/register'),
            );
          }
          final companyId = (company['id'] ?? '').toString();
          final companyName = (company['name'] ?? 'Your company').toString();
          final stats = ref.watch(employerStatsProvider(companyId)).value;

          return RefreshIndicator(
            color: AppX.primary,
            onRefresh: () async {
              ref.invalidate(employerStatsProvider(companyId));
              ref.invalidate(employerJobsProvider(companyId));
            },
            child: ListView(
              padding: const EdgeInsets.only(bottom: 28),
              children: [
                // Company header
                Container(
                  margin: const EdgeInsets.all(AppX.s16),
                  padding: const EdgeInsets.all(AppX.s16),
                  decoration: BoxDecoration(
                    gradient: AppX.heroGradient,
                    borderRadius: BorderRadius.circular(AppX.rLg),
                    boxShadow: AppX.softShadow,
                  ),
                  child: Row(
                    children: [
                      CompanyLogo(
                        url: company['logoUrl'] as String?,
                        name: companyName,
                        size: 52,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              companyName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              (company['verificationStatus'] ?? 'pending')
                                          .toString() ==
                                      'verified'
                                  ? 'Verified employer'
                                  : 'Verification pending',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontSize: 12.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Stats grid
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppX.s16),
                  child: GridView.count(
                    crossAxisCount: 3,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.0,
                    children: [
                      _statCard(
                        'Active jobs',
                        stats?.activeJobs,
                        Icons.work_outline_rounded,
                        AppX.primary,
                      ),
                      _statCard(
                        'Applicants',
                        stats?.totalApplications,
                        Icons.group_outlined,
                        AppX.violet,
                      ),
                      _statCard(
                        'Shortlisted',
                        stats?.shortlisted,
                        Icons.star_outline_rounded,
                        AppX.amber,
                      ),
                      _statCard(
                        'Interviews',
                        stats?.interviews,
                        Icons.event_outlined,
                        AppX.accent,
                      ),
                      _statCard(
                        'Hired',
                        stats?.hired,
                        Icons.verified_outlined,
                        AppX.emerald,
                      ),
                      _statCard(
                        'Profile views',
                        stats?.profileViews,
                        Icons.visibility_outlined,
                        AppX.rose,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                // Quick actions
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppX.s16),
                  child: Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.add_rounded),
                          label: const Text('Post a job'),
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => PostJobScreenM3(
                                companyId: companyId,
                                companyName: companyName,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.list_alt_rounded),
                          label: const Text('My jobs'),
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => EmployerJobsScreenM3(
                                companyId: companyId,
                                companyName: companyName,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const SectionHeader(
                  title: 'Recent jobs',
                  icon: Icons.history_rounded,
                ),
                _recentJobs(context, ref, companyId, companyName),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _statCard(String label, int? value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: AppX.card(),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(
            value?.toString() ?? '–',
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 18,
              color: AppX.textPrimary,
            ),
          ),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: AppX.textTertiary, fontSize: 10.5),
          ),
        ],
      ),
    );
  }

  Widget _recentJobs(
    BuildContext context,
    WidgetRef ref,
    String companyId,
    String companyName,
  ) {
    final jobsAsync = ref.watch(employerJobsProvider(companyId));
    return jobsAsync.when(
      loading: () => const JobListSkeleton(count: 2),
      error: (e, s) => const SizedBox.shrink(),
      data: (jobs) {
        if (jobs.isEmpty) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: EmptyState(
              title: 'No jobs posted yet',
              icon: Icons.post_add_rounded,
            ),
          );
        }
        return Column(
          children: jobs
              .take(5)
              .map(
                (j) => _EmployerJobTile(
                  job: j,
                  companyName: companyName,
                  companyId: companyId,
                ),
              )
              .toList(),
        );
      },
    );
  }
}

// ====================================================================
// EMPLOYER JOB TILE (manage)
// ====================================================================

class _EmployerJobTile extends ConsumerWidget {
  const _EmployerJobTile({
    required this.job,
    required this.companyName,
    required this.companyId,
  });
  final Job job;
  final String companyName;
  final String companyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppX.s16, vertical: 6),
      padding: const EdgeInsets.all(AppX.s16),
      decoration: AppX.card(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      job.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      '${job.applicationsCount} applicants · ${relativeTime(job.createdAt)}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: AppX.pill(
                  color: job.isActive ? AppX.emerald : AppX.textTertiary,
                ),
                child: Text(
                  job.isActive ? 'Active' : 'Inactive',
                  style: TextStyle(
                    color: job.isActive ? AppX.emerald : AppX.textTertiary,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _action(Icons.people_alt_outlined, 'Applicants', () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) =>
                        ApplicationsScreen(jobId: job.id, jobTitle: job.title),
                  ),
                );
              }),
              _action(Icons.edit_outlined, 'Edit', () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => PostJobScreenM3(
                      companyId: companyId,
                      companyName: companyName,
                      existing: job,
                    ),
                  ),
                );
              }),
              _action(
                job.isActive
                    ? Icons.pause_circle_outline
                    : Icons.play_circle_outline,
                job.isActive ? 'Pause' : 'Activate',
                () async {
                  await ref.read(firestoreServiceProvider).updateDocument(
                    'jobs',
                    job.id,
                    {'isActive': !job.isActive},
                  );
                  ref.invalidate(employerJobsProvider(companyId));
                },
              ),
              _action(Icons.delete_outline_rounded, 'Delete', () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Delete job?'),
                    content: const Text(
                      'This permanently removes the job posting.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text(
                          'Delete',
                          style: TextStyle(color: AppX.rose),
                        ),
                      ),
                    ],
                  ),
                );
                if (ok == true) {
                  await ref
                      .read(firestoreServiceProvider)
                      .deleteDocument('jobs', job.id);
                  ref.invalidate(employerJobsProvider(companyId));
                }
              }, color: AppX.rose),
            ],
          ),
        ],
      ),
    );
  }

  Widget _action(
    IconData icon,
    String label,
    VoidCallback onTap, {
    Color color = AppX.primary,
  }) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ====================================================================
// MY JOBS
// ====================================================================

class EmployerJobsScreenM3 extends ConsumerWidget {
  const EmployerJobsScreenM3({
    super.key,
    required this.companyId,
    required this.companyName,
  });
  final String companyId;
  final String companyName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobs = ref.watch(employerJobsProvider(companyId));
    return Scaffold(
      backgroundColor: AppX.bg,
      appBar: AppBar(title: const Text('My jobs')),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppX.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Post job'),
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) =>
                PostJobScreenM3(companyId: companyId, companyName: companyName),
          ),
        ),
      ),
      body: jobs.when(
        loading: () => const JobListSkeleton(),
        error: (e, s) => ErrorRetry(
          onRetry: () => ref.invalidate(employerJobsProvider(companyId)),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.post_add_rounded,
              title: 'No jobs yet',
              message: 'Post your first job to start receiving applications.',
            );
          }
          return ListView(
            padding: const EdgeInsets.symmetric(vertical: 8),
            children: list
                .map(
                  (j) => _EmployerJobTile(
                    job: j,
                    companyName: companyName,
                    companyId: companyId,
                  ),
                )
                .toList(),
          );
        },
      ),
    );
  }
}

// ====================================================================
// APPLICATIONS
// ====================================================================

class ApplicationsScreen extends ConsumerWidget {
  const ApplicationsScreen({
    super.key,
    required this.jobId,
    required this.jobTitle,
  });
  final String jobId;
  final String jobTitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apps = ref.watch(jobApplicationsProvider(jobId));
    return Scaffold(
      backgroundColor: AppX.bg,
      appBar: AppBar(
        title: const Text('Applicants'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(28),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(AppX.s16, 0, AppX.s16, 10),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                jobTitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ),
        ),
      ),
      body: apps.when(
        loading: () => const JobListSkeleton(),
        error: (e, s) => ErrorRetry(
          onRetry: () => ref.invalidate(jobApplicationsProvider(jobId)),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              icon: Icons.people_outline_rounded,
              title: 'No applicants yet',
              message: 'Applications for this job will show up here.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppX.s16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) =>
                _ApplicationCard(app: items[i], jobId: jobId),
          );
        },
      ),
    );
  }
}

class _ApplicationCard extends ConsumerWidget {
  const _ApplicationCard({required this.app, required this.jobId});
  final FirestoreDocument app;
  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = (app['seekerName'] ?? 'Candidate').toString();
    final status = (app['status'] ?? 'applied').toString();
    final resumeUrl = (app['resumeUrl'] ?? '').toString();
    final email = (app['seekerEmail'] ?? '').toString();
    final phone = (app['seekerPhone'] ?? '').toString();
    final appId = (app['id'] ?? '').toString();

    Future<void> setStatus(String s) async {
      try {
        await ref
            .read(firestoreServiceProvider)
            .updateApplicationStatus(appId, s);
        ref.invalidate(jobApplicationsProvider(jobId));
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Marked as ${s.replaceAll('_', ' ')}')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Update failed: $e')));
        }
      }
    }

    return Container(
      padding: const EdgeInsets.all(AppX.s16),
      decoration: AppX.card(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CompanyLogo(name: name, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: Theme.of(context).textTheme.titleMedium),
                    if (email.isNotEmpty || phone.isNotEmpty)
                      Text(
                        [email, phone].where((e) => e.isNotEmpty).join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: AppX.pill(color: AppX.primary),
                child: Text(
                  status.replaceAll('_', ' '),
                  style: const TextStyle(
                    color: AppX.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (resumeUrl.isNotEmpty)
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 40),
                  ),
                  icon: const Icon(Icons.description_outlined, size: 16),
                  label: const Text('Resume'),
                  onPressed: () async {
                    final uri = Uri.parse(resumeUrl);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(
                        uri,
                        mode: LaunchMode.externalApplication,
                      );
                    }
                  },
                ),
              const Spacer(),
              PopupMenuButton<String>(
                onSelected: setStatus,
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'shortlisted', child: Text('Shortlist')),
                  PopupMenuItem(
                    value: 'interview_scheduled',
                    child: Text('Schedule interview'),
                  ),
                  PopupMenuItem(
                    value: 'selected',
                    child: Text('Select / Hire'),
                  ),
                  PopupMenuItem(value: 'rejected', child: Text('Reject')),
                ],
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 9,
                  ),
                  decoration: BoxDecoration(
                    color: AppX.primary,
                    borderRadius: BorderRadius.circular(AppX.rSm),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Update status',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(
                        Icons.arrow_drop_down_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ====================================================================
// POST / EDIT JOB
// ====================================================================

class PostJobScreenM3 extends ConsumerStatefulWidget {
  const PostJobScreenM3({
    super.key,
    required this.companyId,
    required this.companyName,
    this.existing,
  });
  final String companyId;
  final String companyName;
  final Job? existing;

  @override
  ConsumerState<PostJobScreenM3> createState() => _PostJobScreenM3State();
}

class _PostJobScreenM3State extends ConsumerState<PostJobScreenM3> {
  final _title = TextEditingController();
  final _location = TextEditingController();
  final _salaryMin = TextEditingController();
  final _salaryMax = TextEditingController();
  final _education = TextEditingController();
  final _openings = TextEditingController(text: '1');
  final _description = TextEditingController();
  final _requirements = TextEditingController();
  final _skills = TextEditingController();

  String _category = AppConstants.jobCategories.first;
  String _district = AppConstants.tnDistricts.first;
  String _jobType = 'full_time';
  String _experience = AppConstants.experienceLevels.first;
  DateTime? _deadline;
  bool _urgent = false;
  bool _saving = false;

  static const _jobTypes = {
    'full_time': 'Full-time',
    'part_time': 'Part-time',
    'internship': 'Internship',
    'remote': 'Remote',
    'work_from_home': 'Work from home',
    'contract': 'Contract',
    'fresher': 'Fresher',
  };

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    if (e != null) {
      _title.text = e.title;
      _location.text = e.location;
      _salaryMin.text = e.salaryMin?.toStringAsFixed(0) ?? '';
      _salaryMax.text = e.salaryMax?.toStringAsFixed(0) ?? '';
      _education.text = e.education ?? '';
      _openings.text = e.openings.toString();
      _description.text = e.description;
      _requirements.text = e.requirements.join('\n');
      _skills.text = e.skills.join(', ');
      if (AppConstants.jobCategories.contains(e.category)) {
        _category = e.category;
      }
      if (AppConstants.tnDistricts.contains(e.district)) {
        _district = e.district;
      }
      _jobType = e.jobType.toJson();
      if (AppConstants.experienceLevels.contains(e.experience)) {
        _experience = e.experience;
      }
      _deadline = e.deadline;
      _urgent = e.isUrgent;
    }
  }

  @override
  void dispose() {
    for (final c in [
      _title,
      _location,
      _salaryMin,
      _salaryMax,
      _education,
      _openings,
      _description,
      _requirements,
      _skills,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  List<String> _splitLines(String s) =>
      s.split('\n').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
  List<String> _splitCommas(String s) =>
      s.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();

  Future<void> _submit() async {
    if (_title.text.trim().isEmpty || _description.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Title and description are required')),
      );
      return;
    }
    setState(() => _saving = true);
    final user = ref.read(authStateStreamProvider).value;
    final data = <String, dynamic>{
      'title': _title.text.trim(),
      'companyId': widget.companyId,
      'companyName': widget.companyName,
      'category': _category,
      'district': _district,
      'location': _location.text.trim().isEmpty
          ? _district
          : _location.text.trim(),
      'jobType': _jobType,
      'experience': _experience,
      'education': _education.text.trim(),
      'openings': int.tryParse(_openings.text.trim()) ?? 1,
      'description': _description.text.trim(),
      'requirements': _splitLines(_requirements.text),
      'skills': _splitCommas(_skills.text),
      'salaryMin': double.tryParse(_salaryMin.text.trim()),
      'salaryMax': double.tryParse(_salaryMax.text.trim()),
      'isUrgent': _urgent,
      'isActive': true,
      'status': 'active',
      'postedBy': user?.uid ?? '',
    };
    if (_deadline != null) data['deadline'] = Timestamp.fromDate(_deadline!);

    try {
      final service = ref.read(firestoreServiceProvider);
      if (_isEdit) {
        await service.updateDocument('jobs', widget.existing!.id, data);
      } else {
        data['applicationsCount'] = 0;
        data['viewCount'] = 0;
        await service.createDocument('jobs', data);
      }
      ref.invalidate(employerJobsProvider(widget.companyId));
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_isEdit ? 'Job updated' : 'Job posted')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Save failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppX.bg,
      appBar: AppBar(title: Text(_isEdit ? 'Edit job' : 'Post a job')),
      body: ListView(
        padding: const EdgeInsets.all(AppX.s16),
        children: [
          _field('Job title *', _title, hint: 'e.g. Senior Flutter Developer'),
          _dropdown(
            'Category',
            _category,
            AppConstants.jobCategories,
            (v) => setState(() => _category = v),
          ),
          _dropdown(
            'District',
            _district,
            AppConstants.tnDistricts,
            (v) => setState(() => _district = v),
          ),
          _field(
            'Location / area',
            _location,
            hint: 'e.g. Anna Nagar, Chennai',
          ),
          _dropdown(
            'Job type',
            _jobType,
            _jobTypes.keys.toList(),
            (v) => setState(() => _jobType = v),
            display: (k) => _jobTypes[k] ?? k,
          ),
          _dropdown(
            'Experience',
            _experience,
            AppConstants.experienceLevels,
            (v) => setState(() => _experience = v),
          ),
          Row(
            children: [
              Expanded(
                child: _field(
                  'Salary min',
                  _salaryMin,
                  keyboard: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _field(
                  'Salary max',
                  _salaryMax,
                  keyboard: TextInputType.number,
                ),
              ),
            ],
          ),
          Row(
            children: [
              Expanded(
                child: _field(
                  'Openings',
                  _openings,
                  keyboard: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _field(
                  'Education',
                  _education,
                  hint: 'e.g. B.E / Any degree',
                ),
              ),
            ],
          ),
          _field(
            'Description *',
            _description,
            maxLines: 5,
            hint: 'Describe the role, team and what success looks like',
          ),
          _field('Responsibilities (one per line)', _requirements, maxLines: 4),
          _field(
            'Skills (comma separated)',
            _skills,
            hint: 'Flutter, Dart, Firebase',
          ),
          // Deadline picker
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: InkWell(
              borderRadius: BorderRadius.circular(AppX.rSm),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate:
                      _deadline ?? DateTime.now().add(const Duration(days: 30)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) setState(() => _deadline = picked);
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: AppX.card(radius: AppX.rSm),
                child: Row(
                  children: [
                    const Icon(Icons.event_outlined, color: AppX.textSecondary),
                    const SizedBox(width: 12),
                    Text(
                      _deadline == null
                          ? 'Application deadline (optional)'
                          : 'Deadline: ${DateFormat('d MMM yyyy').format(_deadline!)}',
                    ),
                  ],
                ),
              ),
            ),
          ),
          SwitchListTile(
            value: _urgent,
            onChanged: (v) => setState(() => _urgent = v),
            activeThumbColor: AppX.primary,
            contentPadding: EdgeInsets.zero,
            title: const Text('Mark as urgent hiring'),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _saving ? null : _submit,
            child: _saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(_isEdit ? 'Save changes' : 'Post job'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController c, {
    String? hint,
    int maxLines = 1,
    TextInputType? keyboard,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: c,
            maxLines: maxLines,
            keyboardType: keyboard,
            decoration: InputDecoration(hintText: hint ?? label),
          ),
        ],
      ),
    );
  }

  Widget _dropdown(
    String label,
    String value,
    List<String> options,
    ValueChanged<String> onChanged, {
    String Function(String)? display,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            initialValue: value,
            isExpanded: true,
            items: options
                .map(
                  (o) => DropdownMenuItem(
                    value: o,
                    child: Text(display?.call(o) ?? o),
                  ),
                )
                .toList(),
            onChanged: (v) {
              if (v != null) onChanged(v);
            },
          ),
        ],
      ),
    );
  }
}
