// ============================================================
// THENIJOBS — StatsSection Widget (Dart Port)
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';

class StatsSection extends ConsumerWidget {
  const StatsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch count states
    final activeJobsAsync = ref.watch(activeJobsCountProvider);
    final totalCompaniesAsync = ref.watch(totalCompaniesCountProvider);
    final totalSeekersAsync = ref.watch(totalSeekersCountProvider);
    final verifiedCompaniesAsync = ref.watch(verifiedCompaniesCountProvider);

    final isWide = MediaQuery.of(context).size.width > 768;
    final formatter = NumberFormat.decimalPattern('en_IN');

    final statsList = [
      {
        'async': activeJobsAsync,
        'label': 'Active Jobs',
        'tamil': 'Current openings',
        'color': const Color(0xFF0F766E), // teal-700
        'icon': Icons.notifications_active_outlined,
      },
      {
        'async': totalCompaniesAsync,
        'label': 'Companies',
        'tamil': 'Registered companies',
        'color': const Color(0xFF1D4ED8), // blue-700
        'icon': Icons.business_outlined,
      },
      {
        'async': totalSeekersAsync,
        'label': 'Job Seekers',
        'tamil': 'Registered seekers',
        'color': const Color(0xFF047857), // emerald-700
        'icon': Icons.people_outline,
      },
      {
        'async': verifiedCompaniesAsync,
        'label': 'Verified Pages',
        'tamil': 'Verified business pages',
        'color': const Color(0xFFB45309), // amber-700
        'icon': Icons.verified_user_outlined,
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: isWide ? 4 : 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: isWide ? 1.4 : 1.2,
            ),
            itemCount: statsList.length,
            itemBuilder: (context, index) {
              final stat = statsList[index];
              return _buildStatsCard(
                stat['async'] as AsyncValue<int>,
                stat['label'] as String,
                stat['tamil'] as String,
                stat['color'] as Color,
                stat['icon'] as IconData,
                formatter,
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildStatsCard(
    AsyncValue<int> asyncCount,
    String label,
    String tamil,
    Color textColor,
    IconData icon,
    NumberFormat formatter,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: TailwindColors.slate.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.01),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icon Box
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: TailwindColors.slate.shade50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: TailwindColors.slate.shade700),
          ),
          const SizedBox(height: 12),

          // Count text with animation
          asyncCount.when(
            data: (value) => _AnimatedNumber(
              targetValue: value,
              textColor: textColor,
              formatter: formatter,
            ),
            loading: () => const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            error: (_, __) => Text(
              '0',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: textColor,
              ),
            ),
          ),
          const SizedBox(height: 2),

          // Labels
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
          Text(
            tamil,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: TailwindColors.slate.shade500,
            ),
          ),
        ],
      ),
    );
  }
}

// Custom animated counter widget
class _AnimatedNumber extends StatelessWidget {
  final int targetValue;
  final Color textColor;
  final NumberFormat formatter;

  const _AnimatedNumber({
    required this.targetValue,
    required this.textColor,
    required this.formatter,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: targetValue.toDouble()),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Text(
          formatter.format(value.toInt()),
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: textColor,
            fontFamily: 'Outfit',
          ),
        );
      },
    );
  }
}
