// ============================================================
// THENIJOBS — TrendingJobs Widget (Dart Port)
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';

class TrendingJobs extends ConsumerWidget {
  const TrendingJobs({super.key});

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return 'Recently';
    final difference = DateTime.now().difference(dateTime);
    if (difference.inDays >= 365) {
      final yrs = (difference.inDays / 365).floor();
      return '$yrs yr ago';
    }
    if (difference.inDays >= 30) {
      final mos = (difference.inDays / 30).floor();
      return '$mos mo ago';
    }
    if (difference.inDays >= 1) {
      return '${difference.inDays} d ago';
    }
    if (difference.inHours >= 1) {
      return '${difference.inHours} hr ago';
    }
    if (difference.inMinutes >= 1) {
      return '${difference.inMinutes} min ago';
    }
    return 'Just now';
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'agriculture':
        return Icons.eco_outlined;
      case 'finance':
      case 'accounts':
        return Icons.account_balance_wallet_outlined;
      case 'education':
        return Icons.school_outlined;
      case 'it & software':
        return Icons.laptop_chromebook_outlined;
      default:
        return Icons.work_outline;
    }
  }

  String _formatSalary(double? min, double? max, NumberFormat formatter) {
    if (min != null && max != null) {
      return '₹${formatter.format(min)} - ₹${formatter.format(max)}';
    }
    return 'Salary Negotiable';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trendingJobsAsync = ref.watch(trendingJobsProvider);
    final isWide = MediaQuery.of(context).size.width > 768;
    final formatter = NumberFormat.decimalPattern('en_IN');

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Row
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'LATEST JOBS',
                          style: TextStyle(
                            color: Colors.teal,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'இன்று வந்த வேலை வாய்ப்புகள்',
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Verified local employers-லிருந்து fresh openings.',
                          style: TextStyle(
                            color: TailwindColors.slate.shade500,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton(
                    onPressed: () => context.push('/jobs'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: TailwindColors.slate.shade800,
                      surfaceTintColor: Colors.white,
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: TailwindColors.slate.shade200),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'View all jobs',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(width: 6),
                        Icon(Icons.arrow_forward, size: 14),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Jobs Content
              trendingJobsAsync.when(
                data: (jobs) {
                  if (jobs.isEmpty) {
                    return _buildEmptyState(context);
                  }
                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: isWide ? 3 : 1,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: isWide ? 0.95 : 1.2,
                    ),
                    itemCount: jobs.length,
                    itemBuilder: (context, index) {
                      final job = jobs[index];
                      final icon = _getCategoryIcon(job.category);
                      final salaryStr = _formatSalary(
                        job.salaryMin,
                        job.salaryMax,
                        formatter,
                      );
                      final timeStr = _formatTime(job.createdAt);
                      final typeStr = job
                          .jobType
                          .name; // fullTime -> fullTime, contract -> contract

                      return InkWell(
                        onTap: () => context.push('/jobs/${job.id}'),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: TailwindColors.slate.shade200,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Icon & Badges
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: Colors.teal.shade50,
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                        ),
                                        child: Icon(
                                          icon,
                                          color: Colors.teal.shade800,
                                          size: 20,
                                        ),
                                      ),
                                      Row(
                                        children: [
                                          if (job.isUrgent) ...[
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 8,
                                                    vertical: 4,
                                                  ),
                                              decoration: BoxDecoration(
                                                color: const Color(
                                                  0xFFFFFBEB,
                                                ), // amber-50
                                                borderRadius:
                                                    BorderRadius.circular(100),
                                                border: Border.all(
                                                  color: const Color(
                                                    0xFFFDE68A,
                                                  ),
                                                ),
                                              ),
                                              child: const Row(
                                                children: [
                                                  Icon(
                                                    Icons.bolt,
                                                    size: 10,
                                                    color: Color(0xFFB45309),
                                                  ),
                                                  SizedBox(width: 2),
                                                  Text(
                                                    'Urgent',
                                                    style: TextStyle(
                                                      color: Color(0xFFB45309),
                                                      fontSize: 9,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                          ],
                                          if (job.isPremium)
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 8,
                                                    vertical: 4,
                                                  ),
                                              decoration: BoxDecoration(
                                                color: const Color(
                                                  0xFFEFF6FF,
                                                ), // blue-50
                                                borderRadius:
                                                    BorderRadius.circular(100),
                                                border: Border.all(
                                                  color: const Color(
                                                    0xFFBFDBFE,
                                                  ),
                                                ),
                                              ),
                                              child: const Row(
                                                children: [
                                                  Icon(
                                                    Icons.star,
                                                    size: 10,
                                                    color: Color(0xFF1D4ED8),
                                                  ),
                                                  SizedBox(width: 2),
                                                  Text(
                                                    'Premium',
                                                    style: TextStyle(
                                                      color: Color(0xFF1D4ED8),
                                                      fontSize: 9,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),

                                  // Title & Company
                                  Text(
                                    job.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    job.companyName.isNotEmpty
                                        ? job.companyName
                                        : 'Verified Employer',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: TailwindColors.slate.shade500,
                                    ),
                                  ),
                                  const SizedBox(height: 10),

                                  // Skills row
                                  if (job.skills.isNotEmpty)
                                    Wrap(
                                      spacing: 4,
                                      runSpacing: 4,
                                      children: job.skills.take(3).map((skill) {
                                        return Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 3,
                                          ),
                                          decoration: BoxDecoration(
                                            color:
                                                TailwindColors.slate.shade100,
                                            borderRadius: BorderRadius.circular(
                                              100,
                                            ),
                                          ),
                                          child: Text(
                                            skill,
                                            style: TextStyle(
                                              color:
                                                  TailwindColors.slate.shade600,
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                ],
                              ),

                              // Location, Salary, Time & Apply Button
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const Divider(
                                    height: 20,
                                    color: Color(0xFFF1F5F9),
                                  ),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.location_on_outlined,
                                        size: 12,
                                        color: Colors.teal,
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          job.location.isNotEmpty
                                              ? job.location
                                              : job.district,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 11,
                                            color:
                                                TailwindColors.slate.shade500,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.payments_outlined,
                                        size: 12,
                                        color: AppTheme.brandEmerald,
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          salaryStr,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 11,
                                            color:
                                                TailwindColors.slate.shade500,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.schedule_outlined,
                                        size: 12,
                                        color: Colors.grey,
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          '$timeStr - ${typeStr.replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m[1]}').toUpperCase()}',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 11,
                                            color:
                                                TailwindColors.slate.shade500,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Container(
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0F172A),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Center(
                                      child: Text(
                                        'Apply Now',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 48.0),
                    child: CircularProgressIndicator(strokeWidth: 3),
                  ),
                ),
                error: (err, stack) => _buildEmptyState(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: TailwindColors.slate.shade300,
          style: BorderStyle.solid,
        ), // Dart custom borders can do dash border if custom painted, solid fallback is clean.
      ),
      child: Column(
        children: [
          const Text(
            'No active jobs yet',
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Approved employer jobs from Firebase will appear here automatically.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: TailwindColors.slate.shade500,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => context.push('/employer/post-job'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Post first job',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                SizedBox(width: 6),
                Icon(Icons.arrow_forward, size: 14),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
