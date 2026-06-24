import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';
import 'package:thenijobs/features/public/presentation/widgets/mobile_job_widgets.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';
import 'package:thenijobs/shared/data/models/seeker_profile_model.dart';
import 'package:url_launcher/url_launcher.dart';

class JobDetailScreen extends ConsumerStatefulWidget {
  const JobDetailScreen({
    super.key,
    required this.jobId,
    this.openApplyOnAuth = false,
    this.openSaveOnAuth = false,
  });

  final String jobId;
  final bool openApplyOnAuth;
  final bool openSaveOnAuth;

  @override
  ConsumerState<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _UploadedResume {
  const _UploadedResume({
    required this.id,
    required this.name,
    required this.url,
  });

  final String id;
  final String name;
  final String url;
}

class _JobDetailScreenState extends ConsumerState<JobDetailScreen> {
  bool _isSaved = false;
  bool _hasApplied = false;
  bool _checkingStatus = true;
  bool _applying = false;
  bool _deferredApplyHandled = false;
  bool _deferredSaveHandled = false;

  @override
  void initState() {
    super.initState();
    _checkSavedAndAppliedStatus();
  }

  Future<void> _checkSavedAndAppliedStatus() async {
    final userId = ref.read(authStateStreamProvider).value?.uid;
    if (userId == null) {
      if (mounted) setState(() => _checkingStatus = false);
      return;
    }

    try {
      final service = ref.read(firestoreServiceProvider);
      final savedJobs = await service.getSavedJobs(userId);
      final applications = await service.getApplications(
        ApplicationFilters(seekerId: userId, jobId: widget.jobId),
      );
      if (!mounted) return;
      setState(() {
        _isSaved = savedJobs.any((item) => item['jobId'] == widget.jobId);
        _hasApplied = applications.isNotEmpty;
        _checkingStatus = false;
      });
    } catch (_) {
      if (mounted) setState(() => _checkingStatus = false);
    }
  }

  Map<String, Object?> _savedJobMetadata(Job job) {
    return {
      'jobTitle': job.title,
      'companyName': job.companyName,
      'description': job.description,
      'district': job.location.isNotEmpty ? job.location : job.district,
      'jobType': job.jobType.toJson(),
      'salaryMin': job.salaryMin ?? 0,
      'salaryMax': job.salaryMax ?? 0,
      'skills': job.skills,
      'deadline': job.deadline != null
          ? Timestamp.fromDate(job.deadline!)
          : null,
    };
  }

  Future<void> _saveJob(Job job, String userId, {bool showSnack = true}) async {
    await ref
        .read(firestoreServiceProvider)
        .saveJob(userId, job.id, metadata: _savedJobMetadata(job));
    if (!mounted) return;
    setState(() => _isSaved = true);
    ref.invalidate(savedJobsStreamProvider);
    if (showSnack) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Job saved')));
    }
  }

  Future<void> _toggleSaveJob(Job job, String? userId) async {
    if (userId == null) {
      _showAuthRequiredSheet(job, action: _AuthAction.save);
      return;
    }

    try {
      if (_isSaved) {
        await ref.read(firestoreServiceProvider).unsaveJob(userId, job.id);
        if (!mounted) return;
        setState(() => _isSaved = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Removed from saved jobs')),
        );
      } else {
        await _saveJob(job, userId);
      }
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not update saved job: $error')),
      );
    }
  }

  Future<void> _applyToJob({
    required Job job,
    required String userId,
    required String seekerName,
    String? seekerEmail,
    String? seekerPhone,
    String? resumeUrl,
    String? resumeName,
    String? coverLetter,
  }) async {
    setState(() => _applying = true);
    try {
      await ref
          .read(firestoreServiceProvider)
          .applyToJob(
            ApplyToJobData(
              jobId: job.id,
              companyId: job.companyId,
              seekerId: userId,
              seekerName: seekerName,
              jobTitle: job.title,
              companyName: job.companyName,
              seekerEmail: seekerEmail,
              seekerPhone: seekerPhone,
              resumeUrl: resumeUrl,
              resumeName: resumeName,
              coverLetter: coverLetter,
            ),
          );
      if (!mounted) return;
      setState(() {
        _hasApplied = true;
        _applying = false;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Application submitted')));
    } catch (error) {
      if (!mounted) return;
      setState(() => _applying = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Could not apply: $error')));
    }
  }

  Future<_UploadedResume?> _pickAndUploadResume(String userId) async {
    try {
      final picked = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: const ['pdf'],
        withData: true,
      );
      if (picked == null || picked.files.isEmpty) return null;

      final file = picked.files.single;
      final bytes = file.bytes;
      if (bytes == null) throw Exception('Could not read the selected file');
      if (file.size > 5 * 1024 * 1024) {
        throw Exception('Resume must be smaller than 5 MB');
      }

      final fileName = _safeStorageFileName(file.name);
      final storagePath =
          'resumes/$userId/${DateTime.now().millisecondsSinceEpoch}_$fileName';
      final storageRef = FirebaseStorage.instance.ref(storagePath);
      final task = await storageRef.putData(
        bytes,
        SettableMetadata(
          contentType: 'application/pdf',
          customMetadata: {'ownerId': userId, 'source': 'mobile_apply_sheet'},
        ),
      );
      final url = await task.ref.getDownloadURL();
      final resumeId = DateTime.now().microsecondsSinceEpoch.toString();
      final resume = {
        'id': resumeId,
        'name': file.name,
        'uploadDate': DateFormat('d MMM yyyy').format(DateTime.now()),
        'size': _formatFileSize(file.size),
        'format': 'PDF',
        'isDefault': true,
        'url': url,
        'storagePath': storagePath,
      };

      await ref.read(firestoreServiceProvider).addSeekerResume(userId, resume);
      ref.invalidate(seekerProfileProvider);

      return _UploadedResume(id: resumeId, name: file.name, url: url);
    } catch (error) {
      if (!mounted) return null;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Resume upload failed: $error')));
      return null;
    }
  }

  String _safeStorageFileName(String name) {
    final cleaned = name.replaceAll(RegExp(r'[^A-Za-z0-9._-]'), '_');
    return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : '$cleaned.pdf';
  }

  String _formatFileSize(int bytes) {
    if (bytes >= 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / 1024).ceil()} KB';
  }

  void _showAuthRequiredSheet(Job job, {required _AuthAction action}) {
    final redirectPath =
        '/jobs/${job.id}?${action == _AuthAction.apply ? 'apply' : 'save'}=1';

    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      useSafeArea: true,
      builder: (sheetContext) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                action == _AuthAction.apply
                    ? 'Apply to this job'
                    : 'Save this job',
                style: const TextStyle(
                  color: AppTheme.lightTextPrimary,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Continue with your preferred sign-in method. You will return to this job automatically.',
                style: TextStyle(
                  color: AppTheme.lightTextSecondary,
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 18),
              FilledButton.icon(
                onPressed: () async {
                  try {
                    await ref
                        .read(authNotifierProvider.notifier)
                        .signInWithGoogle();
                    if (!sheetContext.mounted) return;
                    Navigator.of(sheetContext).pop();
                    final uid =
                        ref.read(authNotifierProvider).user?.uid ??
                        ref.read(authStateStreamProvider).value?.uid;
                    if (uid == null) {
                      sheetContext.go(
                        '/login?redirect=${Uri.encodeComponent(redirectPath)}',
                      );
                      return;
                    }
                    if (action == _AuthAction.save) {
                      await _saveJob(job, uid);
                    } else {
                      _showApplyBottomSheet(
                        job,
                        ref.read(seekerProfileProvider).value,
                        uid,
                      );
                    }
                  } catch (_) {
                    if (!sheetContext.mounted) return;
                    ScaffoldMessenger.of(sheetContext).showSnackBar(
                      const SnackBar(
                        content: Text('Google sign-in was not completed'),
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.g_mobiledata_rounded),
                label: const Text('Continue with Google'),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.of(sheetContext).pop();
                  sheetContext.go(
                    '/login?mode=email&redirect=${Uri.encodeComponent(redirectPath)}',
                  );
                },
                icon: const Icon(Icons.mail_outline_rounded),
                label: const Text('Continue with Email'),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.of(sheetContext).pop();
                  sheetContext.go(
                    '/login?mode=phone&redirect=${Uri.encodeComponent(redirectPath)}',
                  );
                },
                icon: const Icon(Icons.phone_iphone_rounded),
                label: const Text('Continue with Phone'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showApplyBottomSheet(
    Job job,
    JobSeekerProfile? profile,
    String userId,
  ) {
    final authUser = ref.read(authStateStreamProvider).value;
    final availableResumes = (profile?.resumes ?? const <ResumeFile>[])
        .where((resume) => (resume.url ?? '').trim().isNotEmpty)
        .toList();
    ResumeFile? selectedResume = availableResumes.isEmpty
        ? null
        : availableResumes.firstWhere(
            (resume) => resume.isDefault,
            orElse: () => availableResumes.first,
          );
    String selectedResumeId = selectedResume?.id ?? '';
    String selectedResumeName = selectedResume?.name ?? '';
    String selectedResumeUrl = selectedResume?.url ?? '';
    bool uploadingResume = false;
    final coverLetterController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final hasResume = selectedResumeUrl.trim().isNotEmpty;
            return SafeArea(
              top: false,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.85,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Apply for ${job.title}',
                            style: const TextStyle(
                              color: AppTheme.lightTextPrimary,
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            job.companyName.isNotEmpty
                                ? job.companyName
                                : 'Verified Employer',
                            style: const TextStyle(
                              color: AppTheme.lightTextSecondary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    Flexible(
                      child: SingleChildScrollView(
                        padding: EdgeInsets.fromLTRB(
                          20,
                          16,
                          20,
                          MediaQuery.viewInsetsOf(context).bottom + 24,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (availableResumes.isNotEmpty) ...[
                              const _SheetLabel('Resume'),
                              DropdownButtonFormField<String>(
                                initialValue: selectedResumeId,
                                items: [
                                  for (final resume in availableResumes)
                                    DropdownMenuItem(
                                      value: resume.id,
                                      child: Text(
                                        resume.name,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                ],
                                onChanged: (value) {
                                  if (value == null) return;
                                  final resume = availableResumes.firstWhere(
                                    (item) => item.id == value,
                                  );
                                  setModalState(() {
                                    selectedResumeId = resume.id;
                                    selectedResumeName = resume.name;
                                    selectedResumeUrl = resume.url ?? '';
                                  });
                                },
                              ),
                              const SizedBox(height: 12),
                            ],
                            _UploadResumeCard(
                              hasResume: hasResume,
                              resumeName: selectedResumeName,
                              uploading: uploadingResume,
                              onUpload: uploadingResume
                                  ? null
                                  : () async {
                                      setModalState(() => uploadingResume = true);
                                      final uploaded = await _pickAndUploadResume(
                                        userId,
                                      );
                                      if (!context.mounted) return;
                                      setModalState(() {
                                        uploadingResume = false;
                                        if (uploaded != null) {
                                          selectedResumeId = uploaded.id;
                                          selectedResumeName = uploaded.name;
                                          selectedResumeUrl = uploaded.url;
                                        }
                                      });
                                    },
                            ),
                            const SizedBox(height: 18),
                            const _SheetLabel('Message to recruiter'),
                            TextField(
                              controller: coverLetterController,
                              minLines: 4,
                              maxLines: 5,
                              textInputAction: TextInputAction.newline,
                              decoration: const InputDecoration(
                                hintText: 'Briefly share why you are a strong fit.',
                                alignLabelWithHint: true,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const Divider(height: 1),
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: _applying
                              ? null
                              : () async {
                                  if (!hasResume) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Upload or select a resume first',
                                        ),
                                      ),
                                    );
                                    return;
                                  }
                                  Navigator.of(context).pop();
                                  await _applyToJob(
                                    job: job,
                                    userId: userId,
                                    seekerName:
                                        (profile?.name.trim().isNotEmpty ?? false)
                                        ? profile!.name
                                        : (authUser?.displayName ?? 'Job Seeker'),
                                    seekerEmail:
                                        (profile?.email.trim().isNotEmpty ?? false)
                                        ? profile!.email
                                        : authUser?.email,
                                    seekerPhone:
                                        (profile?.phone.trim().isNotEmpty ?? false)
                                        ? profile!.phone
                                        : authUser?.phone,
                                    resumeUrl: selectedResumeUrl,
                                    resumeName: selectedResumeName,
                                    coverLetter: coverLetterController.text.trim(),
                                  );
                                },
                          icon: _applying
                              ? const SizedBox.square(
                                  dimension: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.send_rounded),
                          label: Text(
                            _applying ? 'Submitting...' : 'Submit application',
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    ).whenComplete(coverLetterController.dispose);
  }

  void _handleDeferredIntent(
    Job job,
    String? userId,
    AsyncValue<JobSeekerProfile?> profileAsync,
  ) {
    if (userId == null) return;

    if (widget.openSaveOnAuth && !_deferredSaveHandled) {
      _deferredSaveHandled = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _saveJob(job, userId);
      });
    }

    if (widget.openApplyOnAuth &&
        !_deferredApplyHandled &&
        profileAsync.hasValue) {
      _deferredApplyHandled = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _showApplyBottomSheet(job, profileAsync.value, userId);
      });
    }
  }

  Future<void> _openMaps(Job job) async {
    final location = [
      if (job.location.isNotEmpty) job.location,
      if (job.district.isNotEmpty) job.district,
      'Tamil Nadu',
    ].join(', ');
    final uri = Uri.https('www.google.com', '/maps/search/', {
      'api': '1',
      'query': location,
    });
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openWhatsApp(Job job) async {
    var phone = job.postedBy;
    if (!RegExp(r'^[0-9+]+$').hasMatch(phone)) {
      try {
        final company = await ref
            .read(firestoreServiceProvider)
            .fetchDocument('companies', job.companyId);
        phone =
            (company?['whatsapp'] as String?) ??
            (company?['phone'] as String?) ??
            '919876543210';
      } catch (_) {
        phone = '919876543210';
      }
    }
    final clean = phone.replaceAll(RegExp(r'[^0-9]'), '');
    final text =
        'Hi, I am interested in ${job.title} at ${job.companyName} on TheNiJobs.';
    final uri = Uri.parse(
      'https://wa.me/$clean?text=${Uri.encodeComponent(text)}',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _callRecruiter(Job job) async {
    var phone = job.postedBy;
    if (!RegExp(r'^[0-9+]+$').hasMatch(phone)) {
      try {
        final company = await ref
            .read(firestoreServiceProvider)
            .fetchDocument('companies', job.companyId);
        phone = (company?['phone'] as String?) ?? '';
      } catch (_) {
        phone = '';
      }
    }
    if (phone.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Recruiter phone is not available')),
      );
      return;
    }
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    final jobAsync = ref.watch(jobDetailProvider(widget.jobId));
    final profileAsync = ref.watch(seekerProfileProvider);
    final user = ref.watch(authStateStreamProvider).value;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Job details'),
        centerTitle: true,
        actions: [
          jobAsync.maybeWhen(
            data: (job) => job == null
                ? const SizedBox.shrink()
                : IconButton(
                    tooltip: _isSaved ? 'Saved' : 'Save job',
                    onPressed: () => _toggleSaveJob(job, user?.uid),
                    icon: Icon(
                      _isSaved
                          ? Icons.bookmark_rounded
                          : Icons.bookmark_border_rounded,
                    ),
                  ),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      bottomNavigationBar: jobAsync.maybeWhen(
        data: (job) => job == null
            ? null
            : _ApplyBar(
                checking: _checkingStatus,
                applied: _hasApplied,
                applying: _applying,
                onApply: () {
                  if (user == null) {
                    _showAuthRequiredSheet(job, action: _AuthAction.apply);
                    return;
                  }
                  _showApplyBottomSheet(job, profileAsync.value, user.uid);
                },
              ),
        orElse: () => null,
      ),
      body: SafeArea(
        child: jobAsync.when(
          data: (job) {
            if (job == null) return const _JobNotFound();
            _handleDeferredIntent(job, user?.uid, profileAsync);

            final similarJobs = ref
                .watch(allJobsProvider)
                .maybeWhen(
                  data: (jobs) => jobs
                      .where(
                        (item) =>
                            item.id != job.id &&
                            item.isActive &&
                            (item.category == job.category ||
                                item.district == job.district ||
                                item.skills.any(job.skills.contains)),
                      )
                      .take(5)
                      .toList(),
                  orElse: () => const <Job>[],
                );

            return ListView(
              padding: const EdgeInsets.only(bottom: 24),
              children: [
                _JobHero(job: job),
                const SizedBox(height: 14),
                _SectionCard(
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      JobSignalChip(
                        icon: Icons.payments_outlined,
                        label: formatSalaryRange(job.salaryMin, job.salaryMax),
                        color: AppTheme.brandEmerald,
                      ),
                      JobSignalChip(
                        icon: Icons.timeline_rounded,
                        label: job.experience.isNotEmpty
                            ? job.experience
                            : 'Any experience',
                        color: AppTheme.brandIndigo,
                      ),
                      JobSignalChip(
                        icon: Icons.work_outline_rounded,
                        label: friendlyJobType(job.jobType),
                        color: AppTheme.brandCyan,
                      ),
                      JobSignalChip(
                        icon: Icons.people_outline_rounded,
                        label:
                            '${job.openings} opening${job.openings == 1 ? '' : 's'}',
                        color: AppTheme.lightTextSecondary,
                      ),
                    ],
                  ),
                ),
                if (job.skills.isNotEmpty)
                  _SectionCard(
                    title: 'Skills',
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final skill in job.skills)
                          Chip(
                            label: Text(skill),
                            avatar: const Icon(
                              Icons.check_circle_outline_rounded,
                              size: 16,
                            ),
                          ),
                      ],
                    ),
                  ),
                _SectionCard(
                  title: 'Description',
                  child: Text(
                    job.description.isNotEmpty
                        ? job.description
                        : 'The recruiter has not added a long description yet.',
                    style: const TextStyle(
                      color: AppTheme.lightTextSecondary,
                      fontSize: 14,
                      height: 1.6,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (job.requirements.isNotEmpty)
                  _SectionCard(
                    title: 'Responsibilities',
                    child: _BulletList(items: job.requirements),
                  ),
                _SectionCard(
                  title: 'Benefits',
                  child: _BulletList(
                    items: [
                      'Verified recruiter listing',
                      'Direct application tracking',
                      if (job.isPremium) 'Premium employer visibility',
                      if (job.deadline != null)
                        'Application deadline: ${DateFormat('d MMM yyyy').format(job.deadline!)}',
                    ],
                  ),
                ),
                _SectionCard(
                  title: 'Location',
                  child: _LocationCard(
                    job: job,
                    onOpenMaps: () => _openMaps(job),
                  ),
                ),
                _SectionCard(
                  title: 'Recruiter contact',
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _openWhatsApp(job),
                          icon: const Icon(Icons.chat_outlined),
                          label: const Text('WhatsApp'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _callRecruiter(job),
                          icon: const Icon(Icons.call_outlined),
                          label: const Text('Call HR'),
                        ),
                      ),
                    ],
                  ),
                ),
                if (similarJobs.isNotEmpty)
                  JobSection(
                    title: 'Similar jobs',
                    subtitle: 'More roles like this',
                    jobs: similarJobs,
                    onJobTap: (item) => context.push('/jobs/${item.id}'),
                    onViewAll: () => context.go(
                      '/jobs?category=${Uri.encodeComponent(job.category)}',
                    ),
                  ),
              ],
            );
          },
          loading: () => const Padding(
            padding: EdgeInsets.only(top: 20),
            child: JobSkeletonList(count: 4),
          ),
          error: (_, __) => const _JobNotFound(
            title: 'Could not load this job',
            message: 'Please go back and try another listing.',
          ),
        ),
      ),
    );
  }
}

enum _AuthAction { apply, save }

class _JobHero extends StatelessWidget {
  const _JobHero({required this.job});

  final Job job;

  @override
  Widget build(BuildContext context) {
    final location = job.location.isNotEmpty ? job.location : job.district;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.lightBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 108,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF111827),
                  Color(0xFF164E63),
                  Color(0xFF312E81),
                ],
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  right: 18,
                  top: 18,
                  child: Icon(
                    Icons.business_center_rounded,
                    size: 62,
                    color: Colors.white.withValues(alpha: 0.12),
                  ),
                ),
                Positioned(
                  left: 18,
                  bottom: 16,
                  child: Row(
                    children: [
                      if (job.isUrgent)
                        const _HeroBadge(
                          label: 'Urgent',
                          icon: Icons.flash_on_rounded,
                        ),
                      if (job.isPremium || job.isFeatured) ...[
                        const SizedBox(width: 8),
                        const _HeroBadge(
                          label: 'Featured',
                          icon: Icons.star_rounded,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Transform.translate(
                  offset: const Offset(0, -28),
                  child: CompanyMark(
                    name: job.companyName.isNotEmpty
                        ? job.companyName
                        : 'TheNiJobs',
                    size: 64,
                  ),
                ),
                Transform.translate(
                  offset: const Offset(0, -16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        job.title.isNotEmpty ? job.title : 'Untitled job',
                        style: const TextStyle(
                          color: AppTheme.lightTextPrimary,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          height: 1.15,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              job.companyName.isNotEmpty
                                  ? job.companyName
                                  : 'Verified Employer',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppTheme.lightTextSecondary,
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          const Icon(
                            Icons.verified_rounded,
                            color: AppTheme.brandEmerald,
                            size: 18,
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 18,
                            color: AppTheme.brandCyan,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              location.isEmpty ? 'Tamil Nadu' : location,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppTheme.lightTextSecondary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroBadge extends StatelessWidget {
  const _HeroBadge({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 14),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child, this.title});

  final String? title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppTheme.lightBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Text(
              title!,
              style: const TextStyle(
                color: AppTheme.lightTextPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 12),
          ],
          child,
        ],
      ),
    );
  }
}

class _BulletList extends StatelessWidget {
  const _BulletList({required this.items});

  final List<String> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.check_circle_rounded,
                  size: 18,
                  color: AppTheme.brandEmerald,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item,
                    style: const TextStyle(
                      color: AppTheme.lightTextSecondary,
                      fontSize: 14,
                      height: 1.45,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _LocationCard extends StatelessWidget {
  const _LocationCard({required this.job, required this.onOpenMaps});

  final Job job;
  final VoidCallback onOpenMaps;

  @override
  Widget build(BuildContext context) {
    final location = [
      if (job.location.isNotEmpty) job.location,
      if (job.district.isNotEmpty) job.district,
      'Tamil Nadu',
    ].join(', ');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppTheme.brandCyan.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.map_outlined,
                  color: AppTheme.brandCyan,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  location,
                  style: const TextStyle(
                    color: AppTheme.lightTextPrimary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 116,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: const Color(0xFFE0F2FE),
              ),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: CustomPaint(painter: _MapGridPainter()),
                  ),
                  const Center(
                    child: Icon(
                      Icons.location_pin,
                      color: AppTheme.brandRose,
                      size: 44,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onOpenMaps,
            icon: const Icon(Icons.open_in_new_rounded),
            label: const Text('Open map'),
          ),
        ],
      ),
    );
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0284C7).withValues(alpha: 0.18)
      ..strokeWidth = 1;

    for (var x = 0.0; x < size.width; x += 28) {
      canvas.drawLine(Offset(x, 0), Offset(x + 42, size.height), paint);
    }
    for (var y = 0.0; y < size.height; y += 24) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y + 8), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _UploadResumeCard extends StatelessWidget {
  const _UploadResumeCard({
    required this.hasResume,
    required this.resumeName,
    required this.uploading,
    required this.onUpload,
  });

  final bool hasResume;
  final String resumeName;
  final bool uploading;
  final VoidCallback? onUpload;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: hasResume ? const Color(0xFFF0FDF4) : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: hasResume ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A),
        ),
      ),
      child: Row(
        children: [
          Icon(
            hasResume ? Icons.description_rounded : Icons.upload_file_rounded,
            color: hasResume ? AppTheme.brandEmerald : AppTheme.brandAmber,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              hasResume ? resumeName : 'Upload a PDF resume to continue',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppTheme.lightTextPrimary,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 10),
          TextButton(
            onPressed: onUpload,
            child: Text(
              uploading
                  ? 'Uploading'
                  : hasResume
                  ? 'Replace'
                  : 'Upload',
            ),
          ),
        ],
      ),
    );
  }
}

class _SheetLabel extends StatelessWidget {
  const _SheetLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label,
        style: const TextStyle(
          color: AppTheme.lightTextPrimary,
          fontSize: 14,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _ApplyBar extends StatelessWidget {
  const _ApplyBar({
    required this.checking,
    required this.applied,
    required this.applying,
    required this.onApply,
  });

  final bool checking;
  final bool applied;
  final bool applying;
  final VoidCallback onApply;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppTheme.lightBorder)),
        ),
        child: FilledButton.icon(
          onPressed: checking || applied || applying ? null : onApply,
          icon: checking || applying
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Icon(applied ? Icons.check_circle_rounded : Icons.send_rounded),
          label: Text(applied ? 'Applied' : 'Apply now'),
        ),
      ),
    );
  }
}

class _JobNotFound extends StatelessWidget {
  const _JobNotFound({
    this.title = 'Job not found',
    this.message = 'This job may have expired or been removed.',
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.work_off_outlined,
              size: 54,
              color: AppTheme.lightTextSecondary,
            ),
            const SizedBox(height: 14),
            Text(
              title,
              style: const TextStyle(
                color: AppTheme.lightTextPrimary,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.lightTextSecondary),
            ),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: () => context.go('/jobs'),
              child: const Text('Browse jobs'),
            ),
          ],
        ),
      ),
    );
  }
}
