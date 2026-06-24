// ============================================================
// THENIJOBS — Mobile Redesign: shared UI kit
// Job cards, skeleton loaders, headers, chips, empty/error states.
// ============================================================

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';

// ---------------- Formatting helpers ----------------

String jobTypeLabel(JobType t) {
  switch (t) {
    case JobType.fullTime:
      return 'Full-time';
    case JobType.partTime:
      return 'Part-time';
    case JobType.internship:
      return 'Internship';
    case JobType.remote:
      return 'Remote';
    case JobType.workFromHome:
      return 'Work from home';
    case JobType.fresher:
      return 'Fresher';
    case JobType.contract:
      return 'Contract';
  }
}

String formatSalary(double? min, double? max) {
  String k(double v) {
    if (v >= 100000) {
      return '₹${(v / 100000).toStringAsFixed(v % 100000 == 0 ? 0 : 1)}L';
    }
    if (v >= 1000) return '₹${(v / 1000).toStringAsFixed(0)}k';
    return '₹${v.toStringAsFixed(0)}';
  }

  if (min == null && max == null) return 'Not disclosed';
  if (min != null && max != null) return '${k(min)} – ${k(max)}';
  return '${k((min ?? max)!)}+';
}

String relativeTime(DateTime dt) {
  final d = DateTime.now().difference(dt);
  if (d.inDays >= 30) return DateFormat('d MMM').format(dt);
  if (d.inDays >= 1) return '${d.inDays}d ago';
  if (d.inHours >= 1) return '${d.inHours}h ago';
  if (d.inMinutes >= 1) return '${d.inMinutes}m ago';
  return 'Just now';
}

// ---------------- Company logo ----------------

class CompanyLogo extends StatelessWidget {
  const CompanyLogo({super.key, this.url, required this.name, this.size = 48});

  final String? url;
  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initials = name.trim().isEmpty
        ? '?'
        : name
              .trim()
              .split(RegExp(r'\s+'))
              .take(2)
              .map((w) => w[0])
              .join()
              .toUpperCase();
    final fallback = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: AppX.brandGradient,
        borderRadius: BorderRadius.circular(AppX.rSm),
      ),
      child: Text(
        initials,
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
          fontSize: size * 0.34,
        ),
      ),
    );

    if (url == null || url!.isEmpty) return fallback;
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppX.rSm),
      child: CachedNetworkImage(
        imageUrl: url!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        placeholder: (_, __) => _ShimmerBox(width: size, height: size),
        errorWidget: (_, __, ___) => fallback,
      ),
    );
  }
}

// ---------------- Section header ----------------

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.onSeeAll,
    this.icon,
  });

  final String title;
  final VoidCallback? onSeeAll;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppX.s16, AppX.s8, AppX.s8, AppX.s8),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 18, color: AppX.primary),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Text(title, style: Theme.of(context).textTheme.titleMedium),
          ),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(
                foregroundColor: AppX.primary,
                visualDensity: VisualDensity.compact,
              ),
              child: const Text('See all'),
            ),
        ],
      ),
    );
  }
}

// ---------------- Tag pill ----------------

class TagPill extends StatelessWidget {
  const TagPill({
    super.key,
    required this.label,
    this.icon,
    this.color = AppX.textSecondary,
  });

  final String label;
  final IconData? icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppX.surfaceMuted,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppX.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------- Job card (list) ----------------

class JobCard extends StatelessWidget {
  const JobCard({
    super.key,
    required this.job,
    this.saved = false,
    this.onSaveTap,
  });

  final Job job;
  final bool saved;
  final VoidCallback? onSaveTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppX.s16, vertical: 6),
      decoration: AppX.card(),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppX.rMd),
          onTap: () => context.push('/jobs/${job.id}'),
          child: Padding(
            padding: const EdgeInsets.all(AppX.s16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CompanyLogo(
                      url: job.company?.logoUrl,
                      name: job.companyName,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            job.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            job.companyName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                    if (onSaveTap != null)
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        icon: Icon(
                          saved
                              ? Icons.bookmark_rounded
                              : Icons.bookmark_border_rounded,
                          color: saved ? AppX.primary : AppX.textTertiary,
                        ),
                        onPressed: onSaveTap,
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    TagPill(
                      label: job.location.isNotEmpty
                          ? job.location
                          : job.district,
                      icon: Icons.place_outlined,
                    ),
                    TagPill(
                      label: jobTypeLabel(job.jobType),
                      icon: Icons.work_outline_rounded,
                    ),
                    if (job.experience.isNotEmpty)
                      TagPill(
                        label: job.experience,
                        icon: Icons.timeline_rounded,
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(
                      Icons.payments_outlined,
                      size: 16,
                      color: AppX.emerald,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      formatSalary(job.salaryMin, job.salaryMax),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppX.textPrimary,
                        fontSize: 13.5,
                      ),
                    ),
                    const Spacer(),
                    if (job.isUrgent) _flag('Urgent', AppX.rose),
                    if (job.isFeatured) _flag('Featured', AppX.amber),
                    Text(
                      relativeTime(job.createdAt),
                      style: const TextStyle(
                        color: AppX.textTertiary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _flag(String label, Color c) => Container(
    margin: const EdgeInsets.only(right: 8),
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: AppX.pill(color: c),
    child: Text(
      label,
      style: TextStyle(color: c, fontSize: 10.5, fontWeight: FontWeight.w800),
    ),
  );
}

// ---------------- Featured wide card ----------------

class FeaturedJobCard extends StatelessWidget {
  const FeaturedJobCard({super.key, required this.job});
  final Job job;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 290,
      margin: const EdgeInsets.only(left: AppX.s16),
      decoration: BoxDecoration(
        gradient: AppX.heroGradient,
        borderRadius: BorderRadius.circular(AppX.rLg),
        boxShadow: AppX.softShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppX.rLg),
          onTap: () => context.push('/jobs/${job.id}'),
          child: Padding(
            padding: const EdgeInsets.all(AppX.s16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppX.rSm),
                      ),
                      child: CompanyLogo(
                        url: job.company?.logoUrl,
                        name: job.companyName,
                        size: 36,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.22),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'Featured',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  job.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  job.companyName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 13,
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    const Icon(
                      Icons.place_outlined,
                      size: 15,
                      color: Colors.white70,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        job.district.isNotEmpty ? job.district : job.location,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  formatSalary(job.salaryMin, job.salaryMax),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------- Skeletons (shimmer) ----------------

class _ShimmerBox extends StatelessWidget {
  const _ShimmerBox({this.width, this.height, this.radius = 8});
  final double? width;
  final double? height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppX.surfaceMuted,
      highlightColor: const Color(0xFFF8FAFC),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

class SkeletonBox extends StatelessWidget {
  const SkeletonBox({super.key, this.width, this.height, this.radius = 8});
  final double? width;
  final double? height;
  final double radius;
  @override
  Widget build(BuildContext context) =>
      _ShimmerBox(width: width, height: height, radius: radius);
}

class JobCardSkeleton extends StatelessWidget {
  const JobCardSkeleton({super.key});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppX.s16, vertical: 6),
      padding: const EdgeInsets.all(AppX.s16),
      decoration: AppX.card(),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _ShimmerBox(width: 48, height: 48, radius: 12),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _ShimmerBox(width: 180, height: 14),
                    SizedBox(height: 8),
                    _ShimmerBox(width: 120, height: 12),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 14),
          _ShimmerBox(width: double.infinity, height: 12),
          SizedBox(height: 8),
          _ShimmerBox(width: 220, height: 12),
        ],
      ),
    );
  }
}

class JobListSkeleton extends StatelessWidget {
  const JobListSkeleton({super.key, this.count = 5});
  final int count;
  @override
  Widget build(BuildContext context) =>
      Column(children: List.generate(count, (_) => const JobCardSkeleton()));
}

// ---------------- Empty / error states ----------------

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    this.message,
    this.icon = Icons.search_off_rounded,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact =
            constraints.hasBoundedHeight && constraints.maxHeight < 220;

        return Center(
          child: Padding(
            padding: compact
                ? const EdgeInsets.symmetric(horizontal: 16, vertical: 8)
                : const EdgeInsets.all(AppX.s32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: EdgeInsets.all(compact ? 12 : 20),
                  decoration: const BoxDecoration(
                    color: AppX.surfaceMuted,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    icon,
                    size: compact ? 28 : 40,
                    color: AppX.textTertiary,
                  ),
                ),
                if (!compact) ...[
                  const SizedBox(height: 16),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
                if (!compact && message != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    message!,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
                if (!compact && actionLabel != null && onAction != null) ...[
                  const SizedBox(height: 18),
                  OutlinedButton(
                    onPressed: onAction,
                    child: Text(actionLabel!),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class ErrorRetry extends StatelessWidget {
  const ErrorRetry({super.key, required this.onRetry, this.message});
  final VoidCallback onRetry;
  final String? message;

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.wifi_off_rounded,
      title: 'Something went wrong',
      message: message ?? 'Please check your connection and try again.',
      actionLabel: 'Retry',
      onAction: onRetry,
    );
  }
}
