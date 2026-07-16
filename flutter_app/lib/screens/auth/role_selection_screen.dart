import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class RoleSelectionScreen extends ConsumerWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        width: size.width,
        height: size.height,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF0F2FF), AppColors.background],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              children: [
                SizedBox(height: size.height * 0.08),

                // Header Icon
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.primarySurface,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Icon(Icons.people_alt_rounded, color: AppColors.primary, size: 32),
                ),
                const SizedBox(height: 20),

                Text(
                  'Choose Your Role',
                  style: GoogleFonts.outfit(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    'Select how you want to use THENIJOBS to get started.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 44),

                // Job Seeker Card
                _RoleCard(
                  icon: Icons.person_search_rounded,
                  iconColor: AppColors.primary,
                  iconBgColor: AppColors.primarySurface,
                  borderColor: AppColors.primary,
                  bgColor: const Color(0xFFF5F6FF),
                  title: 'I am a Job Seeker',
                  titleColor: AppColors.primary,
                  description: 'Find employment, build resume, learn skills',
                  features: const ['Browse thousands of jobs', 'Build professional resume', 'Get interview alerts'],
                  onTap: () => context.go('/profile-setup'),
                ),
                const SizedBox(height: 20),

                // Business Card
                _RoleCard(
                  icon: Icons.business_rounded,
                  iconColor: AppColors.accentDark,
                  iconBgColor: AppColors.accentSurface,
                  borderColor: AppColors.accent,
                  bgColor: const Color(0xFFFFF9F2),
                  title: 'I am a Business',
                  titleColor: AppColors.accentDark,
                  description: 'Hire talent, sell products, showcase services',
                  features: const ['Post jobs & find candidates', 'Sell products online', 'List your services'],
                  onTap: () => context.go('/profile-setup'),
                ),

                const Spacer(),

                // Footer
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: Text(
                    'You can change your role later in Settings',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatefulWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final Color borderColor;
  final Color bgColor;
  final String title;
  final Color titleColor;
  final String description;
  final List<String> features;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.borderColor,
    required this.bgColor,
    required this.title,
    required this.titleColor,
    required this.description,
    required this.features,
    required this.onTap,
  });

  @override
  State<_RoleCard> createState() => _RoleCardState();
}

class _RoleCardState extends State<_RoleCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 150),
        child: Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: widget.bgColor,
            border: Border.all(color: widget.borderColor.withValues(alpha: 0.5), width: 2),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: widget.borderColor.withValues(alpha: 0.08),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: widget.iconBgColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(widget.icon, color: widget.iconColor, size: 28),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      style: GoogleFonts.outfit(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: widget.titleColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.description,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios_rounded, size: 16, color: widget.iconColor.withValues(alpha: 0.5)),
            ],
          ),
        ),
      ),
    );
  }
}
