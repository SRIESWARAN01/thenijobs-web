// ============================================================
// THENIJOBS — Mobile Redesign: Seeker profile + saved/applied
// Resume upload · skills · education/experience/certifications ·
// profile strength · saved jobs · applied jobs · notifications.
// ============================================================

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/core/services/storage_service.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/core/providers/firestore_data_providers.dart';
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';
import 'package:thenijobs/redesign/widgets/ui_kit.dart';

// ---------------- Providers ----------------

final seekerProfileProvider = FutureProvider.autoDispose<FirestoreDocument?>((
  ref,
) async {
  final user = ref.watch(authStateStreamProvider).value;
  if (user == null) return null;
  return ref.watch(firestoreServiceProvider).getSeekerProfile(user.uid);
});

final savedJobsListProvider =
    FutureProvider.autoDispose<List<FirestoreDocument>>((ref) async {
      final user = ref.watch(authStateStreamProvider).value;
      if (user == null) return const [];
      return ref.watch(firestoreServiceProvider).getSavedJobs(user.uid);
    });

final appliedJobsListProvider =
    FutureProvider.autoDispose<List<FirestoreDocument>>((ref) async {
      final user = ref.watch(authStateStreamProvider).value;
      if (user == null) return const [];
      return ref
          .watch(firestoreServiceProvider)
          .getApplications(ApplicationFilters(seekerId: user.uid));
    });

// ====================================================================
// SEEKER PROFILE
// ====================================================================

class SeekerProfileScreenM3 extends ConsumerWidget {
  const SeekerProfileScreenM3({super.key, this.embedded = false});
  final bool embedded;

  int _profileStrength(FirestoreDocument? p) {
    if (p == null) return 0;
    final direct = p['profileStrength'];
    if (direct is num) return direct.toInt();
    final score = p['profileScore'];
    if (score is Map && score['total'] is num) {
      return (score['total'] as num).toInt();
    }
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateStreamProvider).value;
    final profileAsync = ref.watch(seekerProfileProvider);
    final stats = ref.watch(currentSeekerStatsProvider).value;

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final profile = profileAsync.value;
    final strength = _profileStrength(profile);
    final skills = ((profile?['skills'] as List?) ?? const [])
        .map((e) => e.toString())
        .toList();
    final resumes = (profile?['resumes'] as List?) ?? const [];

    return Scaffold(
      backgroundColor: AppX.bg,
      appBar: AppBar(
        automaticallyImplyLeading: !embedded,
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/seeker/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppX.primary,
        onRefresh: () async {
          ref.invalidate(seekerProfileProvider);
          ref.invalidate(currentSeekerStatsProvider);
          await ref.read(seekerProfileProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: 28),
          children: [
            // ---- Identity + strength ring ----
            Container(
              margin: const EdgeInsets.all(AppX.s16),
              padding: const EdgeInsets.all(AppX.s16),
              decoration: AppX.card(radius: AppX.rLg),
              child: Column(
                children: [
                  Row(
                    children: [
                      _StrengthRing(value: strength),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              (profile?['name'] as String?)
                                          ?.trim()
                                          .isNotEmpty ==
                                      true
                                  ? profile!['name'] as String
                                  : (user.displayName.isEmpty
                                        ? 'Your profile'
                                        : user.displayName),
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              user.email,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            if ((profile?['theniJobsId'] as String?)
                                    ?.isNotEmpty ==
                                true) ...[
                              const SizedBox(height: 6),
                              TagPill(
                                label: profile!['theniJobsId'] as String,
                                icon: Icons.badge_outlined,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (strength < 100) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppX.primaryContainer,
                        borderRadius: BorderRadius.circular(AppX.rSm),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.tips_and_updates_outlined,
                            color: AppX.primary,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Complete your profile to get $strength% → 100% and rank higher with employers.',
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: AppX.primaryDark,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            // ---- Stats row ----
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppX.s16),
              child: Row(
                children: [
                  _stat(
                    'Applied',
                    stats?.appliedJobs,
                    Icons.send_rounded,
                    AppX.primary,
                  ),
                  const SizedBox(width: 12),
                  _stat(
                    'Saved',
                    stats?.savedJobs,
                    Icons.bookmark_rounded,
                    AppX.amber,
                  ),
                  const SizedBox(width: 12),
                  _stat(
                    'Interviews',
                    stats?.interviews,
                    Icons.event_available_rounded,
                    AppX.emerald,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // ---- Action rows ----
            _tile(
              context,
              Icons.description_outlined,
              'Resume',
              subtitle: resumes.isEmpty
                  ? 'No resume uploaded'
                  : '${resumes.length} on file',
              onTap: () => _uploadResume(context, ref, user.uid),
            ),
            _tile(
              context,
              Icons.psychology_outlined,
              'Skills',
              subtitle: skills.isEmpty
                  ? 'Add your skills'
                  : skills.take(3).join(', '),
              onTap: () => _editSkills(context, ref, user.uid, skills),
            ),
            _tile(
              context,
              Icons.school_outlined,
              'Education',
              subtitle:
                  '${(profile?['education'] as List?)?.length ?? 0} entries',
              onTap: () => _addEntry(context, ref, user.uid, 'education', [
                'Institution',
                'Degree / Course',
                'Year',
              ]),
            ),
            _tile(
              context,
              Icons.work_history_outlined,
              'Experience',
              subtitle:
                  '${(profile?['experience'] as List?)?.length ?? 0} entries',
              onTap: () => _addEntry(context, ref, user.uid, 'experience', [
                'Company',
                'Role',
                'Duration',
              ]),
            ),
            _tile(
              context,
              Icons.workspace_premium_outlined,
              'Certifications',
              subtitle:
                  '${(profile?['certifications'] as List?)?.length ?? 0} entries',
              onTap: () => _addEntry(context, ref, user.uid, 'certifications', [
                'Title',
                'Issuer',
                'Year',
              ]),
            ),
            const Divider(height: 24, indent: 16, endIndent: 16),
            _tile(
              context,
              Icons.bookmark_border_rounded,
              'Saved jobs',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SavedJobsScreen()),
              ),
            ),
            _tile(
              context,
              Icons.fact_check_outlined,
              'Applied jobs',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AppliedJobsScreen()),
              ),
            ),
            _tile(
              context,
              Icons.notifications_none_rounded,
              'Notifications',
              onTap: () => context.push('/seeker/notifications'),
            ),
            _tile(
              context,
              Icons.logout_rounded,
              'Sign out',
              color: AppX.rose,
              onTap: () => ref.read(authNotifierProvider.notifier).logout(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(String label, int? value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: AppX.card(),
        child: Column(
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
              style: const TextStyle(color: AppX.textTertiary, fontSize: 11.5),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(
    BuildContext context,
    IconData icon,
    String title, {
    String? subtitle,
    VoidCallback? onTap,
    Color color = AppX.textPrimary,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color == AppX.rose
              ? AppX.rose.withValues(alpha: 0.1)
              : AppX.surfaceMuted,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          icon,
          color: color == AppX.rose ? AppX.rose : AppX.primary,
          size: 20,
        ),
      ),
      title: Text(
        title,
        style: TextStyle(fontWeight: FontWeight.w600, color: color),
      ),
      subtitle: subtitle == null
          ? null
          : Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: color == AppX.rose
          ? null
          : const Icon(Icons.chevron_right_rounded, color: AppX.textTertiary),
    );
  }

  // ---- Resume upload ----
  Future<void> _uploadResume(
    BuildContext context,
    WidgetRef ref,
    String uid,
  ) async {
    try {
      final picked = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx'],
        withData: true,
      );
      if (picked == null || picked.files.isEmpty) return;
      final file = picked.files.single;
      final bytes = file.bytes;
      if (bytes == null) return;
      if (!context.mounted) return;
      _toast(context, 'Uploading resume…');
      final ts = DateTime.now().millisecondsSinceEpoch;
      final res = await StorageService().uploadFile(
        path: 'resumes/$uid/${ts}_${file.name}',
        file: bytes,
        allowedExtensions: const {'pdf', 'doc', 'docx'},
      );
      await ref.read(firestoreServiceProvider).addSeekerResume(uid, {
        'name': file.name,
        'url': res.url,
        'path': res.path,
        'uploadedAt': DateTime.now().toIso8601String(),
      });
      ref.invalidate(seekerProfileProvider);
      if (context.mounted) _toast(context, 'Resume uploaded');
    } catch (e) {
      if (context.mounted) _toast(context, 'Upload failed: $e');
    }
  }

  // ---- Skills editor ----
  Future<void> _editSkills(
    BuildContext context,
    WidgetRef ref,
    String uid,
    List<String> current,
  ) async {
    final result = await showModalBottomSheet<List<String>>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _SkillsEditor(initial: current),
    );
    if (result == null) return;
    await _saveProfilePatch(ref, uid, {'skills': result});
    ref.invalidate(seekerProfileProvider);
    if (context.mounted) _toast(context, 'Skills updated');
  }

  // ---- Generic list-entry add ----
  Future<void> _addEntry(
    BuildContext context,
    WidgetRef ref,
    String uid,
    String key,
    List<String> fields,
  ) async {
    final controllers = {for (final f in fields) f: TextEditingController()};
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Add ${key[0].toUpperCase()}${key.substring(1)}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final f in fields)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: TextField(
                  controller: controllers[f],
                  decoration: InputDecoration(hintText: f),
                ),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(minimumSize: const Size(80, 40)),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Add'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final entry = {
      for (final f in controllers.entries) _slug(f.key): f.value.text.trim(),
    };
    final profile = await ref
        .read(firestoreServiceProvider)
        .getSeekerProfile(uid);
    final existing = ((profile?[key] as List?) ?? const []).toList();
    existing.add(entry);
    await _saveProfilePatch(ref, uid, {key: existing});
    ref.invalidate(seekerProfileProvider);
    if (context.mounted) _toast(context, 'Added');
  }

  Future<void> _saveProfilePatch(
    WidgetRef ref,
    String uid,
    FirestoreDocument patch,
  ) async {
    final profile =
        await ref.read(firestoreServiceProvider).getSeekerProfile(uid) ?? {};
    await ref.read(firestoreServiceProvider).saveSeekerProfile(uid, {
      ...profile,
      ...patch,
    });
  }

  String _slug(String s) =>
      s.toLowerCase().split('/').first.trim().split(' ').first;

  void _toast(BuildContext context, String m) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
}

class _StrengthRing extends StatelessWidget {
  const _StrengthRing({required this.value});
  final int value;
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 64,
      height: 64,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 64,
            height: 64,
            child: CircularProgressIndicator(
              value: value / 100,
              strokeWidth: 6,
              backgroundColor: AppX.surfaceMuted,
              valueColor: AlwaysStoppedAnimation(
                value >= 70
                    ? AppX.emerald
                    : value >= 40
                    ? AppX.amber
                    : AppX.rose,
              ),
            ),
          ),
          Text(
            '$value%',
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 14,
              color: AppX.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _SkillsEditor extends StatefulWidget {
  const _SkillsEditor({required this.initial});
  final List<String> initial;
  @override
  State<_SkillsEditor> createState() => _SkillsEditorState();
}

class _SkillsEditorState extends State<_SkillsEditor> {
  late final List<String> _skills = [...widget.initial];
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _add(String s) {
    final v = s.trim();
    if (v.isEmpty || _skills.contains(v)) return;
    setState(() {
      _skills.add(v);
      _controller.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppX.s20,
        4,
        AppX.s20,
        AppX.s20 + bottomInset,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your skills', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          TextField(
            controller: _controller,
            textInputAction: TextInputAction.done,
            onSubmitted: _add,
            decoration: InputDecoration(
              hintText: 'Add a skill and press enter',
              suffixIcon: IconButton(
                icon: const Icon(Icons.add_rounded),
                onPressed: () => _add(_controller.text),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _skills
                .map(
                  (s) => InputChip(
                    label: Text(s),
                    onDeleted: () => setState(() => _skills.remove(s)),
                    deleteIcon: const Icon(Icons.close_rounded, size: 16),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, _skills),
            child: const Text('Save skills'),
          ),
        ],
      ),
    );
  }
}

// ====================================================================
// SAVED JOBS
// ====================================================================

class SavedJobsScreen extends ConsumerWidget {
  const SavedJobsScreen({super.key, this.embedded = false});
  final bool embedded;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateStreamProvider).value;
    if (user == null) {
      return Scaffold(
        appBar: embedded
            ? AppBar(title: const Text('Saved'))
            : AppBar(title: const Text('Saved jobs')),
        body: EmptyState(
          icon: Icons.bookmark_border_rounded,
          title: 'Save jobs to view them here',
          message: 'Sign in to keep track of jobs you like.',
          actionLabel: 'Sign in',
          onAction: () => context.go('/'),
        ),
      );
    }

    final saved = ref.watch(savedJobsListProvider);
    return Scaffold(
      backgroundColor: AppX.bg,
      appBar: AppBar(
        automaticallyImplyLeading: !embedded,
        title: const Text('Saved jobs'),
      ),
      body: saved.when(
        loading: () => const JobListSkeleton(),
        error: (e, s) =>
            ErrorRetry(onRetry: () => ref.invalidate(savedJobsListProvider)),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              icon: Icons.bookmark_border_rounded,
              title: 'No saved jobs yet',
              message: 'Tap the bookmark on any job to save it for later.',
            );
          }
          return RefreshIndicator(
            color: AppX.primary,
            onRefresh: () async {
              ref.invalidate(savedJobsListProvider);
              await ref.read(savedJobsListProvider.future);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(AppX.s16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final m = items[i];
                final jobId = (m['jobId'] ?? '').toString();
                return _SimpleJobTile(
                  title: (m['jobTitle'] ?? 'Job').toString(),
                  subtitle: (m['companyName'] ?? '').toString(),
                  icon: Icons.bookmark_rounded,
                  onTap: jobId.isEmpty
                      ? null
                      : () => context.push('/jobs/$jobId'),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

// ====================================================================
// APPLIED JOBS
// ====================================================================

class AppliedJobsScreen extends ConsumerWidget {
  const AppliedJobsScreen({super.key});

  Color _statusColor(String s) {
    s = s.toLowerCase();
    if (s.contains('select') || s.contains('hire')) return AppX.emerald;
    if (s.contains('reject')) return AppX.rose;
    if (s.contains('interview') || s.contains('shortlist')) return AppX.amber;
    return AppX.primary;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final applied = ref.watch(appliedJobsListProvider);
    return Scaffold(
      backgroundColor: AppX.bg,
      appBar: AppBar(title: const Text('Applied jobs')),
      body: applied.when(
        loading: () => const JobListSkeleton(),
        error: (e, s) =>
            ErrorRetry(onRetry: () => ref.invalidate(appliedJobsListProvider)),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              icon: Icons.fact_check_outlined,
              title: 'No applications yet',
              message: 'Jobs you apply to will appear here with their status.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppX.s16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final m = items[i];
              final status = (m['status'] ?? 'applied').toString();
              final jobId = (m['jobId'] ?? '').toString();
              return _SimpleJobTile(
                title: (m['jobTitle'] ?? 'Application').toString(),
                subtitle: (m['companyName'] ?? '').toString(),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: AppX.pill(color: _statusColor(status)),
                  child: Text(
                    status.replaceAll('_', ' '),
                    style: TextStyle(
                      color: _statusColor(status),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                onTap: jobId.isEmpty
                    ? null
                    : () => context.push('/jobs/$jobId'),
              );
            },
          );
        },
      ),
    );
  }
}

class _SimpleJobTile extends StatelessWidget {
  const _SimpleJobTile({
    required this.title,
    required this.subtitle,
    this.icon,
    this.trailing,
    this.onTap,
  });
  final String title;
  final String subtitle;
  final IconData? icon;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppX.surface,
      borderRadius: BorderRadius.circular(AppX.rMd),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppX.rMd),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(AppX.s16),
          decoration: AppX.card(),
          child: Row(
            children: [
              CompanyLogo(name: subtitle.isEmpty ? title : subtitle, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    if (subtitle.isNotEmpty)
                      Text(
                        subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                  ],
                ),
              ),
              if (trailing != null) trailing!,
              if (trailing == null && onTap != null)
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppX.textTertiary,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
