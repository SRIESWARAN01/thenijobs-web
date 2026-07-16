import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class CoursePlayerScreen extends ConsumerStatefulWidget {
  final String courseId;
  const CoursePlayerScreen({super.key, required this.courseId});

  @override
  ConsumerState<CoursePlayerScreen> createState() => _CoursePlayerScreenState();
}

class _CoursePlayerScreenState extends ConsumerState<CoursePlayerScreen> {
  int _currentLesson = 0;

  final _mockLessons = [
    _MockLesson('Welcome & Course Overview', '5:30', true),
    _MockLesson('Setting Up Your Environment', '12:45', true),
    _MockLesson('Your First Flutter App', '18:20', true),
    _MockLesson('Understanding Widgets', '15:10', false),
    _MockLesson('Layouts & Responsive Design', '20:30', false),
    _MockLesson('Navigation & Routing', '14:45', false),
    _MockLesson('State Management Basics', '22:00', false),
    _MockLesson('Working with APIs', '19:15', false),
    _MockLesson('Firebase Integration', '25:00', false),
    _MockLesson('Publishing Your App', '16:30', false),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Video Player Area
            Container(
              width: double.infinity,
              height: 220,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFF1A1A2E), Color(0xFF16213E)],
                ),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Container(
                      width: 64, height: 64,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 36),
                    ),
                  ),
                  // Top buttons
                  Positioned(
                    top: 12, left: 12,
                    child: GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        width: 38, height: 38,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.arrow_back_ios_new_rounded, size: 14, color: Colors.white),
                      ),
                    ),
                  ),
                  // Progress bar
                  Positioned(
                    bottom: 0, left: 0, right: 0,
                    child: Container(
                      height: 3,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                      ),
                      child: FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: 0.35,
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(colors: [AppColors.academy, Colors.purple.shade300]),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Course Info
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Introduction to Flutter & Mobile Development',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _infoChip(Icons.play_lesson_rounded, '${_mockLessons.length} lessons'),
                      const SizedBox(width: 12),
                      _infoChip(Icons.schedule, '8 hrs'),
                      const SizedBox(width: 12),
                      _infoChip(Icons.star_rounded, '4.7'),
                    ],
                  ),
                ],
              ),
            ),

            // Lesson List
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Text('Course Content', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  Text(
                    '${_mockLessons.where((l) => l.isCompleted).length}/${_mockLessons.length} completed',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.academy),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                itemCount: _mockLessons.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final lesson = _mockLessons[i];
                  final isCurrent = _currentLesson == i;
                  return GestureDetector(
                    onTap: () => setState(() => _currentLesson = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isCurrent ? AppColors.academySurface : AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: isCurrent ? AppColors.academy.withValues(alpha: 0.3) : AppColors.border),
                      ),
                      child: Row(
                        children: [
                          // Number / Completion
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              color: lesson.isCompleted
                                  ? AppColors.success.withValues(alpha: 0.1)
                                  : isCurrent
                                      ? AppColors.academy.withValues(alpha: 0.15)
                                      : AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: lesson.isCompleted
                                  ? const Icon(Icons.check_rounded, size: 18, color: AppColors.success)
                                  : isCurrent
                                      ? const Icon(Icons.play_arrow_rounded, size: 18, color: AppColors.academy)
                                      : Text(
                                          '${i + 1}',
                                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                                        ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  lesson.title,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                                    color: isCurrent ? AppColors.academy : AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(lesson.duration, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
                              ],
                            ),
                          ),
                          if (!lesson.isCompleted && !isCurrent)
                            const Icon(Icons.lock_outline, size: 16, color: AppColors.textTertiary),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoChip(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(text, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
      ],
    );
  }
}

class _MockLesson {
  final String title, duration;
  final bool isCompleted;
  _MockLesson(this.title, this.duration, this.isCompleted);
}
