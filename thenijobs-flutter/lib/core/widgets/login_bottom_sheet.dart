// ============================================================
// THENIJOBS — Login Bottom Sheet (Guest → Auth Gate)
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_colors.dart';
import 'package:thenijobs/core/theme/app_typography.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';

/// Pending action stored before auth redirect so user returns to their task.
class PendingAction {
  final String type; // 'apply', 'save', 'profile'
  final String? targetId; // e.g. jobId

  const PendingAction({required this.type, this.targetId});
}

/// Global pending action — cleared after execution.
PendingAction? _pendingAction;

/// Store a pending action before triggering login.
void setPendingAction(PendingAction action) {
  _pendingAction = action;
}

/// Get and clear pending action after successful login.
PendingAction? consumePendingAction() {
  final action = _pendingAction;
  _pendingAction = null;
  return action;
}

/// Shows a premium login bottom sheet when guests try protected actions.
/// After successful auth, returns user back to their intended action.
Future<void> showLoginBottomSheet(
  BuildContext context, {
  String title = 'Sign in to continue',
  String subtitle = 'Create an account or sign in to access this feature',
  PendingAction? pendingAction,
}) {
  if (pendingAction != null) {
    setPendingAction(pendingAction);
  }

  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) =>
        _LoginBottomSheetContent(title: title, subtitle: subtitle),
  );
}

class _LoginBottomSheetContent extends ConsumerWidget {
  final String title;
  final String subtitle;

  const _LoginBottomSheetContent({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.lightSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ── Handle Bar ──
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.lightDivider,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),

              // ── Icon ──
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.lock_outline_rounded,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(height: 16),

              // ── Title ──
              Text(title, style: AppTypography.h3, textAlign: TextAlign.center),
              const SizedBox(height: 6),
              Text(
                subtitle,
                style: AppTypography.bodyMedium,
                textAlign: TextAlign.center,
              ),

              // ── Error ──
              if (authState.errorMessage != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.roseSurface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppColors.rose.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 16,
                        color: AppColors.rose,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          authState.errorMessage!,
                          style: AppTypography.bodySmall.copyWith(
                            color: AppColors.rose,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // ── Google Button ──
              _AuthButton(
                onTap: authState.isLoading
                    ? null
                    : () async {
                        try {
                          await ref
                              .read(authNotifierProvider.notifier)
                              .signInWithGoogle();
                          if (context.mounted) Navigator.of(context).pop();
                        } catch (_) {}
                      },
                icon: Icons.g_mobiledata_rounded,
                label: 'Continue with Google',
                bgColor: Colors.white,
                fgColor: AppColors.lightTextPrimary,
                borderColor: AppColors.lightDivider,
              ),
              const SizedBox(height: 10),

              // ── Email Button ──
              _AuthButton(
                onTap: () {
                  Navigator.of(context).pop();
                  context.push('/login');
                },
                icon: Icons.mail_outline_rounded,
                label: 'Continue with Email',
                bgColor: AppColors.primary,
                fgColor: Colors.white,
              ),
              const SizedBox(height: 10),

              // ── Phone Button ──
              _AuthButton(
                onTap: () {
                  Navigator.of(context).pop();
                  context.push('/login');
                },
                icon: Icons.phone_android_rounded,
                label: 'Continue with Phone',
                bgColor: AppColors.emerald,
                fgColor: Colors.white,
              ),

              const SizedBox(height: 16),

              // ── Footer ──
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Don't have an account? ",
                    style: AppTypography.bodySmall,
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).pop();
                      context.push('/register');
                    },
                    child: Text(
                      'Sign Up Free',
                      style: AppTypography.labelMedium.copyWith(
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),

              // ── Loading Indicator ──
              if (authState.isLoading) ...[
                const SizedBox(height: 16),
                const LinearProgressIndicator(
                  color: AppColors.primary,
                  backgroundColor: AppColors.primarySurface,
                  minHeight: 2,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _AuthButton extends StatelessWidget {
  final VoidCallback? onTap;
  final IconData icon;
  final String label;
  final Color bgColor;
  final Color fgColor;
  final Color? borderColor;

  const _AuthButton({
    required this.onTap,
    required this.icon,
    required this.label,
    required this.bgColor,
    required this.fgColor,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: bgColor,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: borderColor != null
                ? Border.all(color: borderColor!)
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 22, color: fgColor),
              const SizedBox(width: 10),
              Text(
                label,
                style: AppTypography.labelLarge.copyWith(color: fgColor),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
