import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/providers/auth_provider.dart';

class EmployerDashboard extends ConsumerStatefulWidget {
  const EmployerDashboard({super.key});

  @override
  ConsumerState<EmployerDashboard> createState() => _EmployerDashboardState();
}

class _EmployerDashboardState extends ConsumerState<EmployerDashboard> {
  int _currentNavIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final companyName = authState.user?.displayName ?? 'My Business';

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
                        gradient: const LinearGradient(colors: [AppColors.accentDark, AppColors.accent]),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(
                          companyName.isNotEmpty ? companyName[0].toUpperCase() : 'B',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Business Dashboard', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                          Text(companyName, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                    _iconBtn(Icons.notifications_none_rounded, () {}),
                    const SizedBox(width: 8),
                    _iconBtn(Icons.logout_rounded, () {
                      ref.read(authProvider.notifier).logout().then((_) {
                        if (mounted) context.go('/login');
                      });
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Welcome Card — Orange Gradient
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFE65100), AppColors.accent, Color(0xFFFF9800)],
                    ),
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.accent.withValues(alpha: 0.35),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Welcome back,', style: GoogleFonts.inter(fontSize: 13, color: Colors.white70)),
                      const SizedBox(height: 2),
                      Text(companyName, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
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
                            const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 16),
                            const SizedBox(width: 6),
                            Text(
                              'Standard Plan — 3 active jobs left',
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

              // Stats Row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        count: '2',
                        label: 'Active Jobs',
                        icon: Icons.work_rounded,
                        color: AppColors.primary,
                        bgColor: AppColors.primarySurface,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: _StatCard(
                        count: '48',
                        label: 'Applications',
                        icon: Icons.people_rounded,
                        color: AppColors.seeker,
                        bgColor: AppColors.seekerSurface,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),

              // Post New Job Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.accentDark, AppColors.accent],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.accent.withValues(alpha: 0.35),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: () => context.push('/employer/post-job'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.add_circle_outline_rounded, color: Colors.white, size: 22),
                        const SizedBox(width: 10),
                        Text(
                          'Post a New Job',
                          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // Active Jobs Section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Your Active Jobs', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                    GestureDetector(
                      onTap: () {},
                      child: Text('View All', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.accent)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Active Job Cards
              _ActiveJobCard(
                title: 'Business Development Executive',
                location: 'Theni Office',
                applicants: 24,
                views: 156,
                daysLeft: 12,
                status: 'Active',
              ),
              _ActiveJobCard(
                title: 'Receptionist / Front Desk',
                location: 'Main Branch',
                applicants: 18,
                views: 98,
                daysLeft: 5,
                status: 'Active',
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
                _navItem(Icons.dashboard_rounded, 'Home', 0),
                _navItem(Icons.add_box_rounded, 'Post Job', 1),
                _navItem(Icons.people_rounded, 'Candidates', 2),
                _navItem(Icons.business_rounded, 'Company', 3),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42, height: 42,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Icon(icon, size: 20, color: AppColors.textSecondary),
      ),
    );
  }

  Widget _navItem(IconData icon, String label, int index) {
    final isActive = _currentNavIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() => _currentNavIndex = index);
        HapticFeedback.lightImpact();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.accentSurface : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: isActive ? AppColors.accent : AppColors.textTertiary),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? AppColors.accent : AppColors.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String count, label;
  final IconData icon;
  final Color color, bgColor;

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
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 14),
          Text(count, style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

class _ActiveJobCard extends StatelessWidget {
  final String title, location, status;
  final int applicants, views, daysLeft;

  const _ActiveJobCard({
    required this.title,
    required this.location,
    required this.applicants,
    required this.views,
    required this.daysLeft,
    required this.status,
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
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(color: AppColors.accentSurface, borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.work_rounded, color: AppColors.accent, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(location, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.successSurface,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(status, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.success)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _miniStat(Icons.people_outline, '$applicants', 'Applicants'),
                  Container(width: 1, height: 28, color: AppColors.border),
                  _miniStat(Icons.visibility_outlined, '$views', 'Views'),
                  Container(width: 1, height: 28, color: AppColors.border),
                  _miniStat(Icons.schedule, '$daysLeft', 'Days Left'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniStat(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700)),
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textTertiary)),
      ],
    );
  }
}
