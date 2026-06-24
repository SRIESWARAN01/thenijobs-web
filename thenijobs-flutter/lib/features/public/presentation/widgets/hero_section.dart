// ============================================================
// THENIJOBS — HeroSection Widget (Dart Port)
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';

class HeroSection extends ConsumerStatefulWidget {
  const HeroSection({super.key});

  @override
  ConsumerState<HeroSection> createState() => _HeroSectionState();
}

class _HeroSectionState extends ConsumerState<HeroSection> {
  final _searchController = TextEditingController();
  String _selectedLocation = 'Theni';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _handleSearch() {
    final query = _searchController.text.trim();
    final params = <String, String>{};
    if (query.isNotEmpty) {
      params['search'] = query;
    }
    if (_selectedLocation != 'Tamil Nadu') {
      params['location'] = _selectedLocation;
    }
    // Convert map to query string and route
    final uri = Uri(path: '/jobs', queryParameters: params);
    context.push(uri.toString());
  }

  @override
  Widget build(BuildContext context) {
    // Watch stats
    final activeJobsAsync = ref.watch(activeJobsCountProvider);
    final totalCompaniesAsync = ref.watch(totalCompaniesCountProvider);
    final totalUsersAsync = ref.watch(totalUsersCountProvider);
    final liveUpdatesAsync = ref.watch(liveUpdatesProvider);

    final isWide = MediaQuery.of(context).size.width > 900;
    final formatter = NumberFormat.decimalPattern('en_IN');

    return Container(
      color: AppTheme.lightBg,
      child: Stack(
        children: [
          // Background Gradient Curve
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 240,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFFFFF1EB), Colors.transparent],
                ),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
            child: Align(
              alignment: Alignment.center,
              child: Container(
                constraints: const BoxConstraints(maxWidth: 1200),
                child: isWide
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 6,
                            child: _buildLeftContent(
                              activeJobsAsync,
                              totalCompaniesAsync,
                              totalUsersAsync,
                              formatter,
                            ),
                          ),
                          const SizedBox(width: 48),
                          Expanded(
                            flex: 5,
                            child: _buildRightContent(liveUpdatesAsync),
                          ),
                        ],
                      )
                    : Column(
                        children: [
                          _buildLeftContent(
                            activeJobsAsync,
                            totalCompaniesAsync,
                            totalUsersAsync,
                            formatter,
                          ),
                          const SizedBox(height: 48),
                          _buildRightContent(liveUpdatesAsync),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Left Content: Headline, Search Box, Quick Actions, Stats
  Widget _buildLeftContent(
    AsyncValue<int> activeJobs,
    AsyncValue<int> totalCompanies,
    AsyncValue<int> totalUsers,
    NumberFormat formatter,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: const Color(0xFFFFC0A8)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.shield_outlined,
                size: 14,
                color: AppTheme.brandRose,
              ),
              const SizedBox(width: 6),
              Text(
                'Theni local jobs + business directory',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.brandRose.withValues(alpha: 0.9),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Headline
        const Text(
          'Theni Jobs, Business & Services ஒரே இடத்தில்',
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 36,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
            height: 1.15,
          ),
        ),
        const SizedBox(height: 16),

        // Subtitle
        const Text(
          'வேலை தேடுபவர்களுக்கு jobs, business owners-க்கு public page, leads, calls, WhatsApp inquiries எல்லாம் mobile-லும் laptop-லும் easy-ஆ use பண்ண.',
          style: TextStyle(fontSize: 15, color: Color(0xFF475569), height: 1.5),
        ),
        const SizedBox(height: 28),

        // Search Bar container
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: TailwindColors.slate.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Search Input Row
              TextFormField(
                controller: _searchController,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
                decoration: InputDecoration(
                  hintText: 'Job, company, service தேடுங்கள்',
                  hintStyle: TextStyle(
                    color: TailwindColors.slate.shade400,
                    fontSize: 13,
                    fontWeight: FontWeight.normal,
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    size: 18,
                    color: Colors.grey,
                  ),
                  filled: true,
                  fillColor: TailwindColors.slate.shade50,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                      color: TailwindColors.slate.shade200,
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                      color: TailwindColors.slate.shade200,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppTheme.brandRose),
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Location Dropdown & Button row
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: TailwindColors.slate.shade50,
                        border: Border.all(
                          color: TailwindColors.slate.shade200,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.location_on,
                            size: 16,
                            color: AppTheme.brandRose,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedLocation,
                                isExpanded: true,
                                style: TextStyle(
                                  color: TailwindColors.slate.shade700,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                                items:
                                    [
                                          'Theni',
                                          'Madurai',
                                          'Dindigul',
                                          'Coimbatore',
                                          'Tamil Nadu',
                                        ]
                                        .map(
                                          (loc) => DropdownMenuItem(
                                            value: loc,
                                            child: Text(loc),
                                          ),
                                        )
                                        .toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() => _selectedLocation = val);
                                  }
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _handleSearch,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.brandRose,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 16,
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Search',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Quick Actions Grid
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildQuickAction(
              'Jobs தேடுங்கள்',
              '/jobs',
              Icons.work,
              AppTheme.brandRose,
              Colors.white,
            ),
            _buildQuickAction(
              'Business பார்க்க',
              '/businesses',
              Icons.business,
              Colors.white,
              TailwindColors.slate.shade800,
            ),
            _buildQuickAction(
              'Job Post',
              '/employer/post-job',
              Icons.send,
              Colors.white,
              TailwindColors.slate.shade800,
            ),
            _buildQuickAction(
              'Business Add',
              '/company/register',
              Icons.auto_awesome,
              Colors.white,
              TailwindColors.slate.shade800,
            ),
          ],
        ),
        const SizedBox(height: 32),

        // Stats Items
        Row(
          children: [
            _buildStatItem('Active Jobs', activeJobs, formatter),
            const SizedBox(width: 12),
            _buildStatItem('Local Companies', totalCompanies, formatter),
            const SizedBox(width: 12),
            _buildStatItem('Job Seekers', totalUsers, formatter),
          ],
        ),
      ],
    );
  }

  // Right Content: Visual Device Preview & Live local updates
  Widget _buildRightContent(AsyncValue<List<dynamic>> liveUpdatesAsync) {
    return Column(
      children: [
        // Browser Window Mockup
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: TailwindColors.slate.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.07),
                blurRadius: 40,
                offset: const Offset(0, 20),
              ),
            ],
          ),
          child: Column(
            children: [
              // Browser top bars
              Container(
                height: 32,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  color: TailwindColors.slate.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    _buildDot(Colors.red),
                    const SizedBox(width: 4),
                    _buildDot(Colors.amber),
                    const SizedBox(width: 4),
                    _buildDot(Colors.green),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Container(
                        height: 18,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Center(
                          child: Text(
                            'thenijobs.com',
                            style: TextStyle(
                              fontSize: 9,
                              color: Colors.grey,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Device preview mock panel
              Container(
                height: 180,
                decoration: BoxDecoration(
                  color: Colors.teal.shade50,
                  borderRadius: BorderRadius.circular(16),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Colors.teal.shade50,
                      TailwindColors.emerald.shade50,
                    ],
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.devices_rounded,
                        size: 48,
                        color: Colors.teal.shade800,
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'THE NEW THENIJOBS PORTAL',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Responsive Mobile & Laptop Friendly App',
                        style: TextStyle(
                          fontSize: 10,
                          color: TailwindColors.slate.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Mock quick link grids
              Row(
                children: [
                  Expanded(
                    child: _buildMockBtn(
                      'Jobs',
                      Icons.phone_outlined,
                      Colors.teal.shade50,
                      Colors.teal.shade900,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildMockBtn(
                      'Business',
                      Icons.chat_bubble_outline,
                      TailwindColors.emerald.shade50,
                      TailwindColors.emerald950,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildMockBtn(
                      'Services',
                      Icons.explore_outlined,
                      Colors.amber.shade50,
                      TailwindColors.amber950,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Live Local Updates Panel
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: TailwindColors.slate.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Live local updates',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      Text(
                        'Jobs, services, offers',
                        style: TextStyle(
                          fontSize: 11,
                          color: TailwindColors.slate.shade500,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const Icon(
                    Icons.check_circle_rounded,
                    color: Colors.teal,
                    size: 20,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Map list items
              liveUpdatesAsync.when(
                data: (logs) {
                  if (logs.isEmpty) {
                    return _buildNoUpdatesView();
                  }
                  return Column(
                    children: logs
                        .map(
                          (log) => _buildUpdateItem(
                            log.action,
                            '${log.target} ${log.userName.isNotEmpty ? "by ${log.userName}" : ""}',
                          ),
                        )
                        .toList(),
                  );
                },
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ),
                error: (_, __) => _buildNoUpdatesView(),
              ),

              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => context.push('/businesses'),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: TailwindColors.slate.shade200),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Explore platform',
                      style: TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(width: 8),
                    Icon(
                      Icons.arrow_forward,
                      size: 14,
                      color: Color(0xFF0F172A),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Builder Helpers
  Widget _buildQuickAction(
    String label,
    String path,
    IconData icon,
    Color bgColor,
    Color textColor,
  ) {
    final hasRing = bgColor == Colors.white;
    return InkWell(
      onTap: () => context.push(path),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: hasRing
              ? Border.all(color: TailwindColors.slate.shade200)
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: textColor),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(
    String label,
    AsyncValue<int> countAsync,
    NumberFormat formatter,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: TailwindColors.slate.shade200),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            countAsync.when(
              data: (val) => Text(
                formatter.format(val),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              loading: () => const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              error: (_, __) => const Text(
                '0',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.bold,
                color: TailwindColors.slate.shade500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDot(Color color) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }

  Widget _buildMockBtn(
    String label,
    IconData icon,
    Color bgColor,
    Color textColor,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoUpdatesView() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: TailwindColors.slate.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: TailwindColors.slate.shade100),
      ),
      child: Column(
        children: [
          const Text(
            'No live updates yet',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Admin activity and approvals will appear here.',
            style: TextStyle(
              fontSize: 10,
              color: TailwindColors.slate.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpdateItem(String title, String subtitle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: TailwindColors.slate.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(100),
              border: Border.all(color: Colors.teal.shade50),
            ),
            child: const Text(
              'Live',
              style: TextStyle(
                color: Colors.teal,
                fontSize: 8,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
