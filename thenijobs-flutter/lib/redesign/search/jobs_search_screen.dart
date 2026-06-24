// ============================================================
// THENIJOBS — Mobile Redesign: Search experience
// Instant (debounced) search · voice search · rich filters.
// Used both as the "Jobs" tab (embedded) and the /jobs route.
// ============================================================

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:thenijobs/core/constants/app_constants.dart';
import 'package:thenijobs/redesign/data/job_actions.dart';
import 'package:thenijobs/redesign/data/job_providers.dart';
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';
import 'package:thenijobs/redesign/widgets/ui_kit.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';

class JobsSearchScreen extends ConsumerStatefulWidget {
  const JobsSearchScreen({
    super.key,
    this.initialSearch,
    this.initialCategory,
    this.initialLocation,
    this.embedded = false,
  });

  final String? initialSearch;
  final String? initialCategory;
  final String? initialLocation;
  final bool embedded;

  @override
  ConsumerState<JobsSearchScreen> createState() => _JobsSearchScreenState();
}

class _JobsSearchScreenState extends ConsumerState<JobsSearchScreen> {
  late final TextEditingController _controller;
  Timer? _debounce;
  JobQuery _query = const JobQuery();

  final SpeechToText _speech = SpeechToText();
  bool _listening = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialSearch ?? '');
    _query = JobQuery(
      search: widget.initialSearch,
      category: widget.initialCategory,
      district: widget.initialLocation,
    );
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    _speech.stop();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      setState(() => _query = _query.copyWith(search: value.trim()));
    });
  }

  Future<void> _toggleVoice() async {
    if (_listening) {
      await _speech.stop();
      setState(() => _listening = false);
      return;
    }
    try {
      final available = await _speech.initialize();
      if (!available) {
        _snack('Voice search is unavailable on this device');
        return;
      }
      setState(() => _listening = true);
      await _speech.listen(onResult: (r) {
        _controller.text = r.recognizedWords;
        _controller.selection = TextSelection.fromPosition(
            TextPosition(offset: _controller.text.length));
        if (r.finalResult) {
          setState(() {
            _listening = false;
            _query = _query.copyWith(search: r.recognizedWords.trim());
          });
        }
      });
    } catch (_) {
      setState(() => _listening = false);
      _snack('Could not start voice search');
    }
  }

  void _snack(String m) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  Future<void> _openFilters() async {
    final result = await showModalBottomSheet<JobQuery>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _FilterSheet(initial: _query),
    );
    if (result != null) setState(() => _query = result);
  }

  int get _activeFilterCount => [
        _query.category,
        _query.district,
        _query.jobType,
        _query.experience,
        _query.salaryMin,
      ].where((e) => e != null).length;

  @override
  Widget build(BuildContext context) {
    final results = ref.watch(searchJobsProvider(_query));
    final savedIds = ref.watch(savedJobIdsProvider).value ?? const <String>{};

    return Scaffold(
      backgroundColor: AppX.bg,
      body: Column(
        children: [
          // ---- Header / search bar ----
          Container(
            color: AppX.bg,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(AppX.s16, AppX.s8, AppX.s16, AppX.s8),
                child: Row(
                  children: [
                    if (!widget.embedded)
                      IconButton(
                        icon: const Icon(Icons.arrow_back_rounded),
                        onPressed: () => Navigator.of(context).maybePop(),
                      ),
                    Expanded(
                      child: Container(
                        height: 50,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: AppX.card(radius: AppX.rSm),
                        child: Row(
                          children: [
                            const Icon(Icons.search_rounded, color: AppX.textTertiary, size: 22),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextField(
                                controller: _controller,
                                onChanged: _onChanged,
                                textInputAction: TextInputAction.search,
                                decoration: const InputDecoration(
                                  hintText: 'Job title, company, skill…',
                                  border: InputBorder.none,
                                  enabledBorder: InputBorder.none,
                                  focusedBorder: InputBorder.none,
                                  filled: false,
                                  contentPadding: EdgeInsets.zero,
                                  isDense: true,
                                ),
                              ),
                            ),
                            if (_controller.text.isNotEmpty)
                              GestureDetector(
                                onTap: () {
                                  _controller.clear();
                                  setState(() => _query = _query.copyWith(search: ''));
                                },
                                child: const Icon(Icons.close_rounded,
                                    size: 18, color: AppX.textTertiary),
                              ),
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: _toggleVoice,
                              child: Icon(
                                _listening ? Icons.mic_rounded : Icons.mic_none_rounded,
                                color: _listening ? AppX.rose : AppX.textTertiary,
                                size: 22,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    _FilterButton(count: _activeFilterCount, onTap: _openFilters),
                  ],
                ),
              ),
            ),
          ),
          // ---- Active filter chips ----
          if (_activeFilterCount > 0) _activeChips(),
          // ---- Results ----
          Expanded(
            child: results.when(
              loading: () => const JobListSkeleton(count: 6),
              error: (e, s) =>
                  ErrorRetry(onRetry: () => ref.invalidate(searchJobsProvider(_query))),
              data: (jobs) {
                if (jobs.isEmpty) {
                  return EmptyState(
                    title: 'No matching jobs',
                    message: 'Try removing some filters or searching a different term.',
                    actionLabel: _activeFilterCount > 0 ? 'Clear filters' : null,
                    onAction: _activeFilterCount > 0
                        ? () => setState(() => _query = JobQuery(search: _query.search))
                        : null,
                  );
                }
                return RefreshIndicator(
                  color: AppX.primary,
                  onRefresh: () async {
                    ref.invalidate(searchJobsProvider(_query));
                    await ref.read(searchJobsProvider(_query).future);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.only(top: 4, bottom: 24),
                    itemCount: jobs.length + 1,
                    itemBuilder: (_, i) {
                      if (i == 0) {
                        return Padding(
                          padding: const EdgeInsets.fromLTRB(AppX.s16, 8, AppX.s16, 4),
                          child: Text('${jobs.length} jobs found',
                              style: Theme.of(context).textTheme.bodyMedium),
                        );
                      }
                      final job = jobs[i - 1];
                      return JobCard(
                        job: job,
                        saved: savedIds.contains(job.id),
                        onSaveTap: () => toggleSaveJob(context, ref, job,
                            currentlySaved: savedIds.contains(job.id)),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _activeChips() {
    final chips = <Widget>[];
    void add(String? v, void Function() clear) {
      if (v == null) return;
      chips.add(Padding(
        padding: const EdgeInsets.only(right: 8),
        child: InputChip(
          label: Text(v),
          onDeleted: () => setState(clear),
          deleteIcon: const Icon(Icons.close_rounded, size: 16),
        ),
      ));
    }

    add(_query.category, () => _query = _query.copyWith(category: null));
    add(_query.district, () => _query = _query.copyWith(district: null));
    add(_query.experience, () => _query = _query.copyWith(experience: null));
    if (_query.jobType != null) {
      add(_query.jobType!.replaceAll('_', ' '),
          () => _query = _query.copyWith(jobType: null));
    }
    if (_query.salaryMin != null) {
      add('₹${_query.salaryMin} +',
          () => _query = _query.copyWith(salaryMin: null, salaryMax: null));
    }

    return SizedBox(
      height: 46,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppX.s16),
        children: chips,
      ),
    );
  }
}

class _FilterButton extends StatelessWidget {
  const _FilterButton({required this.count, required this.onTap});
  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(AppX.rSm),
      onTap: onTap,
      child: Container(
        height: 50,
        width: 50,
        decoration: BoxDecoration(
            gradient: AppX.brandGradient, borderRadius: BorderRadius.circular(AppX.rSm)),
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(Icons.tune_rounded, color: Colors.white),
            if (count > 0)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: AppX.rose, shape: BoxShape.circle),
                  constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                  child: Text('$count',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w800)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ====================================================================
// FILTER SHEET
// ====================================================================

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({required this.initial});
  final JobQuery initial;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late JobQuery _q;

  static const _jobTypes = {
    'full_time': 'Full-time',
    'part_time': 'Part-time',
    'internship': 'Internship',
    'remote': 'Remote',
    'work_from_home': 'Work from home',
    'contract': 'Contract',
    'fresher': 'Fresher',
  };

  @override
  void initState() {
    super.initState();
    _q = widget.initial;
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(AppX.s20, 4, AppX.s20, 8),
              child: Row(
                children: [
                  Text('Filters', style: Theme.of(context).textTheme.titleLarge),
                  const Spacer(),
                  TextButton(
                    onPressed: () => setState(() => _q = JobQuery(search: _q.search)),
                    child: const Text('Reset'),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(AppX.s20, AppX.s16, AppX.s20, AppX.s16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _group('Category', [
                      for (final c in AppConstants.jobCategories)
                        _choice(c, _q.category == c,
                            () => setState(() => _q = _q.copyWith(category: _q.category == c ? null : c))),
                    ]),
                    _group('District', [
                      for (final d in AppConstants.tnDistricts.take(18))
                        _choice(d, _q.district == d,
                            () => setState(() => _q = _q.copyWith(district: _q.district == d ? null : d))),
                    ]),
                    _group('Job type', [
                      for (final entry in _jobTypes.entries)
                        _choice(entry.value, _q.jobType == entry.key,
                            () => setState(() => _q = _q.copyWith(jobType: _q.jobType == entry.key ? null : entry.key))),
                    ]),
                    _group('Experience', [
                      for (final e in AppConstants.experienceLevels)
                        _choice(e, _q.experience == e,
                            () => setState(() => _q = _q.copyWith(experience: _q.experience == e ? null : e))),
                    ]),
                    _group('Salary (monthly)', [
                      for (final r in AppConstants.salaryRanges)
                        _choice(r['label'] as String, _q.salaryMin == r['min'],
                            () => setState(() => _q = _q.salaryMin == r['min']
                                ? _q.copyWith(salaryMin: null, salaryMax: null)
                                : _q.copyWith(
                                    salaryMin: r['min'] as num, salaryMax: r['max'] as num))),
                    ]),
                  ],
                ),
              ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(AppX.s16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(_q),
                  child: const Text('Show results'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _group(String title, List<Widget> chips) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 10),
        Wrap(spacing: 8, runSpacing: 8, children: chips),
        const SizedBox(height: 18),
      ],
    );
  }

  Widget _choice(String label, bool selected, VoidCallback onTap) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      showCheckmark: false,
      labelStyle: TextStyle(
          color: selected ? AppX.primary : AppX.textPrimary,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          fontSize: 12.5),
      side: BorderSide(color: selected ? AppX.primary : AppX.border),
    );
  }
}

// Re-export Job for callers that only import this screen.
typedef SearchJob = Job;
