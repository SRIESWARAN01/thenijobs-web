import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/providers/auth_provider.dart';

class SeekerDashboard extends ConsumerStatefulWidget {
  const SeekerDashboard({super.key});

  @override
  ConsumerState<SeekerDashboard> createState() => _SeekerDashboardState();
}

class _SeekerDashboardState extends ConsumerState<SeekerDashboard> {
  int _currentNavIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final userName = authState.user?.displayName ?? 'Job Seeker';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [AppColors.seeker, Color(0xFF9B5DE5)]),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(
                          userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Good Morning 👋', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                          Text(userName, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                    _buildIconBtn(Icons.notifications_none_rounded, () {}),
                    const SizedBox(width: 8),
                    _buildIconBtn(Icons.logout_rounded, () {
                      ref.read(authProvider.notifier).logout().then((_) {
                        if (mounted) context.go('/login');
                      });
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Welcome Gradient Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppColors.primary, Color(0xFF3949AB), Color(0xFF5C6BC0)],
                    ),
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.35),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome back,',
                        style: GoogleFonts.inter(fontSize: 13, color: Colors.white70),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        userName,
                        style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.trending_up_rounded, color: Colors.white, size: 16),
                            const SizedBox(width: 6),
                            Text(
                              'Profile Strength: 85%',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 22),

              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: GestureDetector(
                  onTap: () => context.push('/jobs'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search_rounded, color: AppColors.textTertiary, size: 22),
                        const SizedBox(width: 12),
                        Text(
                          'Search jobs, categories, or locations...',
                          style: GoogleFonts.inter(fontSize: 13, color: AppColors.textTertiary),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Stats Row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Expanded(child: _StatCard(count: '12', label: 'Applied Jobs', icon: Icons.send_rounded, color: AppColors.seeker, bgColor: AppColors.seekerSurface)),
                    const SizedBox(width: 14),
                    Expanded(child: _StatCard(count: '3', label: 'Interviews', icon: Icons.videocam_rounded, color: AppColors.success, bgColor: AppColors.successSurface)),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Section Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Recommended Jobs', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                    GestureDetector(
                      onTap: () => context.push('/jobs'),
                      child: Text('View All', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Job Cards
              _RecommendedJobCard(
                title: 'Flutter Developer',
                company: 'Theni Tech Labs',
                location: 'Theni, Tamil Nadu',
                salary: '₹30K - 50K / month',
                jobType: 'Full Time',
                skills: const ['Flutter', 'Dart', 'Firebase'],
                timeAgo: '2 hours ago',
                isUrgent: false,
              ),
              _RecommendedJobCard(
                title: 'Business Development Executive',
                company: 'ABC Industries',
                location: 'Bodinayakanur',
                salary: '₹20K - 30K / month',
                jobType: 'Full Time',
                skills: const ['Sales', 'Communication'],
                timeAgo: '1 day ago',
                isUrgent: true,
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(Icons.dashboard_rounded, 'Home', 0),
                _buildNavItem(Icons.work_rounded, 'Jobs', 1),
                _buildNavItem(Icons.chat_bubble_outline_rounded, 'Chat', 2),
                _buildNavItem(Icons.person_rounded, 'Profile', 3),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIconBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Icon(icon, size: 20, color: AppColors.textSecondary),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isActive = _currentNavIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() => _currentNavIndex = index);
        HapticFeedback.lightImpact();
        if (index == 1) context.push('/jobs');
        if (index == 3) context.push('/seeker/profile');
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primarySurface : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: isActive ? AppColors.primary : AppColors.textTertiary),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? AppColors.primary : AppColors.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String count;
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;

  const _StatCard({
    required this.count,
    required this.label,
    required this.icon,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 14),
          Text(count, style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface)),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

class _RecommendedJobCard extends StatelessWidget {
  final String title;
  final String company;
  final String location;
  final String salary;
  final String jobType;
  final List<String> skills;
  final String timeAgo;
  final bool isUrgent;

  const _RecommendedJobCard({
    required this.title,
    required this.company,
    required this.location,
    required this.salary,
    required this.jobType,
    required this.skills,
    required this.timeAgo,
    this.isUrgent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primarySurface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.business_rounded, color: AppColors.primary, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(company, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                const Icon(Icons.bookmark_border_rounded, color: AppColors.textTertiary, size: 22),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Icon(Icons.location_on_outlined, size: 15, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(location, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                const Spacer(),
                Icon(Icons.currency_rupee, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 2),
                Text(salary, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                _buildChip(jobType, AppColors.primary, AppColors.primarySurface),
                if (isUrgent) ...[
                  const SizedBox(width: 8),
                  _buildChip('Urgent', AppColors.error, AppColors.errorSurface),
                ],
                const Spacer(),
                Text(timeAgo, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: skills.map((s) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(s, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.textSecondary)),
              )).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(String text, Color textColor, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: textColor)),
    );
  }
}
