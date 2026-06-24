// ============================================================
// THENIJOBS — Mobile Redesign: Home shell + Home screen
// ------------------------------------------------------------
// Bottom-navigation shell (Home / Jobs / Saved / Profile). Fully
// browsable as a guest — no login wall on open. Login is only
// requested when the user saves, applies or opens their profile.
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/constants/app_constants.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/shared/data/models/user_model.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';
import 'package:thenijobs/redesign/auth/login_sheet.dart';
import 'package:thenijobs/redesign/data/job_providers.dart';
import 'package:thenijobs/redesign/profile/seeker_profile_screen.dart';
import 'package:thenijobs/redesign/search/jobs_search_screen.dart';
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';
import 'package:thenijobs/redesign/widgets/ui_kit.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;

  void _goTo(int i) => setState(() => _index = i);

  @override
  Widget build(BuildContext context) {
    final tabs = <Widget>[
      HomeTab(onOpenSearch: () => _goTo(1)),
      const JobsSearchScreen(embedded: true),
      const SavedJobsScreen(embedded: true),
      const _ProfileTab(),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _goTo,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_rounded),
            selectedIcon: Icon(Icons.manage_search_rounded),
            label: 'Jobs',
          ),
          NavigationDestination(
            icon: Icon(Icons.bookmark_border_rounded),
            selectedIcon: Icon(Icons.bookmark_rounded),
            label: 'Saved',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

// ====================================================================
// HOME TAB
// ====================================================================

class HomeTab extends ConsumerWidget {
  const HomeTab({super.key, required this.onOpenSearch});
  final VoidCallback onOpenSearch;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateStreamProvider).value;
    final greeting = _greeting();
    final name = user?.displayName.split(' ').first;

    return Scaffold(
      backgroundColor: AppX.bg,
      body: RefreshIndicator(
        color: AppX.primary,
        onRefresh: () async {
          ref.invalidate(featuredJobsProvider);
          ref.invalidate(latestJobsProvider);
          ref.invalidate(trendingJobsProvider);
          ref.invalidate(recommendedJobsProvider);
          await ref.read(latestJobsProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: 28),
          children: [
            // ---- Top bar ----
            SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppX.s16,
                  AppX.s12,
                  AppX.s16,
                  4,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$greeting${name != null ? ', $name' : ''} 👋',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Find your next opportunity',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                        ],
                      ),
                    ),
                    _IconBubble(
                      icon: Icons.notifications_none_rounded,
                      onTap: () async {
                        final ok = await ensureLoggedIn(
                          context,
                          ref,
                          reason: 'Sign in to see notifications',
                        );
                        if (ok && context.mounted) {
                          context.push('/seeker/notifications');
                        }
                      },
                    ),
                  ],
                ),
              ),
            ),
            // ---- Search bar (tap to search tab) ----
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppX.s16,
                AppX.s12,
                AppX.s16,
                AppX.s8,
              ),
              child: GestureDetector(
                onTap: onOpenSearch,
                child: Container(
                  height: 52,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: AppX.card(radius: AppX.rSm),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.search_rounded,
                        color: AppX.textTertiary,
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'Search jobs, companies, skills…',
                        style: TextStyle(
                          color: AppX.textTertiary,
                          fontSize: 14,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          gradient: AppX.brandGradient,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.tune_rounded,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // ---- Categories ----
            const SectionHeader(
              title: 'Browse by category',
              icon: Icons.grid_view_rounded,
            ),
            SizedBox(
              height: 104,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppX.s16),
                itemCount: AppConstants.jobCategories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) {
                  final cat = AppConstants.jobCategories[i];
                  return _CategoryTile(
                    label: cat,
                    onTap: () => context.push(
                      '/jobs?category=${Uri.encodeComponent(cat)}',
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            // ---- Featured ----
            SectionHeader(
              title: 'Featured jobs',
              icon: Icons.star_rounded,
              onSeeAll: onOpenSearch,
            ),
            _featured(ref),
            const SizedBox(height: 8),
            // ---- Recommended ----
            SectionHeader(
              title: user == null ? 'Popular near you' : 'Recommended for you',
              icon: Icons.recommend_rounded,
              onSeeAll: onOpenSearch,
            ),
            _horizontalJobs(ref, recommendedJobsProvider),
            const SizedBox(height: 8),
            // ---- Trending ----
            const SectionHeader(
              title: 'Trending now',
              icon: Icons.trending_up_rounded,
            ),
            _verticalJobs(ref, trendingJobsProvider, max: 4),
            const SizedBox(height: 8),
            // ---- Latest ----
            SectionHeader(
              title: 'Latest jobs',
              icon: Icons.fiber_new_rounded,
              onSeeAll: onOpenSearch,
            ),
            _verticalJobs(ref, latestJobsProvider, max: 8),
          ],
        ),
      ),
    );
  }

  Widget _featured(WidgetRef ref) {
    final async = ref.watch(featuredJobsProvider);
    return SizedBox(
      height: 178,
      child: async.when(
        loading: () => ListView(
          scrollDirection: Axis.horizontal,
          children: List.generate(
            3,
            (_) => Container(
              width: 290,
              margin: const EdgeInsets.only(left: AppX.s16),
              child: const SkeletonBox(height: 178, radius: AppX.rLg),
            ),
          ),
        ),
        error: (_, __) =>
            ErrorRetry(onRetry: () => ref.invalidate(featuredJobsProvider)),
        data: (jobs) {
          if (jobs.isEmpty) {
            return const EmptyState(
              title: 'No featured jobs yet',
              icon: Icons.star_border_rounded,
            );
          }
          return ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.only(right: AppX.s16),
            itemCount: jobs.length,
            itemBuilder: (_, i) => FeaturedJobCard(job: jobs[i]),
          );
        },
      ),
    );
  }

  Widget _horizontalJobs(
    WidgetRef ref,
    ProviderListenable<AsyncValue<List<Job>>> provider,
  ) {
    final state = ref.watch(provider);
    return SizedBox(
      height: 160,
      child: state.when(
        loading: () => ListView(
          scrollDirection: Axis.horizontal,
          children: List.generate(
            3,
            (_) => Container(
              width: 260,
              margin: const EdgeInsets.only(left: AppX.s16),
              child: const SkeletonBox(height: 160, radius: AppX.rMd),
            ),
          ),
        ),
        error: (e, s) => const SizedBox.shrink(),
        data: (jobs) {
          if (jobs.isEmpty) return const SizedBox.shrink();
          return ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.only(right: AppX.s16),
            itemCount: jobs.length,
            itemBuilder: (_, i) =>
                SizedBox(width: 280, child: JobCard(job: jobs[i])),
          );
        },
      ),
    );
  }

  Widget _verticalJobs(
    WidgetRef ref,
    ProviderListenable<AsyncValue<List<Job>>> provider, {
    required int max,
  }) {
    final state = ref.watch(provider);
    return state.when(
      loading: () => const JobListSkeleton(count: 3),
      error: (e, s) => ErrorRetry(onRetry: () {}),
      data: (jobs) {
        final list = jobs.take(max).toList();
        if (list.isEmpty) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: EmptyState(
              title: 'No jobs to show',
              icon: Icons.work_off_outlined,
            ),
          );
        }
        return Column(children: [for (final j in list) JobCard(job: j)]);
      },
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
}

// ---------------- Small building blocks ----------------

class _IconBubble extends StatelessWidget {
  const _IconBubble({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: AppX.card(radius: 14),
        child: Icon(icon, color: AppX.textPrimary),
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(AppX.rMd),
      onTap: onTap,
      child: Container(
        width: 92,
        padding: const EdgeInsets.all(10),
        decoration: AppX.card(radius: AppX.rMd),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _catColor(label).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(_catIcon(label), color: _catColor(label), size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppX.textPrimary,
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

IconData _catIcon(String c) {
  switch (c) {
    case 'IT & Software':
      return Icons.code_rounded;
    case 'Healthcare':
      return Icons.local_hospital_outlined;
    case 'Education':
      return Icons.school_outlined;
    case 'Agriculture':
      return Icons.agriculture_outlined;
    case 'Construction':
      return Icons.construction_outlined;
    case 'Manufacturing':
      return Icons.precision_manufacturing_outlined;
    case 'Retail':
      return Icons.storefront_outlined;
    case 'Finance':
      return Icons.account_balance_outlined;
    case 'Hospitality':
      return Icons.restaurant_outlined;
    case 'Transportation':
      return Icons.local_shipping_outlined;
    case 'Sales & Marketing':
      return Icons.campaign_outlined;
    case 'HR':
      return Icons.groups_outlined;
    default:
      return Icons.work_outline_rounded;
  }
}

Color _catColor(String c) {
  final colors = [
    AppX.primary,
    AppX.accent,
    AppX.violet,
    AppX.emerald,
    AppX.amber,
    AppX.rose,
  ];
  return colors[c.hashCode.abs() % colors.length];
}

// ====================================================================
// PROFILE TAB (role-aware)
// ====================================================================

class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateStreamProvider).value;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Account')),
        body: EmptyState(
          icon: Icons.person_outline_rounded,
          title: 'You are browsing as a guest',
          message:
              'Sign in to manage your profile, resume, saved and applied jobs.',
          actionLabel: 'Sign in',
          onAction: () =>
              ensureLoggedIn(context, ref, reason: 'Sign in to continue'),
        ),
      );
    }

    // Job seekers get the full profile; employers get an account hub.
    if (user.role == UserRole.jobSeeker) {
      return const SeekerProfileScreenM3(embedded: true);
    }

    final isEmployer =
        user.role == UserRole.employer ||
        user.role == UserRole.businessOwner ||
        user.role == UserRole.supplier ||
        user.role == UserRole.serviceProvider;

    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: ListView(
        padding: const EdgeInsets.all(AppX.s16),
        children: [
          Container(
            padding: const EdgeInsets.all(AppX.s16),
            decoration: AppX.card(),
            child: Row(
              children: [
                CompanyLogo(
                  url: user.photoURL,
                  name: user.displayName,
                  size: 56,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.displayName.isEmpty ? 'Member' : user.displayName,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        user.email,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (isEmployer)
            ElevatedButton.icon(
              onPressed: () => context.push('/employer/dashboard'),
              icon: const Icon(Icons.dashboard_rounded),
              label: const Text('Open employer dashboard'),
            ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () => ref.read(authNotifierProvider.notifier).logout(),
            icon: const Icon(Icons.logout_rounded),
            label: const Text('Sign out'),
          ),
        ],
      ),
    );
  }
}
