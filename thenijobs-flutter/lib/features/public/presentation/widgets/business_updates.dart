// ============================================================
// THENIJOBS — BusinessUpdates Widget (Dart Port)
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';

class FeedUpdate {
  final String id;
  final String type;
  final String title;
  final String subtitle;
  final String time;
  final String href;
  final IconData icon;
  final Color toneColor;
  final Color toneBg;
  final DateTime createdAt;

  FeedUpdate({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.time,
    required this.href,
    required this.icon,
    required this.toneColor,
    required this.toneBg,
    required this.createdAt,
  });
}

class BusinessUpdates extends ConsumerWidget {
  const BusinessUpdates({super.key});

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return 'Recently';
    final difference = DateTime.now().difference(dateTime);
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobsAsync = ref.watch(trendingJobsProvider);
    final companiesAsync = ref.watch(featuredBusinessesProvider);
    final servicesAsync = ref.watch(latestServicesProvider);

    final isWide = MediaQuery.of(context).size.width > 768;

    // Loading check
    final isLoading =
        jobsAsync.isLoading ||
        companiesAsync.isLoading ||
        servicesAsync.isLoading;

    // Map and combine
    final jobsList = jobsAsync.value ?? [];
    final companiesList = companiesAsync.value ?? [];
    final servicesList = servicesAsync.value ?? [];

    final List<FeedUpdate> updates = [];

    for (var job in jobsList.take(3)) {
      updates.add(
        FeedUpdate(
          id: 'job-${job.id}',
          type: 'Job',
          title: job.title,
          subtitle: job.companyName.isNotEmpty
              ? job.companyName
              : 'Verified Employer',
          time: _formatTime(job.createdAt),
          href: '/jobs/${job.id}',
          icon: Icons.work_outline,
          toneColor: Colors.amber.shade800,
          toneBg: const Color(0xFFFFFBEB), // amber-50
          createdAt: job.createdAt,
        ),
      );
    }

    for (var company in companiesList.take(3)) {
      updates.add(
        FeedUpdate(
          id: 'company-${company.id}',
          type: 'Business',
          title: company.name,
          subtitle: company.category.isNotEmpty
              ? company.category
              : 'Local Company',
          time: _formatTime(company.createdAt),
          href:
              '/company/${company.slug.isNotEmpty ? company.slug : company.id}',
          icon: Icons.business_outlined,
          toneColor: Colors.blue.shade800,
          toneBg: const Color(0xFFEFF6FF), // blue-50
          createdAt: company.createdAt,
        ),
      );
    }

    for (var service in servicesList.take(3)) {
      updates.add(
        FeedUpdate(
          id: 'service-${service.id}',
          type: 'Service',
          title: service.name,
          subtitle: service.providerName.isNotEmpty
              ? service.providerName
              : 'Service Provider',
          time: _formatTime(service.createdAt),
          href: '/services',
          icon: Icons.construction_outlined,
          toneColor: TailwindColors.emerald.shade800,
          toneBg: const Color(0xFFECFDF5), // emerald-50
          createdAt: service.createdAt,
        ),
      );
    }

    // Sort by createdAt descending
    updates.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    final feedItems = updates.take(4).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1100),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: TailwindColors.slate.shade200),
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
            children: [
              // Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.teal.shade50,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.trending_up,
                                color: Colors.teal,
                                size: 16,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'BUSINESS FEED',
                              style: TextStyle(
                                color: Colors.teal,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Latest company updates',
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'New jobs, products, services and business announcements in one feed.',
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
                          'View feed',
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

              // Feed Content
              if (isLoading && feedItems.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 32.0),
                    child: CircularProgressIndicator(strokeWidth: 3),
                  ),
                )
              else if (feedItems.isEmpty)
                _buildEmptyState()
              else
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: isWide ? 2 : 1,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: isWide ? 3.0 : 3.4,
                  ),
                  itemCount: feedItems.length,
                  itemBuilder: (context, index) {
                    final update = feedItems[index];

                    return InkWell(
                      onTap: () => context.push(update.href),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: TailwindColors.slate.shade50,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: TailwindColors.slate.shade100,
                          ),
                        ),
                        child: Row(
                          children: [
                            // Icon Box
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: update.toneBg,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                update.icon,
                                color: update.toneColor,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),

                            // Texts
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(100),
                                      border: Border.all(
                                        color: TailwindColors.slate.shade200,
                                      ),
                                    ),
                                    child: Text(
                                      update.type.toUpperCase(),
                                      style: TextStyle(
                                        color: TailwindColors.slate.shade500,
                                        fontSize: 8,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    update.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          update.subtitle,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 10,
                                            color:
                                                TailwindColors.slate.shade500,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      const Icon(
                                        Icons.schedule,
                                        size: 10,
                                        color: Colors.grey,
                                      ),
                                      const SizedBox(width: 3),
                                      Text(
                                        update.time,
                                        style: TextStyle(
                                          color: TailwindColors.slate.shade500,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Icon(
                              Icons.chevron_right,
                              color: TailwindColors.slate.shade300,
                              size: 18,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: TailwindColors.slate.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: TailwindColors.slate.shade300),
      ),
      child: Column(
        children: [
          const Text(
            'No updates yet',
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Approved jobs, verified businesses, and active services will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: TailwindColors.slate.shade500,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
