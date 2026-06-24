// ============================================================
// THENIJOBS — Main Shell (Bottom Navigation + Tab Scaffold)
// ============================================================
//
// Provides the bottom navigation bar with 5 tabs:
// Home | Search | Saved | Profile | More
//
// Used as a ShellRoute wrapper so each tab maintains its own
// navigation stack. Works for both guests and logged-in users.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_colors.dart';
import 'package:thenijobs/core/theme/app_typography.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';

class MainShell extends ConsumerStatefulWidget {
  final Widget child;
  final String location;

  const MainShell({super.key, required this.child, required this.location});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  int _currentIndex = 0;

  static const _tabs = [
    _TabItem(
      path: '/',
      icon: Icons.home_rounded,
      activeIcon: Icons.home_rounded,
      label: 'Home',
    ),
    _TabItem(
      path: '/jobs',
      icon: Icons.search_rounded,
      activeIcon: Icons.search_rounded,
      label: 'Search',
    ),
    _TabItem(
      path: '/seeker/saved-jobs',
      icon: Icons.bookmark_border_rounded,
      activeIcon: Icons.bookmark_rounded,
      label: 'Saved',
    ),
    _TabItem(
      path: '/seeker/profile',
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
      label: 'Profile',
    ),
    _TabItem(
      path: '/more',
      icon: Icons.menu_rounded,
      activeIcon: Icons.menu_rounded,
      label: 'More',
    ),
  ];

  int _getIndexFromLocation(String location) {
    if (location == '/') return 0;
    if (location.startsWith('/jobs')) return 1;
    if (location.startsWith('/seeker/saved')) return 2;
    if (location.startsWith('/seeker/profile') ||
        location.startsWith('/profile')) {
      return 3;
    }
    return _currentIndex;
  }

  void _onTabTapped(int index) {
    if (index == _currentIndex) return;
    setState(() => _currentIndex = index);

    // Navigate to the tab's root path
    context.go(_tabs[index].path);
  }

  @override
  Widget build(BuildContext context) {
    // Update index based on current route
    _currentIndex = _getIndexFromLocation(widget.location);

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.lightSurface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_tabs.length, (index) {
                final tab = _tabs[index];
                final isActive = index == _currentIndex;

                return GestureDetector(
                  onTap: () => _onTabTapped(index),
                  behavior: HitTestBehavior.opaque,
                  child: SizedBox(
                    width: 64,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: isActive
                                ? AppColors.primarySurface
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(
                            isActive ? tab.activeIcon : tab.icon,
                            size: 24,
                            color: isActive
                                ? AppColors.primary
                                : AppColors.lightTextTertiary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          tab.label,
                          style:
                              (isActive
                                      ? AppTypography.labelSmall.copyWith(
                                          color: AppColors.primary,
                                        )
                                      : AppTypography.labelSmall)
                                  .copyWith(fontSize: 10),
                          maxLines: 1,
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _TabItem {
  final String path;
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _TabItem({
    required this.path,
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}

// ===== MORE TAB (Drawer replacement) =====

class MoreTab extends ConsumerWidget {
  const MoreTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateStreamProvider);
    final user = authState.value;

    return Scaffold(
      backgroundColor: AppColors.lightBg,
      appBar: AppBar(
        title: Text('More', style: AppTypography.h3),
        backgroundColor: AppColors.lightSurface,
        surfaceTintColor: AppColors.lightSurface,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          // ── User Card ──
          if (user != null)
            Container(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: Colors.white24,
                    child: Text(
                      user.displayName.isNotEmpty
                          ? user.displayName[0].toUpperCase()
                          : '?',
                      style: AppTypography.h3.copyWith(color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.displayName,
                          style: AppTypography.labelLarge.copyWith(
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          user.email,
                          style: AppTypography.bodySmall.copyWith(
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      final role = user.role.name;
                      if (role.contains('admin')) {
                        context.push('/admin/dashboard');
                      } else if (role.contains('employer') ||
                          role.contains('business')) {
                        context.push('/employer/dashboard');
                      } else {
                        context.push('/seeker/dashboard');
                      }
                    },
                    icon: const Icon(
                      Icons.dashboard_outlined,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            )
          else
            Container(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.lightCard,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.lightDivider),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 24,
                    backgroundColor: AppColors.primarySurface,
                    child: Icon(
                      Icons.person_outline_rounded,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome to TheNiJobs',
                          style: AppTypography.labelLarge,
                        ),
                        Text(
                          'Sign in to access all features',
                          style: AppTypography.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  FilledButton(
                    onPressed: () => context.push('/login'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text('Sign In', style: AppTypography.buttonSmall),
                  ),
                ],
              ),
            ),

          // ── Menu Items ──
          _MenuItem(
            icon: Icons.work_outline_rounded,
            label: 'Jobs',
            onTap: () => context.push('/jobs'),
          ),
          _MenuItem(
            icon: Icons.business_outlined,
            label: 'Businesses',
            onTap: () => context.push('/businesses'),
          ),
          _MenuItem(
            icon: Icons.construction_outlined,
            label: 'Services',
            onTap: () => context.push('/services'),
          ),
          _MenuItem(
            icon: Icons.payments_outlined,
            label: 'Pricing',
            onTap: () => context.push('/pricing'),
          ),
          const Divider(indent: 16, endIndent: 16, height: 16),

          if (user != null) ...[
            _MenuItem(
              icon: Icons.dashboard_customize_outlined,
              label: 'My Dashboard',
              onTap: () {
                final role = user.role.name;
                if (role.contains('admin')) {
                  context.push('/admin/dashboard');
                } else if (role.contains('employer') ||
                    role.contains('business')) {
                  context.push('/employer/dashboard');
                } else {
                  context.push('/seeker/dashboard');
                }
              },
            ),
            _MenuItem(
              icon: Icons.notifications_outlined,
              label: 'Notifications',
              onTap: () => context.push('/seeker/notifications'),
            ),
            _MenuItem(
              icon: Icons.settings_outlined,
              label: 'Settings',
              onTap: () => context.push('/seeker/settings'),
            ),
            const Divider(indent: 16, endIndent: 16, height: 16),
            _MenuItem(
              icon: Icons.logout_rounded,
              label: 'Logout',
              isDestructive: true,
              onTap: () async {
                await ref.read(authNotifierProvider.notifier).logout();
                if (context.mounted) context.go('/');
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      leading: Icon(
        icon,
        size: 22,
        color: isDestructive ? AppColors.error : AppColors.lightTextSecondary,
      ),
      title: Text(
        label,
        style: AppTypography.labelLarge.copyWith(
          color: isDestructive ? AppColors.error : AppColors.lightTextPrimary,
        ),
      ),
      trailing: isDestructive
          ? null
          : const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.lightTextTertiary,
              size: 20,
            ),
      onTap: onTap,
    );
  }
}
