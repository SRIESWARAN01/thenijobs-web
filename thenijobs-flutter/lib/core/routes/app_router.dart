// ============================================================
// THENIJOBS — Navigation & Routing (GoRouter + Riverpod)
// ============================================================
//
// Architecture:
//   ShellRoute (MainShell w/ bottom nav)
//     ├─ HomeTab      (/)
//     ├─ JobsSearch   (/jobs)
//     ├─ SavedJobs    (/seeker/saved-jobs) — auth-gated
//     ├─ Profile M3   (/seeker/profile)    — auth-gated
//     └─ MoreTab     (/more)
//
//   Non-shell routes: /login, /register, portal screens, etc.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/routes/route_screens.dart';
import 'package:thenijobs/core/widgets/main_shell.dart';
import 'package:thenijobs/features/public/presentation/screens/businesses_screen.dart';
import 'package:thenijobs/features/public/presentation/screens/company_detail_screen.dart';
import 'package:thenijobs/features/public/presentation/screens/services_screen.dart';
import 'package:thenijobs/features/public/presentation/screens/pricing_screen.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/features/auth/presentation/screens/login_screen.dart';
import 'package:thenijobs/features/auth/presentation/screens/register_screen.dart';
import 'package:thenijobs/features/auth/presentation/screens/forgot_password_screen.dart';
import 'package:thenijobs/redesign/employer/employer_screens.dart';
import 'package:thenijobs/redesign/home/home_shell.dart';
import 'package:thenijobs/redesign/job_detail/job_detail_screen.dart';
import 'package:thenijobs/redesign/profile/seeker_profile_screen.dart';
import 'package:thenijobs/redesign/search/jobs_search_screen.dart';
import 'package:thenijobs/shared/data/models/user_model.dart';

// ===== ROUTER REFRESH LISTENABLE =====
class RouterRefreshListenable extends ChangeNotifier {
  RouterRefreshListenable(Ref ref) {
    ref.listen(authStateStreamProvider, (previous, next) {
      notifyListeners();
    });
  }
}

final routerRefreshListenableProvider = Provider<RouterRefreshListenable>((
  ref,
) {
  return RouterRefreshListenable(ref);
});

// ===== HELPER: ROLE TO PORTAL REDIRECT =====
String _getDashboardForRole(UserRole role) {
  switch (role) {
    case UserRole.admin:
    case UserRole.superAdmin:
      return '/admin/dashboard';
    case UserRole.employer:
    case UserRole.businessOwner:
    case UserRole.supplier:
    case UserRole.serviceProvider:
      return '/employer/dashboard';
    case UserRole.jobSeeker:
      return '/seeker/dashboard';
  }
}

bool _isSafeRedirect(String? value) {
  if (value == null || value.isEmpty) return false;
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  return !value.startsWith('/login') &&
      !value.startsWith('/register') &&
      !value.startsWith('/forgot-password');
}

// ===== APP ROUTER PROVIDER =====
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateStreamProvider);
  final refreshListenable = ref.watch(routerRefreshListenableProvider);

  late final GoRouter router;
  router = GoRouter(
    initialLocation: '/',
    refreshListenable: refreshListenable,
    redirect: (context, state) {
      final user = authState.value;
      final loading = authState.isLoading;

      // Do not redirect while loading the initial auth state
      if (loading) return null;

      final matchedPath = state.matchedLocation;
      final loggingIn =
          matchedPath == '/login' ||
          matchedPath == '/register' ||
          matchedPath == '/forgot-password' ||
          matchedPath == '/admin/login';

      // If user is NOT logged in:
      if (user == null) {
        // Guard protected portal routes
        if (matchedPath.startsWith('/seeker') ||
            matchedPath.startsWith('/employer') ||
            (matchedPath.startsWith('/admin') &&
                matchedPath != '/admin/login')) {
          return '/login?redirect=${Uri.encodeComponent(state.uri.toString())}';
        }
        return null;
      }

      // If user IS logged in:
      if (loggingIn) {
        final redirectTo = state.uri.queryParameters['redirect'];
        if (_isSafeRedirect(redirectTo)) {
          return redirectTo;
        }
        // Prevent logged-in users from seeing login screens, route to their portal
        return _getDashboardForRole(user.role);
      }

      // Role authorization guards:
      if (matchedPath.startsWith('/seeker') &&
          user.role != UserRole.jobSeeker) {
        return _getDashboardForRole(user.role);
      }

      if (matchedPath.startsWith('/employer') &&
          user.role != UserRole.employer &&
          user.role != UserRole.businessOwner &&
          user.role != UserRole.supplier &&
          user.role != UserRole.serviceProvider) {
        return _getDashboardForRole(user.role);
      }

      if (matchedPath.startsWith('/admin') &&
          user.role != UserRole.admin &&
          user.role != UserRole.superAdmin) {
        return _getDashboardForRole(user.role);
      }

      return null;
    },
    routes: [
      // ===== MAIN SHELL (BOTTOM NAVIGATION) =====
      ShellRoute(
        builder: (context, state, child) =>
            MainShell(location: state.matchedLocation, child: child),
        routes: [
          // Home Tab
          GoRoute(
            path: '/',
            builder: (context, state) =>
                HomeTab(onOpenSearch: () => router.go('/jobs')),
          ),
          // Search / Jobs Tab
          GoRoute(
            path: '/jobs',
            builder: (context, state) => JobsSearchScreen(
              initialSearch: state.uri.queryParameters['search'],
              initialCategory: state.uri.queryParameters['category'],
              initialLocation:
                  state.uri.queryParameters['location'] ??
                  state.uri.queryParameters['area'],
              embedded: true,
            ),
          ),
          // Saved Jobs Tab (Gated)
          GoRoute(
            path: '/seeker/saved-jobs',
            builder: (context, state) => const SavedJobsScreen(embedded: true),
          ),
          // Profile Tab (Gated)
          GoRoute(
            path: '/seeker/profile',
            builder: (context, state) =>
                const SeekerProfileScreenM3(embedded: true),
          ),
          // More Tab
          GoRoute(path: '/more', builder: (context, state) => const MoreTab()),
        ],
      ),

      // ===== NON-SHELL PUBLIC ROUTES =====
      GoRoute(
        path: '/login',
        builder: (context, state) =>
            LoginScreen(initialMode: state.uri.queryParameters['mode']),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/jobs/:id',
        builder: (context, state) =>
            JobDetailScreenM3(jobId: state.pathParameters['id'] ?? ''),
      ),
      GoRoute(
        path: '/businesses',
        builder: (context, state) => BusinessesScreen(
          initialSearch: state.uri.queryParameters['search'],
          initialCategory: state.uri.queryParameters['category'],
          initialDistrict:
              state.uri.queryParameters['area'] ??
              state.uri.queryParameters['district'],
        ),
      ),
      GoRoute(
        path: '/businesses/:category',
        builder: (context, state) => BusinessesScreen(
          initialCategory: state.pathParameters['category'],
          initialSearch: state.uri.queryParameters['search'],
          initialDistrict:
              state.uri.queryParameters['area'] ??
              state.uri.queryParameters['district'],
        ),
      ),
      GoRoute(
        path: '/company/register',
        builder: (context, state) => const CompanyRegisterScreen(),
      ),
      GoRoute(
        path: '/company/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return CompanyDetailScreen(companyId: id);
        },
      ),
      GoRoute(
        path: '/pricing',
        builder: (context, state) => const PricingScreen(),
      ),
      GoRoute(
        path: '/services',
        builder: (context, state) => ServicesScreen(
          initialSearch: state.uri.queryParameters['search'],
          initialCategory: state.uri.queryParameters['category'],
          initialDistrict:
              state.uri.queryParameters['area'] ??
              state.uri.queryParameters['district'],
        ),
      ),
      GoRoute(
        path: '/id/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return PublicThenijobsIdScreen(identifier: id);
        },
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const PublicProfileScreen(),
      ),
      GoRoute(
        path: '/profile/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return PublicProfileScreen(identifier: id);
        },
      ),

      // ===== SEEKER PORTAL ROUTES (NON-SHELL) =====
      GoRoute(
        path: '/seeker/dashboard',
        builder: (context, state) => const SeekerDashboardScreen(),
      ),
      GoRoute(
        path: '/seeker/resume',
        builder: (context, state) => const SeekerResumeScreen(),
      ),
      GoRoute(
        path: '/seeker/resume/builder',
        builder: (context, state) => const SeekerResumeScreen(),
      ),
      GoRoute(
        path: '/seeker/applications',
        builder: (context, state) => const AppliedJobsScreen(),
      ),
      GoRoute(
        path: '/seeker/job-alerts',
        builder: (context, state) => const SeekerJobAlertsScreen(),
      ),
      GoRoute(
        path: '/seeker/interviews',
        builder: (context, state) => const SeekerInterviewsScreen(),
      ),
      GoRoute(
        path: '/seeker/messages',
        builder: (context, state) => const SeekerMessagesScreen(),
      ),
      GoRoute(
        path: '/seeker/notifications',
        builder: (context, state) => const SeekerNotificationsScreen(),
      ),
      GoRoute(
        path: '/seeker/rewards',
        builder: (context, state) => const SeekerRewardsScreen(),
      ),
      GoRoute(
        path: '/seeker/ai-coach',
        builder: (context, state) => const SeekerAICoachScreen(),
      ),
      GoRoute(
        path: '/seeker/skills',
        builder: (context, state) => const SeekerSkillsScreen(),
      ),
      GoRoute(
        path: '/seeker/subscription',
        builder: (context, state) => const SeekerSubscriptionScreen(),
      ),
      GoRoute(
        path: '/seeker/settings',
        builder: (context, state) => const SeekerSettingsScreen(),
      ),

      // ===== EMPLOYER PORTAL ROUTES =====
      GoRoute(
        path: '/employer/dashboard',
        builder: (context, state) => const EmployerDashboardM3(),
      ),
      GoRoute(
        path: '/employer/company-profile',
        builder: (context, state) => const EmployerCompanyProfileScreen(),
      ),
      GoRoute(
        path: '/employer/post-job',
        builder: (context, state) => const EmployerPostJobScreen(),
      ),
      GoRoute(
        path: '/employer/jobs',
        builder: (context, state) => const EmployerJobsScreen(),
      ),
      GoRoute(
        path: '/employer/candidates',
        builder: (context, state) => const EmployerCandidatesScreen(),
      ),
      GoRoute(
        path: '/employer/talent-search',
        builder: (context, state) => const EmployerTalentSearchScreen(),
      ),
      GoRoute(
        path: '/employer/interviews',
        builder: (context, state) => const EmployerInterviewsScreen(),
      ),
      GoRoute(
        path: '/employer/leads',
        builder: (context, state) => const EmployerLeadsScreen(),
      ),
      GoRoute(
        path: '/employer/reviews',
        builder: (context, state) => const EmployerReviewsScreen(),
      ),
      GoRoute(
        path: '/employer/messages',
        builder: (context, state) => const EmployerMessagesScreen(),
      ),
      GoRoute(
        path: '/employer/billing',
        builder: (context, state) => const EmployerBillingScreen(),
      ),
      GoRoute(
        path: '/employer/subscription',
        builder: (context, state) => const EmployerSubscriptionScreen(),
      ),
      GoRoute(
        path: '/employer/reports',
        builder: (context, state) => const EmployerReportsScreen(),
      ),
      GoRoute(
        path: '/employer/settings',
        builder: (context, state) => const EmployerSettingsScreen(),
      ),

      // ===== ADMIN PORTAL ROUTES =====
      GoRoute(
        path: '/admin/login',
        builder: (context, state) => const AdminLoginScreen(),
      ),
      GoRoute(
        path: '/admin/dashboard',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/admin/businesses',
        builder: (context, state) => const AdminBusinessesScreen(),
      ),
      GoRoute(
        path: '/admin/jobs',
        builder: (context, state) => const AdminJobsScreen(),
      ),
      GoRoute(
        path: '/admin/users',
        builder: (context, state) => const AdminUsersScreen(),
      ),
      GoRoute(
        path: '/admin/leads',
        builder: (context, state) => const AdminLeadsScreen(),
      ),
      GoRoute(
        path: '/admin/services',
        builder: (context, state) => const AdminServicesScreen(),
      ),
      GoRoute(
        path: '/admin/subscriptions',
        builder: (context, state) => const AdminSubscriptionsScreen(),
      ),
      GoRoute(
        path: '/admin/ads',
        builder: (context, state) => const AdminAdsScreen(),
      ),
      GoRoute(
        path: '/admin/reviews',
        builder: (context, state) => const AdminReviewsScreen(),
      ),
      GoRoute(
        path: '/admin/notifications',
        builder: (context, state) => const AdminNotificationsScreen(),
      ),
      GoRoute(
        path: '/admin/reports',
        builder: (context, state) => const AdminReportsScreen(),
      ),
      GoRoute(
        path: '/admin/security',
        builder: (context, state) => const AdminSecurityScreen(),
      ),
      GoRoute(
        path: '/admin/settings',
        builder: (context, state) => const AdminSettingsScreen(),
      ),
    ],
  );
  return router;
});
