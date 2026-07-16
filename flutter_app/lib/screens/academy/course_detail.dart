import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/models/lms.dart';

class CourseDetailScreen extends StatelessWidget {
  final String courseId;
  final Course? course;
  const CourseDetailScreen({super.key, required this.courseId, this.course});

  @override
  Widget build(BuildContext context) {
    if (course == null) {
      return const Scaffold(body: Center(child: Text('Course not found')));
    }

    final c = course!;

    // Stub course modules/lessons
    final lessons = [
      const Lesson(
        id: 'l1',
        courseId: 'c1',
        moduleId: 'm1',
        title: 'Module 1: Getting Started with Dart',
        description: 'Basics of Dart programming variables and variables declaration.',
        type: LessonType.text,
        order: 1,
        createdAt: null,
      ),
      const Lesson(
        id: 'l2',
        courseId: 'c1',
        moduleId: 'm1',
        title: 'Module 2: Building Flutter Widgets',
        description: 'Stateless vs Stateful Widgets and structural UI layouts.',
        type: LessonType.video,
        order: 2,
        createdAt: null,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Course Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.xl),
              decoration: BoxDecoration(
                color: AppColors.seekerSurface,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Icon(Icons.school, size: 64, color: AppColors.seeker),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    c.title,
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    c.category,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Course Description',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              c.description,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Curriculum / Syllabus',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: lessons.length,
              itemBuilder: (context, index) {
                final lesson = lessons[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.seekerSurface,
                    child: Text('${index + 1}', style: const TextStyle(color: AppColors.seeker)),
                  ),
                  title: Text(lesson.title),
                  subtitle: Text(lesson.description),
                  trailing: const Icon(Icons.play_circle_outline),
                  onTap: () {
                    context.push('/academy/lesson/${lesson.id}', extra: lesson);
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
