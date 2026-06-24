// ============================================================
// THENIJOBS — Mobile Redesign: Apply flow
// Resume selection / upload + cover letter → applyToJob().
// Caller must ensure the user is logged in before showing.
// ============================================================

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/core/services/storage_service.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';

/// Shows the apply bottom sheet. Returns true if an application was submitted.
Future<bool> showApplySheet(
  BuildContext context,
  WidgetRef ref,
  Job job,
) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _ApplySheet(job: job),
  );
  return result ?? false;
}

class _ResumeOption {
  _ResumeOption(this.name, this.url);
  final String name;
  final String url;
}

class _ApplySheet extends ConsumerStatefulWidget {
  const _ApplySheet({required this.job});
  final Job job;

  @override
  ConsumerState<_ApplySheet> createState() => _ApplySheetState();
}

class _ApplySheetState extends ConsumerState<_ApplySheet> {
  final _coverLetter = TextEditingController();
  List<_ResumeOption> _resumes = [];
  _ResumeOption? _selected;
  bool _loading = true;
  bool _submitting = false;
  bool _uploading = false;
  String? _error;
  String _seekerEmail = '';
  String _seekerPhone = '';
  String _seekerName = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _coverLetter.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final user = ref.read(authStateStreamProvider).value;
    if (user == null) {
      setState(() => _loading = false);
      return;
    }
    _seekerEmail = user.email;
    _seekerPhone = user.phone ?? '';
    _seekerName = user.displayName;
    try {
      final profile = await ref
          .read(firestoreServiceProvider)
          .getSeekerProfile(user.uid);
      final raw = (profile?['resumes'] as List?) ?? const [];
      _resumes = raw
          .whereType<Map>()
          .map(
            (m) => _ResumeOption(
              (m['name'] ?? m['title'] ?? 'Resume').toString(),
              (m['url'] ?? m['resumeUrl'] ?? '').toString(),
            ),
          )
          .where((r) => r.url.isNotEmpty)
          .toList();
      _selected = _resumes.isNotEmpty ? _resumes.first : null;
      _seekerName = (profile?['name'] as String?)?.trim().isNotEmpty == true
          ? profile!['name'] as String
          : _seekerName;
    } catch (_) {
      // Profile may be empty; user can still upload now.
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _pickAndUpload() async {
    final user = ref.read(authStateStreamProvider).value;
    if (user == null) return;
    try {
      final picked = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx'],
        withData: true,
      );
      if (picked == null || picked.files.isEmpty) return;
      final file = picked.files.single;
      final bytes = file.bytes;
      if (bytes == null) {
        setState(() => _error = 'Could not read the selected file');
        return;
      }
      setState(() => _uploading = true);
      final ts = DateTime.now().millisecondsSinceEpoch;
      final result = await StorageService().uploadFile(
        path: 'resumes/${user.uid}/${ts}_${file.name}',
        file: bytes,
        allowedExtensions: const {'pdf', 'doc', 'docx'},
      );
      final option = _ResumeOption(file.name, result.url);
      // Persist to the seeker profile so it is reusable next time.
      try {
        await ref.read(firestoreServiceProvider).addSeekerResume(user.uid, {
          'name': file.name,
          'url': result.url,
          'path': result.path,
          'uploadedAt': DateTime.now().toIso8601String(),
        });
      } catch (_) {}
      setState(() {
        _resumes = [option, ..._resumes];
        _selected = option;
        _uploading = false;
      });
    } catch (e) {
      setState(() {
        _uploading = false;
        _error = 'Upload failed: $e';
      });
    }
  }

  Future<void> _submit() async {
    final user = ref.read(authStateStreamProvider).value;
    if (user == null) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref
          .read(firestoreServiceProvider)
          .applyToJob(
            ApplyToJobData(
              jobId: widget.job.id,
              companyId: widget.job.companyId,
              seekerId: user.uid,
              seekerName: _seekerName.isEmpty ? user.email : _seekerName,
              jobTitle: widget.job.title,
              companyName: widget.job.companyName,
              seekerEmail: _seekerEmail.isEmpty ? null : _seekerEmail,
              seekerPhone: _seekerPhone.isEmpty ? null : _seekerPhone,
              resumeUrl: _selected?.url,
              resumeName: _selected?.name,
              coverLetter: _coverLetter.text.trim().isEmpty
                  ? null
                  : _coverLetter.text.trim(),
            ),
          );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppX.s20,
        4,
        AppX.s20,
        AppX.s20 + bottomInset,
      ),
      child: _loading
          ? const Padding(
              padding: EdgeInsets.all(40),
              child: Center(child: CircularProgressIndicator()),
            )
          : Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Apply to ${widget.job.title}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 2),
                Text(
                  widget.job.companyName,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 18),
                if (_error != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppX.rose.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(AppX.rSm),
                    ),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: AppX.rose, fontSize: 12.5),
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
                Text('Resume', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (_resumes.isEmpty)
                  Text(
                    'No resume on file — upload one to continue.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  )
                else
                  ..._resumes.map(
                    (r) => RadioListTile<_ResumeOption>(
                      value: r,
                      // ignore: deprecated_member_use
                      groupValue: _selected,
                      // ignore: deprecated_member_use
                      onChanged: (v) => setState(() => _selected = v),
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        r.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      activeColor: AppX.primary,
                    ),
                  ),
                const SizedBox(height: 6),
                OutlinedButton.icon(
                  onPressed: _uploading ? null : _pickAndUpload,
                  icon: _uploading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.upload_file_rounded),
                  label: Text(_uploading ? 'Uploading…' : 'Upload new resume'),
                ),
                const SizedBox(height: 18),
                Text(
                  'Cover letter (optional)',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _coverLetter,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Tell the employer why you are a great fit…',
                  ),
                ),
                const SizedBox(height: 18),
                ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Submit application'),
                ),
              ],
            ),
    );
  }
}
