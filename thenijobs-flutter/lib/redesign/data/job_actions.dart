// ============================================================
// THENIJOBS — Mobile Redesign: gated job actions (save / apply)
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/redesign/auth/login_sheet.dart';
import 'package:thenijobs/redesign/data/job_providers.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';

/// Toggle a job's saved state. Requires login; opens the login sheet
/// for guests and resumes the action automatically once signed in.
Future<void> toggleSaveJob(
  BuildContext context,
  WidgetRef ref,
  Job job, {
  required bool currentlySaved,
}) async {
  final ok = await ensureLoggedIn(context, ref, reason: 'Sign in to save jobs');
  if (!ok) return;
  final user = ref.read(authStateStreamProvider).value;
  if (user == null) return;

  final service = ref.read(firestoreServiceProvider);
  try {
    if (currentlySaved) {
      await service.unsaveJob(user.uid, job.id);
    } else {
      await service.saveJob(user.uid, job.id, metadata: {
        'jobTitle': job.title,
        'companyName': job.companyName,
        'companyId': job.companyId,
      });
    }
    ref.invalidate(savedJobIdsProvider);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(currentlySaved ? 'Removed from saved' : 'Saved')),
      );
    }
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Could not update saved jobs: $e')));
    }
  }
}
