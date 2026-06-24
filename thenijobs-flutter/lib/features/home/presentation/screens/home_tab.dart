// ============================================================
// THENIJOBS — Mobile Home Tab (Phase 3 Redesign)
// ============================================================
//
// This is the new mobile-first home experience.
// Users see jobs immediately without logging in.
// Design inspired by LinkedIn, Indeed, Naukri.
//
// Layout: Search → Categories → Featured → Latest → Trending

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_colors.dart';
import 'package:thenijobs/core/theme/app_typography.dart';
import 'package:thenijobs/core/widgets/job_card_compact.dart';
import 'package:thenijobs/core/widgets/shimmer_loading.dart';
import 'package:thenijobs/core/widgets/empty_state.dart';

// ───────────── Providers ─────────────

final _featuredJobsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final snap = await FirebaseFirestore.instance
      .collection('jobs')
      .where('status', isEqualTo: 'active')
      .where('featured', isEqualTo: true)
      .orderBy('createdAt', descending: true)
      .limit(10)
      .get();
  return snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
});

final _latestJobsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final snap = await FirebaseFirestore.instance
      .collection('jobs')
      .where('status', isEqualTo: 'active')
      .orderBy('createdAt', descending: true)
      .limit(20)
      .get();
  return snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
});

// ───────────── Categories ─────────────

const List<Map<String, dynamic>> _categories = [
  {
    'icon': Icons.computer_rounded,
    'label': 'IT & Tech',
    'color': Color(0xFF3B82F6),
  },
  {
    'icon': Icons.local_hospital_rounded,
    'label': 'Healthcare',
    'color': Color(0xFF10B981),
  },
  {
    'icon': Icons.account_balance_rounded,
    'label': 'Banking',
    'color': Color(0xFFF59E0B),
  },
  {
    'icon': Icons.school_rounded,
    'label': 'Education',
    'color': Color(0xFF8B5CF6),
  },
  {
    'icon': Icons.storefront_rounded,
    'label': 'Sales',
    'color': Color(0xFFF97316),
  },
  {
    'icon': Icons.engineering_rounded,
    'label': 'Engineering',
    'color': Color(0xFF06B6D4),
  },
  {
    'icon': Icons.restaurant_rounded,
    'label': 'Hospitality',
    'color': Color(0xFFEC4899),
  },
  {
    'icon': Icons.directions_car_rounded,
    'label': 'Transport',
    'color': Color(0xFF64748B),
  },
];

// ───────────── Home Tab ─────────────

class HomeTab extends ConsumerWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_featuredJobsProvider);
          ref.invalidate(_latestJobsProvider);
        },
        color: AppColors.primary,
        child: CustomScrollView(
          slivers: [
            // ── Collapsible App Bar with Search ──
            SliverAppBar(
              expandedHeight: 140,
              floating: true,
              snap: true,
              backgroundColor: AppColors.lightSurface,
              surfaceTintColor: AppColors.lightSurface,
              elevation: 0,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: AppColors.heroGradient,
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Find Your Dream Job',
                            style: AppTypography.h2.copyWith(
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Explore thousands of opportunities',
                            style: AppTypography.bodyMedium.copyWith(
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(56),
                child: Container(
                  color: AppColors.lightSurface,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: GestureDetector(
                    onTap: () => context.push('/jobs'),
                    child: Container(
                      height: 46,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppColors.lightInputFill,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.lightDivider),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.search_rounded,
                            color: AppColors.lightTextTertiary,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Search jobs, companies...',
                            style: AppTypography.bodyMedium.copyWith(
                              color: AppColors.lightTextTertiary,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: AppColors.primarySurface,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.tune_rounded,
                              color: AppColors.primary,
                              size: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // ── Categories ──
            SliverToBoxAdapter(child: _CategoriesSection()),

            // ── Featured Jobs ──
            SliverToBoxAdapter(
              child: _SectionHeader(
                title: '🔥 Featured Jobs',
                onViewAll: () => context.push('/jobs'),
              ),
            ),
            SliverToBoxAdapter(child: _FeaturedJobsCarousel()),

            // ── Latest Jobs ──
            SliverToBoxAdapter(
              child: _SectionHeader(
                title: '⏱ Latest Jobs',
                onViewAll: () => context.push('/jobs'),
              ),
            ),
            _LatestJobsList(),

            // ── Bottom padding ──
            const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
          ],
        ),
      ),
    );
  }
}

// ───────────── Section Header ─────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onViewAll;

  const _SectionHeader({required this.title, this.onViewAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: AppTypography.h3),
          if (onViewAll != null)
            GestureDetector(
              onTap: onViewAll,
              child: Text(
                'View All',
                style: AppTypography.labelMedium.copyWith(
                  color: AppColors.primary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ───────────── Categories Section ─────────────

class _CategoriesSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final cat = _categories[index];
          return GestureDetector(
            onTap: () => context.push('/jobs?category=${cat['label']}'),
            child: Container(
              width: 76,
              margin: const EdgeInsets.only(right: 10),
              child: Column(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: (cat['color'] as Color).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      cat['icon'] as IconData,
                      color: cat['color'] as Color,
                      size: 24,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    cat['label'] as String,
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.lightTextSecondary,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ───────────── Featured Jobs Carousel ─────────────

class _FeaturedJobsCarousel extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final featuredAsync = ref.watch(_featuredJobsProvider);

    return featuredAsync.when(
      loading: () => SizedBox(
        height: 180,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: 3,
          itemBuilder: (_, __) => Container(
            width: 280,
            margin: const EdgeInsets.only(right: 12),
            child: const ShimmerLoading(height: 160, borderRadius: 16),
          ),
        ),
      ),
      error: (_, __) => const SizedBox.shrink(),
      data: (jobs) {
        if (jobs.isEmpty) return const SizedBox.shrink();
        return SizedBox(
          height: 180,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: jobs.length,
            itemBuilder: (context, index) {
              final job = jobs[index];
              return _FeaturedJobCard(job: job);
            },
          ),
        );
      },
    );
  }
}

class _FeaturedJobCard extends StatelessWidget {
  final Map<String, dynamic> job;

  const _FeaturedJobCard({required this.job});

  @override
  Widget build(BuildContext context) {
    final title = job['title'] ?? job['jobTitle'] ?? 'Untitled';
    final company = job['companyName'] ?? job['company'] ?? '';
    final location = job['location'] ?? job['district'] ?? '';
    final salary = job['salary'] ?? job['salaryRange'] ?? '';
    return GestureDetector(
      onTap: () => context.push('/jobs/${job['id']}'),
      child: Container(
        width: 280,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.25),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '⭐ Featured',
                    style: AppTypography.labelSmall.copyWith(
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: AppTypography.h4.copyWith(color: Colors.white),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  company,
                  style: AppTypography.bodyMedium.copyWith(
                    color: Colors.white70,
                  ),
                  maxLines: 1,
                ),
              ],
            ),
            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  size: 14,
                  color: Colors.white60,
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    location,
                    style: AppTypography.caption.copyWith(
                      color: Colors.white60,
                    ),
                    maxLines: 1,
                  ),
                ),
                if (salary.toString().isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      salary.toString(),
                      style: AppTypography.labelSmall.copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ───────────── Latest Jobs List ─────────────

class _LatestJobsList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final latestAsync = ref.watch(_latestJobsProvider);

    return latestAsync.when(
      loading: () => const SliverToBoxAdapter(child: JobListSkeleton(count: 5)),
      error: (err, _) => SliverToBoxAdapter(
        child: EmptyState(
          icon: Icons.error_outline,
          title: 'Failed to load jobs',
          subtitle: err.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(_latestJobsProvider),
        ),
      ),
      data: (jobs) {
        if (jobs.isEmpty) {
          return const SliverToBoxAdapter(
            child: EmptyState(
              icon: Icons.work_outline_rounded,
              title: 'No jobs yet',
              subtitle: 'Check back soon for new opportunities',
            ),
          );
        }
        return SliverList(
          delegate: SliverChildBuilderDelegate((context, index) {
            final job = jobs[index];
            final createdAt = job['createdAt'];
            DateTime? postedAt;
            if (createdAt is Timestamp) {
              postedAt = createdAt.toDate();
            }

            return JobCardCompact(
              jobId: job['id'] ?? '',
              title: job['title'] ?? job['jobTitle'] ?? 'Untitled',
              company: job['companyName'] ?? job['company'] ?? '',
              companyLogoUrl: job['companyLogo'] as String?,
              location: job['location'] ?? job['district'] ?? '',
              salary: (job['salary'] ?? job['salaryRange'])?.toString(),
              jobType: job['jobType'] ?? job['type'] ?? 'Full-time',
              experience: job['experience']?.toString(),
              isFeatured: job['featured'] == true,
              postedAt: postedAt,
            );
          }, childCount: jobs.length),
        );
      },
    );
  }
}
