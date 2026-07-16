import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/providers/auth_provider.dart';

class ProfileSetupScreen extends ConsumerWidget {
  const ProfileSetupScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Complete Profile'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Let\'s build your profile',
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Welcome, ${user?.displayName ?? "User"}! Let\'s finish setting up your account.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xxl),

              // Placeholder UI for filling profiles
              Text(
                'Account Role: ${user?.role.name ?? "Not Set"}',
                style: const TextStyle(fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xxxl),

              ElevatedButton(
                onPressed: () {
                  // Stub: Mark setup complete and redirect
                  // In real app, write profile to seekerProfiles or companies collection, then update users doc setupCompleted=true.
                  if (user?.role.value == 'job_seeker') {
                    context.go('/seeker/dashboard');
                  } else {
                    context.go('/employer/dashboard');
                  }
                },
                child: const Text('Complete Setup (Demo)'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
