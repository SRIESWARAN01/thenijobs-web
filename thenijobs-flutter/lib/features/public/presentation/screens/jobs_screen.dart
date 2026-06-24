import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:speech_to_text/speech_to_text.dart' as speech;
import 'package:thenijobs/core/constants/app_constants.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';
import 'package:thenijobs/features/public/presentation/widgets/mobile_job_widgets.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';

class JobsScreen extends ConsumerStatefulWidget {
  const JobsScreen({
    super.key,
    this.initialSearch,
    this.initialLocation,
    this.initialCategory,
    this.initialSort,
    this.focusSearch = false,
  });

  final String? initialSearch;
  final String? initialLocation;
  final String? initialCategory;
  final String? initialSort;
  final bool focusSearch;

  @override
  ConsumerState<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends ConsumerState<JobsScreen> {
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  final _speech = speech.SpeechToText();

  String _searchQuery = '';
  String _selectedLocation = '';
  String _selectedExperience = '';
  String _sortBy = 'latest';
  RangeValues _salaryRange = const RangeValues(0, 100000);
  bool _isListening = false;
  bool _speechReady = false;

  final Set<String> _selectedTypes = {};
  final Set<String> _selectedCategories = {};

  static const _jobTypes = [
    'Full Time',
    'Part Time',
    'Remote',
    'WFH',
    'Internship',
    'Fresher',
    'Contract',
  ];

  static const _sortOptions = {
    'latest': 'Latest',
    'relevance': 'Relevant',
    'salary': 'Salary',
    'trending': 'Trending',
    'featured': 'Featured',
  };

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.initialSearch?.trim() ?? '';
    _searchQuery = _searchController.text;
    _selectedLocation = widget.initialLocation?.trim() ?? '';
    _sortBy = _sortOptions.containsKey(widget.initialSort)
        ? widget.initialSort!
        : 'latest';

    final category = widget.initialCategory?.trim();
    if (category != null && category.isNotEmpty) {
      _selectedCategories.add(category);
    }

    _searchController.addListener(() {
      setState(() => _searchQuery = _searchController.text.trim());
    });

    _initializeSpeech();

    if (widget.focusSearch) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _searchFocusNode.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _speech.stop();
    super.dispose();
  }

  Future<void> _initializeSpeech() async {
    try {
      final available = await _speech.initialize(
        onStatus: (status) {
          if (!mounted) return;
          if (status == 'done' || status == 'notListening') {
            setState(() => _isListening = false);
          }
        },
        onError: (_) {
          if (mounted) setState(() => _isListening = false);
        },
      );
      if (mounted) setState(() => _speechReady = available);
    } catch (_) {
      if (mounted) setState(() => _speechReady = false);
    }
  }

  Future<void> _toggleVoiceSearch() async {
    if (_isListening) {
      await _speech.stop();
      if (mounted) setState(() => _isListening = false);
      return;
    }

    final available = _speechReady || await _speech.initialize();
    if (!available) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Voice search is not available on this device'),
        ),
      );
      return;
    }

    setState(() => _isListening = true);
    await _speech.listen(
      onResult: (result) {
        if (!mounted) return;
        setState(() {
          _searchController.text = result.recognizedWords;
          _searchController.selection = TextSelection.collapsed(
            offset: _searchController.text.length,
          );
          _searchQuery = result.recognizedWords.trim();
        });
      },
    );
  }

  Future<void> _refresh() async {
    ref.invalidate(allJobsProvider);
    ref.invalidate(savedJobsStreamProvider);
    await Future<void>.delayed(const Duration(milliseconds: 350));
  }

  int get _activeFilterCount {
    var count = _selectedTypes.length + _selectedCategories.length;
    if (_selectedLocation.isNotEmpty) count++;
    if (_selectedExperience.isNotEmpty) count++;
    if (_salaryRange.start > 0 || _salaryRange.end < 100000) count++;
    return count;
  }

  List<Job> _filterAndSort(List<Job> jobs) {
    final query = _searchQuery.toLowerCase();

    final filtered = jobs.where((job) {
      final matchesSearch =
          query.isEmpty ||
          job.title.toLowerCase().contains(query) ||
          job.companyName.toLowerCase().contains(query) ||
          job.location.toLowerCase().contains(query) ||
          job.district.toLowerCase().contains(query) ||
          job.skills.any((skill) => skill.toLowerCase().contains(query));

      final matchesLocation =
          _selectedLocation.isEmpty ||
          job.location.toLowerCase().contains(
            _selectedLocation.toLowerCase(),
          ) ||
          job.district.toLowerCase().contains(_selectedLocation.toLowerCase());

      final typeLabel = friendlyJobType(job.jobType);
      final matchesType =
          _selectedTypes.isEmpty || _selectedTypes.contains(typeLabel);
      final matchesCategory =
          _selectedCategories.isEmpty ||
          _selectedCategories.contains(job.category);

      final matchesExperience =
          _selectedExperience.isEmpty ||
          job.experience.toLowerCase().contains(
            _selectedExperience.toLowerCase(),
          ) ||
          (_selectedExperience == 'Fresher' && typeLabel == 'Fresher');

      final salaryMin = job.salaryMin;
      final salaryMax = job.salaryMax;
      final usingSalaryFilter =
          _salaryRange.start > 0 || _salaryRange.end < 100000;
      final matchesSalary =
          !usingSalaryFilter ||
          (salaryMin != null &&
              salaryMax != null &&
              salaryMax >= _salaryRange.start &&
              salaryMin <= _salaryRange.end) ||
          (salaryMax != null &&
              salaryMax >= _salaryRange.start &&
              salaryMax <= _salaryRange.end) ||
          (salaryMin != null &&
              salaryMin >= _salaryRange.start &&
              salaryMin <= _salaryRange.end);

      return matchesSearch &&
          matchesLocation &&
          matchesType &&
          matchesCategory &&
          matchesExperience &&
          matchesSalary;
    }).toList();

    filtered.sort((a, b) {
      switch (_sortBy) {
        case 'salary':
          return (b.salaryMax ?? b.salaryMin ?? 0).compareTo(
            a.salaryMax ?? a.salaryMin ?? 0,
          );
        case 'relevance':
          return _relevanceScore(b, query).compareTo(_relevanceScore(a, query));
        case 'trending':
          return _trendScore(b).compareTo(_trendScore(a));
        case 'featured':
          return _featuredScore(b).compareTo(_featuredScore(a));
        case 'latest':
        default:
          return b.createdAt.compareTo(a.createdAt);
      }
    });

    return filtered;
  }

  int _relevanceScore(Job job, String query) {
    if (query.isEmpty) return _featuredScore(job);
    var score = 0;
    if (job.title.toLowerCase().contains(query)) score += 10;
    if (job.companyName.toLowerCase().contains(query)) score += 6;
    if (job.skills.any((skill) => skill.toLowerCase().contains(query))) {
      score += 5;
    }
    if (job.location.toLowerCase().contains(query) ||
        job.district.toLowerCase().contains(query)) {
      score += 3;
    }
    return score + _featuredScore(job);
  }

  int _trendScore(Job job) =>
      job.viewCount + (job.applicationsCount * 3) + (job.isUrgent ? 25 : 0);

  int _featuredScore(Job job) =>
      (job.isFeatured ? 30 : 0) +
      (job.isPremium ? 20 : 0) +
      (job.isUrgent ? 10 : 0);

  Future<void> _toggleSaveJob(
    Job job,
    List<String> savedJobIds,
    String? userId,
  ) async {
    if (userId == null) {
      context.go(
        '/login?redirect=${Uri.encodeComponent('/jobs/${job.id}?save=1')}',
      );
      return;
    }

    final service = ref.read(firestoreServiceProvider);
    final isSaved = savedJobIds.contains(job.id);

    try {
      if (isSaved) {
        await service.unsaveJob(userId, job.id);
      } else {
        await service.saveJob(
          userId,
          job.id,
          metadata: {
            'jobTitle': job.title,
            'companyName': job.companyName,
            'description': job.description,
            'district': job.location.isNotEmpty ? job.location : job.district,
            'jobType': job.jobType.toJson(),
            'salaryMin': job.salaryMin ?? 0,
            'salaryMax': job.salaryMax ?? 0,
            'skills': job.skills,
          },
        );
      }
      ref.invalidate(savedJobsStreamProvider);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not update saved job: $error')),
      );
    }
  }

  void _showFilters() {
    var draftLocation = _selectedLocation;
    var draftExperience = _selectedExperience;
    var draftSalary = _salaryRange;
    final draftTypes = {..._selectedTypes};
    final draftCategories = {..._selectedCategories};

    showModalBottomSheet(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
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
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
                      child: Row(
                        children: [
                          const Expanded(
                            child: Text(
                              'Filters',
                              style: TextStyle(
                                color: AppTheme.lightTextPrimary,
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              setModalState(() {
                                draftLocation = '';
                                draftExperience = '';
                                draftSalary = const RangeValues(0, 100000);
                                draftTypes.clear();
                                draftCategories.clear();
                              });
                            },
                            child: const Text('Clear'),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const _FilterTitle(
                              icon: Icons.location_on_outlined,
                              label: 'Location',
                            ),
                            DropdownButtonFormField<String>(
                              key: ValueKey(draftLocation),
                              initialValue: draftLocation.isEmpty
                                  ? null
                                  : draftLocation,
                              items: AppConstants.tnDistricts
                                  .map(
                                    (district) => DropdownMenuItem(
                                      value: district,
                                      child: Text(district),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (value) =>
                                  setModalState(() => draftLocation = value ?? ''),
                              decoration: const InputDecoration(
                                hintText: 'All Tamil Nadu',
                              ),
                            ),
                            const SizedBox(height: 20),
                            const _FilterTitle(
                              icon: Icons.work_outline_rounded,
                              label: 'Job type',
                            ),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                for (final type in _jobTypes)
                                  FilterChip(
                                    label: Text(type),
                                    selected: draftTypes.contains(type),
                                    onSelected: (selected) {
                                      setModalState(() {
                                        selected
                                            ? draftTypes.add(type)
                                            : draftTypes.remove(type);
                                      });
                                    },
                                  ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            const _FilterTitle(
                              icon: Icons.category_outlined,
                              label: 'Category',
                            ),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                for (final category in AppConstants.jobCategories.take(
                                  12,
                                ))
                                  FilterChip(
                                    label: Text(category),
                                    selected: draftCategories.contains(category),
                                    onSelected: (selected) {
                                      setModalState(() {
                                        selected
                                            ? draftCategories.add(category)
                                            : draftCategories.remove(category);
                                      });
                                    },
                                  ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            const _FilterTitle(
                              icon: Icons.payments_outlined,
                              label: 'Monthly salary',
                            ),
                            RangeSlider(
                              values: draftSalary,
                              min: 0,
                              max: 100000,
                              divisions: 20,
                              labels: RangeLabels(
                                'INR ${draftSalary.start.round()}',
                                draftSalary.end >= 100000
                                    ? 'INR 100000+'
                                    : 'INR ${draftSalary.end.round()}',
                              ),
                              onChanged: (value) =>
                                  setModalState(() => draftSalary = value),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'INR ${draftSalary.start.round()} - ${draftSalary.end >= 100000 ? '100000+' : draftSalary.end.round()}',
                              style: const TextStyle(
                                color: AppTheme.lightTextSecondary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 20),
                            const _FilterTitle(
                              icon: Icons.timeline_rounded,
                              label: 'Experience',
                            ),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                for (final experience in AppConstants.experienceLevels)
                                  ChoiceChip(
                                    label: Text(experience),
                                    selected: draftExperience == experience,
                                    onSelected: (selected) {
                                      setModalState(
                                        () => draftExperience = selected
                                            ? experience
                                            : '',
                                      );
                                    },
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const Divider(height: 1),
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: () {
                            setState(() {
                              _selectedLocation = draftLocation;
                              _selectedExperience = draftExperience;
                              _salaryRange = draftSalary;
                              _selectedTypes
                                ..clear()
                                ..addAll(draftTypes);
                              _selectedCategories
                                ..clear()
                                ..addAll(draftCategories);
                            });
                            Navigator.of(context).pop();
                          },
                          icon: const Icon(Icons.check_rounded),
                          label: const Text('Apply filters'),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final jobsAsync = ref.watch(allJobsProvider);
    final savedJobsAsync = ref.watch(savedJobsStreamProvider);
    final user = ref.watch(authStateStreamProvider).value;
    final savedJobIds = savedJobsAsync.value ?? const <String>[];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: _SearchHeader(
                  controller: _searchController,
                  focusNode: _searchFocusNode,
                  activeFilterCount: _activeFilterCount,
                  sortBy: _sortBy,
                  isListening: _isListening,
                  onVoice: _toggleVoiceSearch,
                  onFilter: _showFilters,
                  onSortChanged: (value) {
                    if (value != null) setState(() => _sortBy = value);
                  },
                ),
              ),
              jobsAsync.when(
                data: (jobs) {
                  final filtered = _filterAndSort(
                    jobs.where((job) => job.isActive).toList(),
                  );

                  if (filtered.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyResults(
                        onClear: () {
                          setState(() {
                            _searchController.clear();
                            _selectedLocation = '';
                            _selectedExperience = '';
                            _salaryRange = const RangeValues(0, 100000);
                            _selectedTypes.clear();
                            _selectedCategories.clear();
                          });
                        },
                      ),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate((context, index) {
                        if (index.isOdd) return const SizedBox(height: 12);
                        final itemIndex = index ~/ 2;
                        if (itemIndex == 0) {
                          return _ResultsSummary(
                            count: filtered.length,
                            query: _searchQuery,
                          );
                        }
                        final job = filtered[itemIndex - 1];
                        return NativeJobCard(
                          job: job,
                          isSaved: savedJobIds.contains(job.id),
                          onTap: () => context.push('/jobs/${job.id}'),
                          onSave: () =>
                              _toggleSaveJob(job, savedJobIds, user?.uid),
                        );
                      }, childCount: (filtered.length + 1) * 2 - 1),
                    ),
                  );
                },
                loading: () => const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(top: 18),
                    child: JobSkeletonList(count: 6),
                  ),
                ),
                error: (_, __) => SliverFillRemaining(
                  hasScrollBody: false,
                  child: _EmptyResults(
                    title: 'Jobs could not load',
                    message: 'Pull down to refresh the latest listings.',
                    onClear: _refresh,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchHeader extends StatelessWidget {
  const _SearchHeader({
    required this.controller,
    required this.focusNode,
    required this.activeFilterCount,
    required this.sortBy,
    required this.isListening,
    required this.onVoice,
    required this.onFilter,
    required this.onSortChanged,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final int activeFilterCount;
  final String sortBy;
  final bool isListening;
  final VoidCallback onVoice;
  final VoidCallback onFilter;
  final ValueChanged<String?> onSortChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppTheme.lightBorder)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                tooltip: 'Back',
                onPressed: () =>
                    context.canPop() ? context.pop() : context.go('/'),
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              const Expanded(
                child: Text(
                  'Search jobs',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppTheme.lightTextPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              IconButton(
                tooltip: 'Post job',
                onPressed: () => context.go('/employer/post-job'),
                icon: const Icon(Icons.add_business_outlined),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SearchBar(
            controller: controller,
            focusNode: focusNode,
            hintText: 'Title, company, skill, location',
            leading: const Icon(Icons.search_rounded),
            trailing: [
              IconButton(
                tooltip: isListening ? 'Stop voice search' : 'Voice search',
                onPressed: onVoice,
                icon: Icon(
                  isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                  color: isListening ? AppTheme.brandRose : null,
                ),
              ),
              if (controller.text.isNotEmpty)
                IconButton(
                  tooltip: 'Clear',
                  onPressed: controller.clear,
                  icon: const Icon(Icons.close_rounded),
                ),
            ],
            elevation: const WidgetStatePropertyAll(0),
            backgroundColor: const WidgetStatePropertyAll(Color(0xFFF8FAFC)),
            shape: WidgetStatePropertyAll(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
            ),
            padding: const WidgetStatePropertyAll(
              EdgeInsets.symmetric(horizontal: 14),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onFilter,
                  icon: const Icon(Icons.tune_rounded),
                  label: Text(
                    activeFilterCount == 0
                        ? 'Filters'
                        : 'Filters ($activeFilterCount)',
                  ),
                ),
              ),
              const SizedBox(width: 10),
              DropdownMenu<String>(
                initialSelection: sortBy,
                width: 150,
                onSelected: onSortChanged,
                dropdownMenuEntries: [
                  for (final entry in _JobsScreenState._sortOptions.entries)
                    DropdownMenuEntry(value: entry.key, label: entry.value),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ResultsSummary extends StatelessWidget {
  const _ResultsSummary({required this.count, required this.query});

  final int count;
  final String query;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$count job${count == 1 ? '' : 's'} found',
                style: const TextStyle(
                  color: AppTheme.lightTextPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
              if (query.isNotEmpty)
                Text(
                  'Instant results for "$query"',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppTheme.lightTextSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
            ],
          ),
        ),
        const Icon(Icons.bolt_rounded, color: AppTheme.brandAmber),
      ],
    );
  }
}

class _FilterTitle extends StatelessWidget {
  const _FilterTitle({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.brandIndigo),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.lightTextPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults({
    required this.onClear,
    this.title = 'No matching jobs',
    this.message = 'Try a different keyword or clear filters.',
  });

  final VoidCallback onClear;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.manage_search_rounded,
              size: 56,
              color: AppTheme.lightTextSecondary,
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.lightTextPrimary,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.lightTextSecondary,
                fontSize: 13,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.tonalIcon(
              onPressed: onClear,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Reset search'),
            ),
          ],
        ),
      ),
    );
  }
}
