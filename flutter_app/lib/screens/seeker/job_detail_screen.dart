import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class JobDetailScreen extends ConsumerWidget {
  final String jobId;
  const JobDetailScreen({super.key, required this.jobId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                  Text('Job Details', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Icon(Icons.bookmark_border_rounded, size: 20, color: AppColors.textSecondary),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Icon(Icons.share_outlined, size: 20, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Company Header
                    Center(
                      child: Column(
                        children: [
                          Container(
                            width: 72, height: 72,
                            decoration: BoxDecoration(
                              color: AppColors.primarySurface,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Icon(Icons.business_rounded, color: AppColors.primary, size: 36),
                          ),
                          const SizedBox(height: 14),
                          Text('Flutter Developer', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text('Theni Tech Labs', style: GoogleFonts.inter(fontSize: 15, color: AppColors.textSecondary)),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _tag('Full Time', AppColors.primary, AppColors.primarySurface),
                              const SizedBox(width: 8),
                              _tag('Theni, Tamil Nadu', AppColors.textSecondary, AppColors.surfaceVariant),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Info Cards
                    Row(
                      children: [
                        Expanded(child: _infoCard('Salary', '₹30K - 50K', Icons.currency_rupee, AppColors.success)),
                        const SizedBox(width: 12),
                        Expanded(child: _infoCard('Experience', '1-3 years', Icons.work_history_outlined, AppColors.seeker)),
                        const SizedBox(width: 12),
                        Expanded(child: _infoCard('Openings', '2', Icons.people_outline, AppColors.accent)),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // Description
                    Text('Job Description', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    Text(
                      'We are looking for a talented Flutter Developer to join our growing mobile team at Theni Tech Labs. You will be responsible for building and maintaining high-quality Flutter applications for Android and iOS platforms.\n\nAs a Flutter Developer, you will work closely with our design and backend teams to deliver exceptional user experiences. This is an excellent opportunity for someone passionate about mobile development and looking to grow their career.',
                      style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary, height: 1.6),
                    ),
                    const SizedBox(height: 24),

                    // Requirements
                    Text('Requirements', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    ...[
                      '1-3 years of Flutter/Dart experience',
                      'Strong understanding of mobile UI/UX principles',
                      'Experience with Firebase and REST APIs',
                      'Knowledge of state management (Riverpod, BLoC, Provider)',
                      'Good problem-solving skills',
                    ].map((req) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 6, height: 6,
                            margin: const EdgeInsets.only(top: 7, right: 12),
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                          Expanded(child: Text(req, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary, height: 1.4))),
                        ],
                      ),
                    )),
                    const SizedBox(height: 24),

                    // Skills
                    Text('Skills Required', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['Flutter', 'Dart', 'Firebase', 'REST APIs', 'Git', 'Material Design'].map((skill) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.primarySurface,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(skill, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),

            // Apply Button
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -4))],
              ),
              child: Row(
                children: [
                  Container(
                    width: 54, height: 54,
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                    ),
                    child: const Icon(Icons.chat_bubble_outline_rounded, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Container(
                      height: 54,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryLight]),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6))],
                      ),
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: Text('Apply Now', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tag(String text, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: fg)),
    );
  }

  Widget _infoCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(height: 8),
          Text(value, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700), textAlign: TextAlign.center),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textTertiary)),
        ],
      ),
    );
  }
}
