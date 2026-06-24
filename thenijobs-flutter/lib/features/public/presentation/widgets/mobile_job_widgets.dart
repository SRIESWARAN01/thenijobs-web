import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';

String friendlyJobType(JobType type) {
  switch (type) {
    case JobType.fullTime:
      return 'Full Time';
    case JobType.partTime:
      return 'Part Time';
    case JobType.internship:
      return 'Internship';
    case JobType.remote:
      return 'Remote';
    case JobType.workFromHome:
      return 'WFH';
    case JobType.fresher:
      return 'Fresher';
    case JobType.contract:
      return 'Contract';
  }
}

String formatSalaryRange(double? min, double? max) {
  final formatter = NumberFormat.decimalPattern('en_IN');
  if (min != null && max != null) {
    return 'INR ${formatter.format(min)} - ${formatter.format(max)}';
  }
  if (min != null) return 'From INR ${formatter.format(min)}';
  if (max != null) return 'Up to INR ${formatter.format(max)}';
  return 'Salary negotiable';
}

String formatPostedTime(DateTime? dateTime) {
  if (dateTime == null) return 'Recently';
  final difference = DateTime.now().difference(dateTime);
  if (difference.inDays >= 30) {
    return '${(difference.inDays / 30).floor()} mo ago';
  }
  if (difference.inDays >= 1) return '${difference.inDays} d ago';
  if (difference.inHours >= 1) return '${difference.inHours} hr ago';
  if (difference.inMinutes >= 1) return '${difference.inMinutes} min ago';
  return 'Just now';
}

class JobSignalChip extends StatelessWidget {
  const JobSignalChip({
    super.key,
    required this.icon,
    required this.label,
    this.color = AppTheme.lightTextSecondary,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 220),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class NativeJobCard extends StatelessWidget {
  const NativeJobCard({
    super.key,
    required this.job,
    required this.onTap,
    this.onSave,
    this.isSaved = false,
    this.compact = false,
  });

  final Job job;
  final VoidCallback onTap;
  final VoidCallback? onSave;
  final bool isSaved;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final titleStyle = Theme.of(context).textTheme.titleMedium?.copyWith(
      fontSize: compact ? 15 : 17,
      fontWeight: FontWeight.w900,
      color: AppTheme.lightTextPrimary,
      height: 1.2,
    );
    final company = job.companyName.isNotEmpty
        ? job.companyName
        : 'Verified Employer';
    final location = job.location.isNotEmpty ? job.location : job.district;
    final skills = job.skills.take(compact ? 2 : 4).toList();

    return Semantics(
      button: true,
      label: '${job.title}, $company',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppTheme.lightBorder),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0F111827),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CompanyMark(name: company, size: compact ? 44 : 52),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            if (job.isFeatured || job.isPremium)
                              const _SmallBadge(
                                label: 'Featured',
                                color: AppTheme.brandCyan,
                              ),
                            if (job.isUrgent) ...[
                              const SizedBox(width: 6),
                              const _SmallBadge(
                                label: 'Urgent',
                                color: AppTheme.brandAmber,
                              ),
                            ],
                          ],
                        ),
                        if (job.isFeatured || job.isPremium || job.isUrgent)
                          const SizedBox(height: 8),
                        Text(
                          job.title.isNotEmpty ? job.title : 'Untitled job',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: titleStyle,
                        ),
                        const SizedBox(height: 5),
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                company,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppTheme.lightTextSecondary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.verified_rounded,
                              size: 14,
                              color: AppTheme.brandEmerald,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (onSave != null)
                    IconButton.filledTonal(
                      tooltip: isSaved ? 'Saved' : 'Save job',
                      onPressed: onSave,
                      style: IconButton.styleFrom(
                        backgroundColor: isSaved
                            ? AppTheme.brandRose.withValues(alpha: 0.12)
                            : const Color(0xFFF8FAFC),
                        fixedSize: const Size.square(40),
                      ),
                      icon: Icon(
                        isSaved
                            ? Icons.bookmark_rounded
                            : Icons.bookmark_border_rounded,
                        color: isSaved
                            ? AppTheme.brandRose
                            : AppTheme.lightTextSecondary,
                        size: 20,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  JobSignalChip(
                    icon: Icons.location_on_outlined,
                    label: location.isNotEmpty ? location : 'Tamil Nadu',
                    color: AppTheme.brandCyan,
                  ),
                  JobSignalChip(
                    icon: Icons.payments_outlined,
                    label: formatSalaryRange(job.salaryMin, job.salaryMax),
                    color: AppTheme.brandEmerald,
                  ),
                  JobSignalChip(
                    icon: Icons.work_history_outlined,
                    label: job.experience.isNotEmpty
                        ? job.experience
                        : 'Any experience',
                    color: AppTheme.brandIndigo,
                  ),
                  if (!compact)
                    JobSignalChip(
                      icon: Icons.schedule_rounded,
                      label: formatPostedTime(job.createdAt),
                      color: AppTheme.lightTextSecondary,
                    ),
                ],
              ),
              if (skills.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final skill in skills)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Text(
                          skill,
                          style: const TextStyle(
                            color: Color(0xFF334155),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
              if (!compact) ...[
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${friendlyJobType(job.jobType)} • ${job.openings} opening${job.openings == 1 ? '' : 's'}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.lightTextSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const Icon(Icons.arrow_forward_rounded, size: 18),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class CompanyMark extends StatelessWidget {
  const CompanyMark({super.key, required this.name, this.size = 52});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final letter = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'T';

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppTheme.brandIndigo.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.brandIndigo.withValues(alpha: 0.18)),
      ),
      child: Center(
        child: Text(
          letter,
          style: TextStyle(
            color: AppTheme.brandIndigo,
            fontSize: size * 0.42,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}

class JobSection extends StatelessWidget {
  const JobSection({
    super.key,
    required this.title,
    required this.jobs,
    required this.onJobTap,
    this.subtitle,
    this.onViewAll,
    this.horizontal = true,
  });

  final String title;
  final String? subtitle;
  final List<Job> jobs;
  final ValueChanged<Job> onJobTap;
  final VoidCallback? onViewAll;
  final bool horizontal;

  @override
  Widget build(BuildContext context) {
    if (jobs.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppTheme.lightTextPrimary,
                        fontSize: 19,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          color: AppTheme.lightTextSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (onViewAll != null)
                TextButton(onPressed: onViewAll, child: const Text('View all')),
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (horizontal)
          SizedBox(
            height: 244,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              scrollDirection: Axis.horizontal,
              itemBuilder: (context, index) {
                final job = jobs[index];
                final cardWidth = (MediaQuery.sizeOf(context).width - 56).clamp(
                  296.0,
                  404.0,
                );
                return SizedBox(
                  width: cardWidth,
                  child: NativeJobCard(
                    job: job,
                    compact: true,
                    onTap: () => onJobTap(job),
                  ),
                );
              },
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemCount: jobs.length,
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                for (final job in jobs)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: NativeJobCard(job: job, onTap: () => onJobTap(job)),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

class JobSkeletonList extends StatelessWidget {
  const JobSkeletonList({super.key, this.count = 4});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: List.generate(
          count,
          (index) => Container(
            height: 146,
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.lightBorder),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _SkeletonBlock(width: 52, height: 52, radius: 16),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _SkeletonBlock(width: double.infinity, height: 15),
                          SizedBox(height: 10),
                          _SkeletonBlock(width: 140, height: 12),
                        ],
                      ),
                    ),
                  ],
                ),
                Spacer(),
                _SkeletonBlock(width: double.infinity, height: 13),
                SizedBox(height: 10),
                _SkeletonBlock(width: 220, height: 13),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SkeletonBlock extends StatelessWidget {
  const _SkeletonBlock({
    required this.width,
    required this.height,
    this.radius = 8,
  });

  final double width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.35, end: 0.75),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeInOut,
      builder: (context, value, child) {
        return Opacity(opacity: value, child: child);
      },
      onEnd: () {},
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: const Color(0xFFE2E8F0),
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

class _SmallBadge extends StatelessWidget {
  const _SmallBadge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
