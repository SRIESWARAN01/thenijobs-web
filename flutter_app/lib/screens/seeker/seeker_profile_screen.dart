import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/providers/auth_provider.dart';

class SeekerProfileScreen extends ConsumerWidget {
  const SeekerProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final userName = authState.user?.displayName ?? 'Job Seeker';
    final userEmail = authState.user?.email ?? 'user@thenijobs.com';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Top Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        width: 42, height: 42,
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Icon(Icons.arrow_back_ios_new_rounded, size: 16),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Text('My Profile', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700)),
                    const Spacer(),
                    Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.primarySurface,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.settings_outlined, size: 20, color: AppColors.primary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Profile Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: AppColors.border),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 12, offset: const Offset(0, 6)),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Avatar
                      Container(
                        width: 80, height: 80,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryLight]),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.25), blurRadius: 16, offset: const Offset(0, 6))],
                        ),
                        child: Center(
                          child: Text(
                            userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                            style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(userName, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(userEmail, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
                      const SizedBox(height: 16),

                      // Profile Strength
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.primarySurface,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Profile Strength', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary)),
                                Text('85%', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.primary)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: const LinearProgressIndicator(
                                value: 0.85,
                                backgroundColor: Colors.white,
                                valueColor: AlwaysStoppedAnimation(AppColors.primary),
                                minHeight: 6,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Quick Stats
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    _miniStat('12', 'Applied', AppColors.seeker),
                    const SizedBox(width: 10),
                    _miniStat('3', 'Saved', AppColors.accent),
                    const SizedBox(width: 10),
                    _miniStat('1', 'Offers', AppColors.success),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Menu Items
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      _menuItem(Icons.description_outlined, 'My Resume', AppColors.primary, () {}, true),
                      _divider(),
                      _menuItem(Icons.work_history_outlined, 'Applied Jobs', AppColors.seeker, () {}, true),
                      _divider(),
                      _menuItem(Icons.bookmark_outline, 'Saved Jobs', AppColors.accent, () {}, true),
                      _divider(),
                      _menuItem(Icons.school_outlined, 'My Courses', AppColors.academy, () {}, true),
                      _divider(),
                      _menuItem(Icons.shopping_bag_outlined, 'My Orders', AppColors.accentDark, () {}, true),
                      _divider(),
                      _menuItem(Icons.receipt_long_outlined, 'Subscription', AppColors.success, () {}, true),
                      _divider(),
                      _menuItem(Icons.help_outline, 'Help & Support', AppColors.info, () {}, true),
                      _divider(),
                      _menuItem(Icons.logout_rounded, 'Sign Out', AppColors.error, () {
                        ref.read(authProvider.notifier).logout();
                      }, false),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _miniStat(String count, String label, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text(count, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }

  Widget _menuItem(IconData icon, String title, Color color, VoidCallback onTap, bool showArrow) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        child: Row(
          children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: color),
            ),
            const SizedBox(width: 14),
            Expanded(child: Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600))),
            if (showArrow)
              const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textTertiary),
          ],
        ),
      ),
    );
  }

  Widget _divider() {
    return Padding(
      padding: const EdgeInsets.only(left: 70),
      child: Container(height: 1, color: AppColors.border.withValues(alpha: 0.5)),
    );
  }
}
