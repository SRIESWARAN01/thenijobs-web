import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/providers/auth_provider.dart';
import 'package:thenijobs/models/job.dart';
import 'package:thenijobs/models/ecommerce.dart';
import 'package:thenijobs/models/service.dart';
import 'package:thenijobs/models/lms.dart';

// Import Screens
import 'package:thenijobs/screens/auth/login_screen.dart';
import 'package:thenijobs/screens/auth/register_screen.dart';
import 'package:thenijobs/screens/auth/otp_screen.dart';
import 'package:thenijobs/screens/auth/role_selection_screen.dart';
import 'package:thenijobs/screens/auth/profile_setup_screen.dart';
import 'package:thenijobs/screens/seeker/seeker_dashboard.dart';
import 'package:thenijobs/screens/seeker/job_search_screen.dart';
import 'package:thenijobs/screens/seeker/job_detail_screen.dart';
import 'package:thenijobs/screens/seeker/applications_screen.dart';
import 'package:thenijobs/screens/seeker/seeker_profile_screen.dart';
import 'package:thenijobs/screens/employer/employer_dashboard.dart';
import 'package:thenijobs/screens/employer/post_job_screen.dart';
import 'package:thenijobs/screens/employer/company_profile_screen.dart';
import 'package:thenijobs/screens/common/chat_screen.dart';

// Import E-Commerce / Shop Screens
import 'package:thenijobs/screens/shop/shop_home.dart';
import 'package:thenijobs/screens/shop/product_detail.dart';
import 'package:thenijobs/screens/shop/cart_screen.dart';
import 'package:thenijobs/screens/shop/checkout_screen.dart';

// Import Local Services Marketplace Screens
import 'package:thenijobs/screens/services/service_directory.dart';
import 'package:thenijobs/screens/services/service_detail.dart';
import 'package:thenijobs/screens/services/booking_screen.dart';

// Import Academy LMS Screens
import 'package:thenijobs/screens/academy/course_catalog.dart';
import 'package:thenijobs/screens/academy/course_detail.dart';
import 'package:thenijobs/screens/academy/lesson_player.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isLoggedIn = authState.user != null;
      final isLoggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/otp';

      if (!isLoggedIn) {
        return isLoggingIn ? null : '/login';
      }

      final user = authState.user!;
      
      if (user.role.value == 'job_seeker' && user.setupCompleted != true) {
        if (state.matchedLocation == '/profile-setup') return null;
        return '/profile-setup';
      }

      if (user.role.value == 'business' && user.setupCompleted != true) {
        if (state.matchedLocation == '/profile-setup') return null;
        return '/profile-setup';
      }

      if (isLoggingIn) {
        if (user.role.value == 'job_seeker') {
          return '/seeker/dashboard';
        } else if (user.role.value == 'business' || user.role.isBusinessRole) {
          return '/employer/dashboard';
        }
        return '/role-selection';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) {
          final phone = state.extra as String? ?? '';
          return OtpScreen(phoneNumber: phone);
        },
      ),
      GoRoute(
        path: '/role-selection',
        builder: (context, state) => const RoleSelectionScreen(),
      ),
      GoRoute(
        path: '/profile-setup',
        builder: (context, state) => const ProfileSetupScreen(),
      ),
      
      // Seeker routes
      GoRoute(
        path: '/seeker/dashboard',
        builder: (context, state) => const SeekerDashboard(),
      ),
      GoRoute(
        path: '/seeker/profile',
        builder: (context, state) => const SeekerProfileScreen(),
      ),
      GoRoute(
        path: '/seeker/applications',
        builder: (context, state) => const SeekerApplicationsScreen(),
      ),
      GoRoute(
        path: '/jobs',
        builder: (context, state) => const JobSearchScreen(),
      ),
      GoRoute(
        path: '/jobs/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final job = state.extra as Job?;
          return JobDetailScreen(jobId: id, job: job);
        },
      ),

      // Employer routes
      GoRoute(
        path: '/employer/dashboard',
        builder: (context, state) => const EmployerDashboard(),
      ),
      GoRoute(
        path: '/employer/post-job',
        builder: (context, state) => const PostJobScreen(),
      ),
      GoRoute(
        path: '/employer/company',
        builder: (context, state) => const CompanyProfileScreen(),
      ),

      // Common routes
      GoRoute(
        path: '/chat/:conversationId',
        builder: (context, state) {
          final conversationId = state.pathParameters['conversationId'] ?? '';
          final otherUserName = state.extra as String? ?? 'Chat';
          return ChatScreen(conversationId: conversationId, otherUserName: otherUserName);
        },
      ),

      // E-Commerce / Shop routes
      GoRoute(
        path: '/shop',
        builder: (context, state) => const ShopHomeScreen(),
      ),
      GoRoute(
        path: '/shop/product/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final product = state.extra as Product?;
          return ProductDetailScreen(productId: id, product: product);
        },
      ),
      GoRoute(
        path: '/shop/cart',
        builder: (context, state) => const CartScreen(),
      ),
      GoRoute(
        path: '/shop/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),

      // Services routes
      GoRoute(
        path: '/services',
        builder: (context, state) => const ServiceDirectoryScreen(),
      ),
      GoRoute(
        path: '/services/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final service = state.extra as Service?;
          return ServiceDetailScreen(serviceId: id, service: service);
        },
      ),
      GoRoute(
        path: '/services/booking',
        builder: (context, state) {
          final service = state.extra as Service?;
          return BookingScreen(service: service);
        },
      ),

      // Academy routes
      GoRoute(
        path: '/academy',
        builder: (context, state) => const CourseCatalogScreen(),
      ),
      GoRoute(
        path: '/academy/course/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final course = state.extra as Course?;
          return CourseDetailScreen(courseId: id, course: course);
        },
      ),
      GoRoute(
        path: '/academy/lesson/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final lesson = state.extra as Lesson?;
          return LessonPlayerScreen(lessonId: id, lesson: lesson);
        },
      ),
    ],
  );
});
