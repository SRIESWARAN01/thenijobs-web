import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/models/lms.dart';

class CourseCatalogScreen extends StatelessWidget {
  const CourseCatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Stub local academy database courses
    final courses = [
      Course(
        id: 'c1',
        title: 'Introduction to Flutter & Mobile Development',
        description: 'Learn to build beautiful native mobile applications using Dart and Flutter framework.',
        category: 'Software Engineering',
        thumbnail: '',
        difficulty: CourseDifficulty.beginner,
        totalModules: 4,
        totalLessons: 12,
        estimatedHours: 8,
        createdBy: 'Admin',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      Course(
        id: 'c2',
        title: 'Basic Tally & Accounting Foundations',
        description: 'Complete billing and accounting courses utilizing the Tally ERP 9 platform.',
        category: 'Finance & Office Admin',
        thumbnail: '',
        difficulty: CourseDifficulty.intermediate,
        totalModules: 6,
        totalLessons: 18,
        estimatedHours: 12,
        createdBy: 'Admin',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('THENIJOBS Academy'),
      ),
      body: SafeArea(
        child: ListView.builder(
          padding: const EdgeInsets.all(AppSpacing.base),
          itemCount: courses.length,
          itemBuilder: (context, index) {
            final course = courses[index];
            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8),
              child: InkWell(
                onTap: () {
                  context.push('/academy/course/${course.id}', extra: course);
                },
                borderRadius: AppRadius.cardRadius,
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.base),
                  child: Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: AppColors.seekerSurface,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.school, color: AppColors.seeker),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              course.title,
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              course.category,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Row(
                              children: [
                                Text('${course.totalLessons} lessons'),
                                const SizedBox(width: AppSpacing.md),
                                Text('${course.estimatedHours} hrs'),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
