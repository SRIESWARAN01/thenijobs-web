// ============================================================
// THENIJOBS — Compact Job Card Widget (Mobile-First)
// ============================================================

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_colors.dart';
import 'package:thenijobs/core/theme/app_typography.dart';

/// A premium, compact job card optimized for mobile lists.
/// Displays job title, company, location, salary, type, and experience
/// without requiring login.
class JobCardCompact extends StatelessWidget {
  final String jobId;
  final String title;
  final String company;
  final String? companyLogoUrl;
  final String location;
  final String? salary;
  final String jobType;
  final String? experience;
  final bool isFeatured;
  final bool isSaved;
  final VoidCallback? onSave;
  final DateTime? postedAt;

  const JobCardCompact({
    super.key,
    required this.jobId,
    required this.title,
    required this.company,
    this.companyLogoUrl,
    required this.location,
    this.salary,
    required this.jobType,
    this.experience,
    this.isFeatured = false,
    this.isSaved = false,
    this.onSave,
    this.postedAt,
  });

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 30) return '${diff.inDays ~/ 30}mo ago';
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    return 'Just now';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/jobs/$jobId'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.lightCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isFeatured
                ? AppColors.primary.withValues(alpha: 0.2)
                : AppColors.lightBorder,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header: Logo + Title + Save ──
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Company Logo
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.lightInputFill,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.lightDivider),
                  ),
                  child: companyLogoUrl != null && companyLogoUrl!.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(11),
                          child: Image.network(
                            companyLogoUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _buildLogoFallback(),
                          ),
                        )
                      : _buildLogoFallback(),
                ),
                const SizedBox(width: 12),
                // Title & Company
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTypography.h4,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        company,
                        style: AppTypography.bodyMedium.copyWith(fontSize: 13),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // Save Button
                if (onSave != null)
                  GestureDetector(
                    onTap: onSave,
                    child: Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: Icon(
                        isSaved
                            ? Icons.bookmark_rounded
                            : Icons.bookmark_border_rounded,
                        color: isSaved
                            ? AppColors.primary
                            : AppColors.lightTextTertiary,
                        size: 22,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // ── Chips: Job Type, Location, Experience ──
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _buildChip(
                  jobType,
                  AppColors.jobTypeBadgeColor(jobType),
                ),
                _buildChip(
                  location,
                  AppColors.info,
                  icon: Icons.location_on_outlined,
                ),
                if (experience != null && experience!.isNotEmpty)
                  _buildChip(
                    experience!,
                    AppColors.amber,
                    icon: Icons.work_outline_rounded,
                  ),
              ],
            ),
            const SizedBox(height: 10),

            // ── Footer: Salary + Posted Time ──
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (salary != null && salary!.isNotEmpty)
                  Text(salary!, style: AppTypography.salarySmall)
                else
                  Text(
                    'Salary not disclosed',
                    style: AppTypography.caption
                        .copyWith(fontStyle: FontStyle.italic),
                  ),
                if (postedAt != null)
                  Text(
                    _timeAgo(postedAt!),
                    style: AppTypography.caption,
                  ),
              ],
            ),

            // ── Featured Badge ──
            if (isFeatured) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '⭐ Featured',
                  style: AppTypography.labelSmall.copyWith(
                    color: Colors.white,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLogoFallback() {
    return Center(
      child: Text(
        company.isNotEmpty ? company[0].toUpperCase() : '?',
        style: AppTypography.h3.copyWith(color: AppColors.primary),
      ),
    );
  }

  Widget _buildChip(String label, Color color, {IconData? icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: color,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
