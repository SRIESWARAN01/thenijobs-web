// ============================================================
// THENIJOBS — Mobile Redesign: Premium Job Detail
// Banner · logo · salary/exp/type · skills · description ·
// responsibilities · benefits · location map · similar jobs ·
// sticky "Apply Now" (login gated, resumes to job after auth).
// ============================================================

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thenijobs/redesign/auth/login_sheet.dart';
import 'package:thenijobs/redesign/data/job_actions.dart';
import 'package:thenijobs/redesign/data/job_providers.dart';
import 'package:thenijobs/redesign/job_detail/apply_sheet.dart';
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';
import 'package:thenijobs/redesign/widgets/ui_kit.dart';
import 'package:thenijobs/shared/data/models/company_model.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';

class JobDetailScreenM3 extends ConsumerWidget {
  const JobDetailScreenM3({super.key, required this.jobId});
  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(jobDetailProvider(jobId));

    return Scaffold(
      backgroundColor: AppX.bg,
      body: detail.when(
        loading: () => const _DetailSkeleton(),
        error: (e, s) => Scaffold(
          appBar: AppBar(),
          body: ErrorRetry(onRetry: () => ref.invalidate(jobDetailProvider(jobId))),
        ),
        data: (d) {
          if (d == null) {
            return Scaffold(
              appBar: AppBar(),
              body: const EmptyState(
                  title: 'Job not found',
                  message: 'This job may have been closed or removed.',
                  icon: Icons.work_off_outlined),
            );
          }
          return _DetailView(detail: d);
        },
      ),
    );
  }
}

class _DetailView extends ConsumerWidget {
  const _DetailView({required this.detail});
  final JobDetail detail;

  Job get job => detail.job;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final company = ref.watch(companyByIdProvider(job.companyId)).value;
    final savedIds = ref.watch(savedJobIdsProvider).value ?? const <String>{};
    final saved = savedIds.contains(job.id);
    final responsibilities =
        detail.responsibilities.isNotEmpty ? detail.responsibilities : job.requirements;

    return Scaffold(
      backgroundColor: AppX.bg,
      body: CustomScrollView(
        slivers: [
          _banner(context, ref, company, saved),
          SliverToBoxAdapter(child: _headerCard(context, company)),
          SliverToBoxAdapter(child: _snapshot(context)),
          if (job.skills.isNotEmpty)
            SliverToBoxAdapter(child: _skills(context)),
          SliverToBoxAdapter(
            child: _section(context, 'About this role', child: Text(
              job.description.isEmpty ? 'No description provided.' : job.description,
              style: Theme.of(context).textTheme.bodyLarge,
            )),
          ),
          if (responsibilities.isNotEmpty)
            SliverToBoxAdapter(child: _bullets(context, 'Responsibilities', responsibilities)),
          if (detail.benefits.isNotEmpty)
            SliverToBoxAdapter(child: _bullets(context, 'Benefits & perks', detail.benefits, color: AppX.emerald)),
          if ((job.education ?? '').isNotEmpty)
            SliverToBoxAdapter(
              child: _section(context, 'Education',
                  child: Text(job.education!, style: Theme.of(context).textTheme.bodyLarge)),
            ),
          SliverToBoxAdapter(child: _mapCard(context, company)),
          SliverToBoxAdapter(child: _similar(context, ref)),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
      bottomNavigationBar: _stickyBar(context, ref, saved, savedIds),
    );
  }

  // ---- Banner with back / share / save ----
  Widget _banner(BuildContext context, WidgetRef ref, Company? company, bool saved) {
    return SliverAppBar(
      pinned: true,
      expandedHeight: 168,
      backgroundColor: AppX.primary,
      foregroundColor: Colors.white,
      leading: IconButton(
        icon: const CircleAvatar(
            backgroundColor: Colors.black26,
            child: Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20)),
        onPressed: () => Navigator.of(context).maybePop(),
      ),
      actions: [
        IconButton(
          icon: const CircleAvatar(
              backgroundColor: Colors.black26,
              child: Icon(Icons.ios_share_rounded, color: Colors.white, size: 18)),
          onPressed: () {
            Clipboard.setData(ClipboardData(text: 'https://thenijobs.app/jobs/${job.id}'));
            ScaffoldMessenger.of(context)
                .showSnackBar(const SnackBar(content: Text('Job link copied')));
          },
        ),
        IconButton(
          icon: CircleAvatar(
              backgroundColor: Colors.black26,
              child: Icon(saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                  color: Colors.white, size: 20)),
          onPressed: () => toggleSaveJob(context, ref, job, currentlySaved: saved),
        ),
        const SizedBox(width: 6),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: (company?.coverImageUrl != null && company!.coverImageUrl!.isNotEmpty)
            ? CachedNetworkImage(
                imageUrl: company.coverImageUrl!,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => const DecoratedBox(
                    decoration: BoxDecoration(gradient: AppX.heroGradient)),
              )
            : const DecoratedBox(decoration: BoxDecoration(gradient: AppX.heroGradient)),
      ),
    );
  }

  // ---- Header card overlapping banner ----
  Widget _headerCard(BuildContext context, Company? company) {
    final verified = company?.verificationStatus == VerificationStatus.verified;
    return Transform.translate(
      offset: const Offset(0, -28),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: AppX.s16),
        padding: const EdgeInsets.all(AppX.s16),
        decoration: AppX.card(radius: AppX.rLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              CompanyLogo(url: company?.logoUrl ?? job.company?.logoUrl, name: job.companyName, size: 60),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(job.title, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Row(children: [
                    Flexible(
                      child: Text(job.companyName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodyMedium),
                    ),
                    if (verified) ...[
                      const SizedBox(width: 6),
                      const Icon(Icons.verified_rounded, color: AppX.primary, size: 16),
                    ],
                  ]),
                ]),
              ),
            ]),
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: [
              TagPill(
                  label: job.location.isNotEmpty ? job.location : job.district,
                  icon: Icons.place_outlined),
              TagPill(label: jobTypeLabel(job.jobType), icon: Icons.work_outline_rounded),
              TagPill(label: 'Posted ${relativeTime(job.createdAt)}', icon: Icons.schedule_rounded),
              if (job.applicationsCount > 0)
                TagPill(label: '${job.applicationsCount} applied', icon: Icons.people_alt_outlined),
            ]),
          ],
        ),
      ),
    );
  }

  // ---- Salary / experience / type / openings ----
  Widget _snapshot(BuildContext context) {
    final items = [
      (_SnapItem('Salary', formatSalary(job.salaryMin, job.salaryMax), Icons.payments_outlined, AppX.emerald)),
      (_SnapItem('Experience', job.experience.isEmpty ? 'Any' : job.experience, Icons.timeline_rounded, AppX.primary)),
      (_SnapItem('Job type', jobTypeLabel(job.jobType), Icons.work_outline_rounded, AppX.violet)),
      (_SnapItem('Openings', '${job.openings}', Icons.event_seat_outlined, AppX.amber)),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppX.s16, 0, AppX.s16, 4),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 2.6,
        children: items
            .map((it) => Container(
                  padding: const EdgeInsets.all(12),
                  decoration: AppX.card(),
                  child: Row(children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                          color: it.color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10)),
                      child: Icon(it.icon, color: it.color, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(it.label,
                              style: const TextStyle(color: AppX.textTertiary, fontSize: 11)),
                          Text(it.value,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800, fontSize: 13, color: AppX.textPrimary)),
                        ],
                      ),
                    ),
                  ]),
                ))
            .toList(),
      ),
    );
  }

  Widget _skills(BuildContext context) {
    return _section(context, 'Skills',
        child: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: job.skills
              .map((s) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: AppX.pill(color: AppX.primary),
                    child: Text(s,
                        style: const TextStyle(
                            color: AppX.primaryDark, fontSize: 12.5, fontWeight: FontWeight.w600)),
                  ))
              .toList(),
        ));
  }

  Widget _bullets(BuildContext context, String title, List<String> items, {Color color = AppX.primary}) {
    return _section(context, title,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: items
              .map((t) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 6, right: 10),
                        child: Icon(Icons.check_circle_rounded, size: 16, color: color),
                      ),
                      Expanded(child: Text(t, style: Theme.of(context).textTheme.bodyLarge)),
                    ]),
                  ))
              .toList(),
        ));
  }

  Widget _mapCard(BuildContext context, Company? company) {
    final address = company?.address ?? '';
    final district = job.district.isNotEmpty ? job.district : (company?.district ?? '');
    final hasLatLng = company?.latitude != null && company?.longitude != null;
    return _section(context, 'Location',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(AppX.rMd),
              child: InkWell(
                onTap: () => _openMaps(address, district, company?.latitude, company?.longitude),
                child: Container(
                  height: 130,
                  width: double.infinity,
                  color: AppX.surfaceMuted,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const Opacity(
                        opacity: 0.5,
                        child: Icon(Icons.map_rounded, size: 64, color: AppX.textTertiary),
                      ),
                      Positioned(
                        bottom: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                              color: AppX.primary, borderRadius: BorderRadius.circular(999)),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Icon(hasLatLng ? Icons.navigation_rounded : Icons.open_in_new_rounded,
                                color: Colors.white, size: 15),
                            const SizedBox(width: 6),
                            const Text('Open in Maps',
                                style: TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w700)),
                          ]),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Row(children: [
              const Icon(Icons.place_outlined, size: 16, color: AppX.textSecondary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  [address, district].where((e) => e.isNotEmpty).join(', ').isEmpty
                      ? (job.location.isNotEmpty ? job.location : 'Location not specified')
                      : [address, district].where((e) => e.isNotEmpty).join(', '),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ]),
          ],
        ));
  }

  Future<void> _openMaps(String address, String district, double? lat, double? lng) async {
    final query = (lat != null && lng != null)
        ? '$lat,$lng'
        : Uri.encodeComponent([address, district, 'Tamil Nadu'].where((e) => e.isNotEmpty).join(', '));
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Widget _similar(BuildContext context, WidgetRef ref) {
    final async = ref.watch(similarJobsProvider(job));
    return async.maybeWhen(
      data: (jobs) {
        if (jobs.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(title: 'Similar jobs', icon: Icons.lightbulb_outline_rounded),
            for (final j in jobs) JobCard(job: j),
          ],
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }

  Widget _section(BuildContext context, String title, {required Widget child}) {
    return Container(
      margin: const EdgeInsets.fromLTRB(AppX.s16, 8, AppX.s16, 4),
      padding: const EdgeInsets.all(AppX.s16),
      decoration: AppX.card(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  // ---- Sticky apply bar ----
  Widget _stickyBar(BuildContext context, WidgetRef ref, bool saved, Set<String> savedIds) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          AppX.s16, 12, AppX.s16, 12 + MediaQuery.of(context).padding.bottom),
      decoration: const BoxDecoration(
        color: AppX.surface,
        border: Border(top: BorderSide(color: AppX.border)),
      ),
      child: Row(
        children: [
          OutlinedButton(
            onPressed: () => toggleSaveJob(context, ref, job, currentlySaved: saved),
            style: OutlinedButton.styleFrom(
                minimumSize: const Size(56, 52), padding: EdgeInsets.zero),
            child: Icon(saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                color: saved ? AppX.primary : AppX.textPrimary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(formatSalary(job.salaryMin, job.salaryMax),
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 13, color: AppX.textPrimary)),
                Text(jobTypeLabel(job.jobType),
                    style: const TextStyle(color: AppX.textTertiary, fontSize: 11.5)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.send_rounded, size: 18),
              label: const Text('Apply Now'),
              onPressed: () async {
                final ok = await ensureLoggedIn(context, ref, reason: 'Sign in to apply');
                if (!ok || !context.mounted) return;
                final applied = await showApplySheet(context, ref, job);
                if (applied && context.mounted) {
                  showDialog(
                    context: context,
                    builder: (_) => const _AppliedDialog(),
                  );
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SnapItem {
  _SnapItem(this.label, this.value, this.icon, this.color);
  final String label;
  final String value;
  final IconData icon;
  final Color color;
}

class _AppliedDialog extends StatelessWidget {
  const _AppliedDialog();
  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppX.rLg)),
      child: Padding(
        padding: const EdgeInsets.all(AppX.s24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
                color: AppX.emerald.withValues(alpha: 0.12), shape: BoxShape.circle),
            child: const Icon(Icons.check_rounded, color: AppX.emerald, size: 40),
          ),
          const SizedBox(height: 16),
          Text('Application submitted', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          Text('The employer will review your application. Track its status in your profile.',
              textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 20),
          ElevatedButton(
              onPressed: () => Navigator.of(context).pop(), child: const Text('Done')),
        ]),
      ),
    );
  }
}

class _DetailSkeleton extends StatelessWidget {
  const _DetailSkeleton();
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppX.s16),
        children: const [
          SkeletonBox(height: 150, radius: AppX.rLg),
          SizedBox(height: 16),
          SkeletonBox(height: 90, radius: AppX.rMd),
          SizedBox(height: 16),
          SkeletonBox(height: 200, radius: AppX.rMd),
        ],
      ),
    );
  }
}
