import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class AcademyHomeScreen extends ConsumerStatefulWidget {
  const AcademyHomeScreen({super.key});

  @override
  ConsumerState<AcademyHomeScreen> createState() => _AcademyHomeScreenState();
}

class _AcademyHomeScreenState extends ConsumerState<AcademyHomeScreen> {
  int _selectedTab = 0;
  final _tabs = ['All Courses', 'In Progress', 'Completed'];

  final _mockCourses = [
    _MockCourse('Introduction to Flutter & Mobile Development', 'Mobile Development', 12, 8.0, 4.7, 234, 0.0),
    _MockCourse('Basic Tally & Accounting Foundations', 'Finance', 10, 6.5, 4.5, 189, 0.45),
    _MockCourse('Digital Marketing Essentials', 'Marketing', 15, 10.0, 4.8, 412, 0.0),
    _MockCourse('Spoken English for Professionals', 'Language', 20, 14.0, 4.6, 567, 0.72),
    _MockCourse('Microsoft Excel Mastery', 'Office Tools', 8, 5.0, 4.4, 321, 0.0),
    _MockCourse('UPSC Preparation Guide', 'Government Jobs', 25, 18.0, 4.9, 198, 0.0),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
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
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('THENIJOBS', style: GoogleFonts.outfit(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                      Text('Academy', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.academy)),
                    ],
                  ),
                  const Spacer(),
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.academySurface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.search_rounded, size: 20, color: AppColors.academy),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Stats Banner
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.academy, Color(0xFF9B5DE5), Color(0xFFB388FF)],
                  ),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.academy.withValues(alpha: 0.35),
                      blurRadius: 24,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Continue Learning', style: GoogleFonts.inter(fontSize: 13, color: Colors.white70)),
                          const SizedBox(height: 4),
                          Text('Tally & Accounting', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text('45% Complete', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 52, height: 52,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 28),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 22),

            // Tab Switcher
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _tabs.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final isActive = _selectedTab == i;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedTab = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      decoration: BoxDecoration(
                        color: isActive ? AppColors.academy : AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: isActive ? AppColors.academy : AppColors.border),
                      ),
                      child: Center(
                        child: Text(
                          _tabs[i],
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                            color: isActive ? Colors.white : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 18),

            // Course List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                itemCount: _mockCourses.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) => _buildCourseCard(_mockCourses[i]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseCard(_MockCourse course) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          // Course Icon
          Container(
            width: 54, height: 54,
            decoration: BoxDecoration(
              color: AppColors.academySurface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.school_rounded, color: AppColors.academy, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  course.title,
                  style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  course.category,
                  style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.play_lesson_rounded, size: 13, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      '${course.lessons} lessons',
                      style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary),
                    ),
                    const SizedBox(width: 12),
                    Icon(Icons.schedule, size: 13, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      '${course.hours.toStringAsFixed(0)} hrs',
                      style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary),
                    ),
                    const SizedBox(width: 12),
                    Icon(Icons.star_rounded, size: 13, color: Colors.amber.shade700),
                    const SizedBox(width: 3),
                    Text(
                      '${course.rating}',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                    ),
                  ],
                ),
                if (course.progress > 0) ...[
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: course.progress,
                      backgroundColor: AppColors.surfaceVariant,
                      valueColor: const AlwaysStoppedAnimation(AppColors.academy),
                      minHeight: 4,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MockCourse {
  final String title, category;
  final int lessons, enrolledCount;
  final double hours, rating, progress;
  _MockCourse(this.title, this.category, this.lessons, this.hours, this.rating, this.enrolledCount, this.progress);
}
