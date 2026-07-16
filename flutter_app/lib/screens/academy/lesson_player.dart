import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/models/lms.dart';

class LessonPlayerScreen extends StatelessWidget {
  final String lessonId;
  final Lesson? lesson;
  const LessonPlayerScreen({super.key, required this.lessonId, this.lesson});

  @override
  Widget build(BuildContext context) {
    if (lesson == null) {
      return const Scaffold(body: Center(child: Text('Lesson not found')));
    }

    final l = lesson!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.title),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Video Player Mock or Banner
            Container(
              height: 200,
              color: Colors.black,
              child: const Center(
                child: Icon(
                  Icons.play_circle_fill,
                  color: Colors.white,
                  size: 64,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.base),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l.title,
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    l.description,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    'Lesson Resources',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  ListTile(
                    leading: const Icon(Icons.picture_as_pdf),
                    title: const Text('Download Slides'),
                    subtitle: const Text('Lecture slides in PDF format'),
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
