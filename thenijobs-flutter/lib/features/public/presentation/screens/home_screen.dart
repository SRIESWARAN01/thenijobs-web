import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/constants/app_constants.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';
import 'package:thenijobs/features/public/presentation/widgets/mobile_job_widgets.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(allJobsProvider);
    ref.invalidate(activeJobsCountProvider);
    await Future<void>.delayed(const Duration(milliseconds: 350));
  }

  void _openSearch([String? category]) {
    final query = _searchController.text.trim();
    final params = <String, String>{
      if (query.isNotEmpty) 'search': query,
      if (category != null && category.isNotEmpty) 'category': category,
      'focus': 'search',
    };
    final uri = Uri(path: '/jobs', queryParameters: params);
    context.go(uri.toString());
  }

  List<Job> _latestJobs(List<Job> jobs) {
    return [...jobs]..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  List<Job> _featuredJobs(List<Job> jobs) {
    final featured = jobs
        .where((job) => job.isFeatured || job.isPremium || job.isUrgent)
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return featured.isEmpty ? _latestJobs(jobs).take(5).toList() : featured;
  }

  List<Job> _trendingJobs(List<Job> jobs) {
    return [...jobs]
      ..sort((a, b) {
        final bScore = b.viewCount + (b.applicationsCount * 3) + (b.isUrgent ? 20 : 0);
        final aScore = a.viewCount + (a.applicationsCount * 3) + (a.isUrgent ? 20 : 0);
        return bScore.compareTo(aScore);
      });
  }

  List<Job> _recommendedJobs(List<Job> jobs) {
    final user = ref.read(authStateStreamProvider).value;
    final preferences = user?.preferences;
    final preferredLocations = preferences?.locations ?? const <String>[];
    final preferredTypes = preferences?.jobTypes ?? const <String>[];

    final scored = jobs.map((job) {
      var score = 0;
      if (job.isFeatured) score += 4;
      if (job.isPremium) score += 3;
      if (job.isUrgent) score += 2;
      if (preferredLocations.any(
        (item) =>
            job.location.toLowerCase().contains(item.toLowerCase()) ||
            job.district.toLowerCase().contains(item.toLowerCase()),
      )) {
        score += 6;
      }
      if (preferredTypes.any(
        (item) => friendlyJobType(job.jobType).toLowerCase().contains(item.toLowerCase()),
      )) {
        score += 5;
      }
      return MapEntry(job, score);
    }).toList()
      ..sort((a, b) {
        final byScore = b.value.compareTo(a.value);
        if (byScore != 0) return byScore;
        return b.key.createdAt.compareTo(a.key.createdAt);
      });

    return scored.map((entry) => entry.key).toList();
  }

  @override
  Widget build(BuildContext context) {
    final jobsAsync = ref.watch(allJobsProvider);
    final activeJobsAsync = ref.watch(activeJobsCountProvider);
    final user = ref.watch(authStateStreamProvider).value;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: _HomeHeader(
                  searchController: _searchController,
                  userName: user?.displayName,
                  activeJobsLabel: activeJobsAsync.maybeWhen(
                    data: (count) => count > 0 ? '$count active jobs' : 'Live jobs',
                    orElse: () => 'Live jobs',
                  ),
                  onSearch: _openSearch,
                ),
              ),
              SliverToBoxAdapter(
                child: jobsAsync.when(
                  data: (jobs) {
                    final activeJobs = jobs.where((job) => job.isActive).toList();
                    final latest = _latestJobs(activeJobs);
                    final featured = _featuredJobs(activeJobs).take(6).toList();
                    final trending = _trendingJobs(activeJobs).take(6).toList();
                    final recommended = _recommendedJobs(activeJobs).take(5).toList();

                    if (activeJobs.isEmpty) {
                      return const _NoJobsState();
                    }

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        _CategoryRail(onSelected: _openSearch),
                        const SizedBox(height: 24),
                        JobSection(
                          title: 'Featured jobs',
                          subtitle: 'Premium and urgent openings',
                          jobs: featured,
                          onViewAll: () => context.go('/jobs?sort=featured'),
                          onJobTap: (job) => context.push('/jobs/${job.id}'),
                        ),
                        const SizedBox(height: 26),
                        JobSection(
                          title: 'Latest jobs',
                          subtitle: 'Fresh roles added by recruiters',
                          jobs: latest.take(5).toList(),
                          horizontal: false,
                          onViewAll: () => context.go('/jobs?sort=latest'),
                          onJobTap: (job) => context.push('/jobs/${job.id}'),
                        ),
                        const SizedBox(height: 18),
                        JobSection(
                          title: 'Trending jobs',
                          subtitle: 'High activity roles right now',
                          jobs: trending,
                          onViewAll: () => context.go('/jobs?sort=trending'),
                          onJobTap: (job) => context.push('/jobs/${job.id}'),
                        ),
                        const SizedBox(height: 26),
                        JobSection(
                          title: 'Recommended for you',
                          subtitle: user == null
                              ? 'Sign in later to personalize this feed'
                              : 'Based on your role and preferences',
                          jobs: recommended,
                          horizontal: false,
                          onViewAll: () => context.go('/jobs?sort=recommended'),
                          onJobTap: (job) => context.push('/jobs/${job.id}'),
                        ),
                        const SizedBox(height: 24),
                      ],
                    );
                  },
                  loading: () => const Padding(
                    padding: EdgeInsets.only(top: 20),
                    child: JobSkeletonList(count: 5),
                  ),
                  error: (_, __) => const _NoJobsState(
                    title: 'Jobs could not load',
                    message: 'Pull down to refresh or try again shortly.',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({
    required this.searchController,
    required this.onSearch,
    required this.activeJobsLabel,
    this.userName,
  });

  final TextEditingController searchController;
  final VoidCallback onSearch;
  final String activeJobsLabel;
  final String? userName;

  @override
  Widget build(BuildContext context) {
    final displayName = userName?.trim();

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 22),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppTheme.lightBorder)),
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
                  color: AppTheme.brandRose.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.work_rounded, color: AppTheme.brandRose),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName == null || displayName.isEmpty
                          ? 'Find your next role'
                          : 'Hi, $displayName',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.lightTextPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      activeJobsLabel,
                      style: const TextStyle(
                        color: AppTheme.lightTextSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton.filledTonal(
                tooltip: 'Notifications',
                onPressed: () => context.go('/seeker/notifications'),
                icon: const Icon(Icons.notifications_none_rounded),
              ),
            ],
          ),
          const SizedBox(height: 18),
          SearchBar(
            controller: searchController,
            hintText: 'Search jobs, skills or companies',
            leading: const Icon(Icons.search_rounded),
            trailing: [
              IconButton(
                tooltip: 'Search',
                onPressed: onSearch,
                icon: const Icon(Icons.arrow_forward_rounded),
              ),
            ],
            onSubmitted: (_) => onSearch(),
            elevation: const WidgetStatePropertyAll(0),
            backgroundColor: const WidgetStatePropertyAll(Color(0xFFF8FAFC)),
            shape: WidgetStatePropertyAll(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
            ),
            padding: const WidgetStatePropertyAll(
              EdgeInsets.symmetric(horizontal: 14),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: onSearch,
                  icon: const Icon(Icons.manage_search_rounded),
                  label: const Text('Browse jobs'),
                ),
              ),
              const SizedBox(width: 10),
              FilledButton.tonalIcon(
                onPressed: () => context.go('/employer/post-job'),
                icon: const Icon(Icons.add_business_rounded),
                label: const Text('Post'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CategoryRail extends StatelessWidget {
  const _CategoryRail({required this.onSelected});

  final ValueChanged<String> onSelected;

  static const _icons = <IconData>[
    Icons.computer_rounded,
    Icons.local_hospital_outlined,
    Icons.school_outlined,
    Icons.agriculture_outlined,
    Icons.construction_outlined,
    Icons.factory_outlined,
    Icons.storefront_outlined,
    Icons.account_balance_wallet_outlined,
  ];

  @override
  Widget build(BuildContext context) {
    final categories = AppConstants.jobCategories.take(8).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'Categories',
            style: TextStyle(
              color: AppTheme.lightTextPrimary,
              fontSize: 19,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 104,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemBuilder: (context, index) {
              final category = categories[index];
              return InkWell(
                onTap: () => onSelected(category),
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  width: 116,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppTheme.lightBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        _icons[index % _icons.length],
                        color: AppTheme.brandIndigo,
                      ),
                      const Spacer(),
                      Text(
                        category,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.lightTextPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemCount: categories.length,
          ),
        ),
      ],
    );
  }
}

class _NoJobsState extends StatelessWidget {
  const _NoJobsState({
    this.title = 'No active jobs yet',
    this.message = 'New jobs will appear here as soon as employers publish them.',
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppTheme.lightBorder),
        ),
        child: Column(
          children: [
            const Icon(Icons.work_off_outlined, size: 44, color: AppTheme.lightTextSecondary),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.lightTextPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.lightTextSecondary,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
