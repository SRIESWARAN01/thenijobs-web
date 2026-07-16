import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/models/job.dart';
import 'package:thenijobs/providers/auth_provider.dart';
import 'package:thenijobs/screens/seeker/job_search_screen.dart';
import 'package:thenijobs/widgets/common/loading.dart';
import 'package:thenijobs/widgets/common/empty_state.dart';
import 'package:timeago/timeago.dart' as timeago;

final seekerApplicationsProvider = StreamProvider<List<JobApplication>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  final currentUser = ref.watch(authProvider).user;
  if (currentUser == null) return const Stream.empty();
  return service.streamSeekerApplications(currentUser.uid);
});

class SeekerApplicationsScreen extends ConsumerWidget {
  const SeekerApplicationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(seekerApplicationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Applications'),
      ),
      body: SafeArea(
        child: state.when(
          data: (apps) {
            if (apps.isEmpty) {
              return const EmptyStateView(
                title: 'No Applications Yet',
                description: 'You haven\'t applied to any jobs yet. Start exploring!',
                icon: Icons.assignment_outlined,
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: apps.length,
              itemBuilder: (context, index) {
                final app = apps[index];

                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.base),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              app.companyName ?? 'Verified Employer',
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            _buildStatusBadge(app.status),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Applied: ${timeago.format(app.appliedAt)}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textTertiary,
                              ),
                        ),
                        if (app.coverLetter != null && app.coverLetter!.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.md),
                          const Divider(),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            'Cover Letter:',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            app.coverLetter!,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            );
          },
          loading: () => const ListShimmer(),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(ApplicationStatus status) {
    Color color;
    Color bg;

    switch (status) {
      case ApplicationStatus.applied:
        color = AppColors.statusApplied;
        bg = AppColors.infoSurface;
        break;
      case ApplicationStatus.underReview:
      case ApplicationStatus.pendingReview:
        color = AppColors.statusReview;
        bg = AppColors.seekerSurface;
        break;
      case ApplicationStatus.shortlisted:
        color = AppColors.statusShortlisted;
        bg = AppColors.seekerSurface;
        break;
      case ApplicationStatus.interviewScheduled:
      case ApplicationStatus.interviewAttended:
        color = AppColors.statusInterview;
        bg = AppColors.warningSurface;
        break;
      case ApplicationStatus.selected:
        color = AppColors.statusSelected;
        bg = AppColors.successSurface;
        break;
      case ApplicationStatus.rejected:
        color = AppColors.statusRejected;
        bg = AppColors.errorSurface;
        break;
      default:
        color = AppColors.textSecondary;
        bg = AppColors.surfaceVariant;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.label,
        style: GoogleFonts.inter(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
