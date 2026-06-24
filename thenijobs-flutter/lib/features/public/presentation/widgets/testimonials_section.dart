// ============================================================
// THENIJOBS — TestimonialsSection Widget (Dart Port)
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';

class TestimonialsSection extends ConsumerStatefulWidget {
  const TestimonialsSection({super.key});

  @override
  ConsumerState<TestimonialsSection> createState() =>
      _TestimonialsSectionState();
}

class _TestimonialsSectionState extends ConsumerState<TestimonialsSection> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final reviewsAsync = ref.watch(testimonialsReviewsProvider);

    return reviewsAsync.when(
      data: (reviews) {
        if (reviews.isEmpty) {
          return const SizedBox.shrink();
        }

        // Clamp index just in case list length changes dynamically
        if (_currentIndex >= reviews.length) {
          _currentIndex = 0;
        }

        final activeReview = reviews[_currentIndex];
        final reviewerName = activeReview.reviewerName.isNotEmpty
            ? activeReview.reviewerName
            : 'Verified user';
        final rating = activeReview.rating.clamp(1.0, 5.0).toInt();

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 32.0),
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 800),
              child: Column(
                children: [
                  // Section Header
                  Column(
                    children: [
                      const Text(
                        'COMMUNITY',
                        style: TextStyle(
                          color: Colors.teal,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'People using THENIJOBS',
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Approved reviews from real platform users.',
                        style: TextStyle(
                          color: TailwindColors.slate.shade500,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Testimonial Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: TailwindColors.slate.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // Quote Icon Box
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.teal.shade50,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(
                            Icons.format_quote_rounded,
                            color: Colors.teal,
                            size: 24,
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Stars Rating
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            5,
                            (index) => Icon(
                              Icons.star,
                              size: 20,
                              color: index < rating
                                  ? Colors.amber
                                  : TailwindColors.slate.shade200,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Content Quote text
                        Text(
                          '"${activeReview.content.isNotEmpty ? activeReview.content : "Good experience with THENIJOBS."}"',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF334155),
                            height: 1.6,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Reviewer Details Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: const BoxDecoration(
                                color: Color(0xFF0F172A),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  reviewerName.isNotEmpty
                                      ? reviewerName[0].toUpperCase()
                                      : 'U',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  reviewerName,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                Text(
                                  activeReview.title.isNotEmpty
                                      ? activeReview.title
                                      : activeReview.targetType.name
                                            .toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: TailwindColors.slate.shade500,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Carousel Navigation Row
                  if (reviews.length > 1) ...[
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Left button
                        IconButton(
                          onPressed: () {
                            setState(() {
                              _currentIndex =
                                  (_currentIndex - 1 + reviews.length) %
                                  reviews.length;
                            });
                          },
                          icon: const Icon(Icons.chevron_left, size: 20),
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: TailwindColors.slate.shade700,
                            side: BorderSide(
                              color: TailwindColors.slate.shade200,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Dots
                        Row(
                          children: List.generate(reviews.length, (index) {
                            final isActive = index == _currentIndex;
                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  _currentIndex = index;
                                });
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                margin: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                width: isActive ? 24 : 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: isActive
                                      ? Colors.teal.shade700
                                      : TailwindColors.slate.shade300,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            );
                          }),
                        ),
                        const SizedBox(width: 12),

                        // Right button
                        IconButton(
                          onPressed: () {
                            setState(() {
                              _currentIndex =
                                  (_currentIndex + 1) % reviews.length;
                            });
                          },
                          icon: const Icon(Icons.chevron_right, size: 20),
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: TailwindColors.slate.shade700,
                            side: BorderSide(
                              color: TailwindColors.slate.shade200,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (err, stack) => const SizedBox.shrink(),
    );
  }
}
