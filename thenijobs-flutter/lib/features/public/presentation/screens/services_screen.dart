// ============================================================
// THENIJOBS — Services Directory Screen
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';
import 'package:thenijobs/shared/data/models/company_model.dart';
import 'package:thenijobs/features/public/presentation/widgets/home_footer.dart';
import 'package:thenijobs/shared/widgets/floating_whatsapp.dart';

class ServicesScreen extends ConsumerStatefulWidget {
  const ServicesScreen({
    super.key,
    this.initialSearch,
    this.initialCategory,
    this.initialDistrict,
  });

  final String? initialSearch;
  final String? initialCategory;
  final String? initialDistrict;

  @override
  ConsumerState<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends ConsumerState<ServicesScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCategory = 'All';
  String _selectedDistrict = 'All';
  bool _showVerifiedOnly = false;
  String _sortBy = 'premium'; // premium, rating, jobs, new
  bool _showFilters = false;

  final List<String> _categories = const [
    'All',
    'Agriculture',
    'Construction',
    'Education',
    'Healthcare',
    'IT & Software',
    'Textiles',
    'Manufacturing',
    'Retail',
    'Transport',
    'Finance',
    'Food & Beverage',
  ];

  final List<String> _districts = const [
    'All',
    'Theni',
    'Madurai',
    'Dindigul',
    'Coimbatore',
    'Salem',
    'Chennai',
    'Trichy',
  ];

  @override
  void initState() {
    super.initState();
    final initialSearch = widget.initialSearch?.trim() ?? '';
    final initialCategory = widget.initialCategory?.trim() ?? '';
    final initialDistrict = widget.initialDistrict?.trim() ?? '';
    if (initialSearch.isNotEmpty) {
      _searchController.text = initialSearch;
      _searchQuery = initialSearch;
    }
    if (initialCategory.isNotEmpty) {
      _selectedCategory = _categories.firstWhere(
        (item) => item.toLowerCase() == initialCategory.toLowerCase(),
        orElse: () => 'All',
      );
    }
    if (initialDistrict.isNotEmpty && initialDistrict != 'All Areas') {
      _selectedDistrict = _districts.firstWhere(
        (item) => item.toLowerCase() == initialDistrict.toLowerCase(),
        orElse: () => 'All',
      );
    }
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.trim();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final companiesAsync = ref.watch(allCompaniesProvider);
    final allJobsAsync = ref.watch(allJobsProvider);

    // Calculate active job count per company
    final Map<String, int> companyJobCounts = {};
    if (allJobsAsync.value != null) {
      for (var job in allJobsAsync.value!) {
        companyJobCounts[job.companyId] =
            (companyJobCounts[job.companyId] ?? 0) + 1;
      }
    }

    // Filter companies offering services
    final allCompanies = companiesAsync.value ?? [];
    final filteredServices = allCompanies.where((biz) {
      final q = _searchQuery.toLowerCase();
      final matchSearch =
          q.isEmpty ||
          biz.name.toLowerCase().contains(q) ||
          biz.description.toLowerCase().contains(q) ||
          biz.category.toLowerCase().contains(q);

      final matchCat =
          _selectedCategory == 'All' || biz.category == _selectedCategory;
      final matchDist =
          _selectedDistrict == 'All' ||
          biz.district.toLowerCase() == _selectedDistrict.toLowerCase();
      final matchVerified =
          !_showVerifiedOnly ||
          (biz.verificationBadges.businessVerified ||
              biz.verificationStatus == VerificationStatus.verified);

      return matchSearch && matchCat && matchDist && matchVerified;
    }).toList();

    // Sort
    filteredServices.sort((a, b) {
      if (_sortBy == 'premium') {
        final valA = a.isPremium ? 1 : 0;
        final valB = b.isPremium ? 1 : 0;
        return valB.compareTo(valA);
      } else if (_sortBy == 'rating') {
        return b.rating.compareTo(a.rating);
      } else if (_sortBy == 'jobs') {
        final jobsA = companyJobCounts[a.id] ?? 0;
        final jobsB = companyJobCounts[b.id] ?? 0;
        return jobsB.compareTo(jobsA);
      } else {
        // 'new'
        return b.createdAt.compareTo(a.createdAt);
      }
    });

    final activeFilters =
        (_selectedCategory != 'All' ? 1 : 0) +
        (_selectedDistrict != 'All' ? 1 : 0) +
        (_showVerifiedOnly ? 1 : 0);

    return Scaffold(
      backgroundColor: AppTheme.lightBg,
      appBar: AppBar(
        title: const Text('Services Directory'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 1,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(allCompaniesProvider);
            ref.invalidate(allJobsProvider);
          },
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Sticky Search bar mock
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16.0,
                    vertical: 12.0,
                  ),
                  child: Center(
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 1100),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              // Search input
                              Expanded(
                                flex: 3,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: TailwindColors.slate.shade50,
                                    border: Border.all(
                                      color: TailwindColors.slate.shade200,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.search,
                                        size: 16,
                                        color: Colors.grey,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: TextField(
                                          controller: _searchController,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          decoration: InputDecoration(
                                            hintText:
                                                'Search services, providers...',
                                            hintStyle: TextStyle(
                                              color:
                                                  TailwindColors.slate.shade400,
                                              fontSize: 12,
                                              fontWeight: FontWeight.normal,
                                            ),
                                            border: InputBorder.none,
                                            isDense: true,
                                          ),
                                        ),
                                      ),
                                      if (_searchQuery.isNotEmpty)
                                        IconButton(
                                          onPressed: () =>
                                              _searchController.clear(),
                                          icon: const Icon(
                                            Icons.close,
                                            size: 16,
                                            color: Colors.grey,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // District
                              Expanded(
                                flex: 2,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: TailwindColors.slate.shade50,
                                    border: Border.all(
                                      color: TailwindColors.slate.shade200,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.location_on,
                                        size: 14,
                                        color: AppTheme.primaryPurple,
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: DropdownButtonHideUnderline(
                                          child: DropdownButton<String>(
                                            value: _selectedDistrict,
                                            isExpanded: true,
                                            style: TextStyle(
                                              color:
                                                  TailwindColors.slate.shade700,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                            items: _districts
                                                .map(
                                                  (dist) => DropdownMenuItem(
                                                    value: dist,
                                                    child: Text(dist),
                                                  ),
                                                )
                                                .toList(),
                                            onChanged: (val) {
                                              if (val != null) {
                                                setState(
                                                  () => _selectedDistrict = val,
                                                );
                                              }
                                            },
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // Filter Toggle
                              ElevatedButton(
                                onPressed: () {
                                  setState(() => _showFilters = !_showFilters);
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor:
                                      _showFilters || activeFilters > 0
                                      ? AppTheme.primaryPurple.withValues(
                                          alpha: 0.12,
                                        )
                                      : TailwindColors.slate.shade50,
                                  foregroundColor:
                                      _showFilters || activeFilters > 0
                                      ? AppTheme.primaryPurple
                                      : TailwindColors.slate.shade600,
                                  surfaceTintColor: Colors.white,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    side: BorderSide(
                                      color: _showFilters || activeFilters > 0
                                          ? AppTheme.primaryPurple.withValues(
                                              alpha: 0.4,
                                            )
                                          : TailwindColors.slate.shade200,
                                    ),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 14,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.tune, size: 16),
                                    if (activeFilters > 0) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        width: 18,
                                        height: 18,
                                        decoration: const BoxDecoration(
                                          color: AppTheme.primaryPurple,
                                          shape: BoxShape.circle,
                                        ),
                                        child: Center(
                                          child: Text(
                                            '$activeFilters',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),

                          // Advanced filters
                          if (_showFilters) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border.all(
                                  color: TailwindColors.slate.shade200,
                                ),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Service Category',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.grey,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: _categories.map((cat) {
                                      final isSelected =
                                          _selectedCategory == cat;
                                      return FilterChip(
                                        label: Text(
                                          cat,
                                          style: const TextStyle(fontSize: 11),
                                        ),
                                        selected: isSelected,
                                        onSelected: (selected) {
                                          setState(() {
                                            _selectedCategory = selected
                                                ? cat
                                                : 'All';
                                          });
                                        },
                                        selectedColor: AppTheme.primaryPurple
                                            .withValues(alpha: 0.15),
                                        checkmarkColor: AppTheme.primaryPurple,
                                      );
                                    }).toList(),
                                  ),
                                  const SizedBox(height: 16),

                                  Row(
                                    children: [
                                      Switch.adaptive(
                                        value: _showVerifiedOnly,
                                        activeThumbColor: Colors.teal,
                                        activeTrackColor: Colors.teal
                                            .withValues(alpha: 0.35),
                                        onChanged: (val) {
                                          setState(
                                            () => _showVerifiedOnly = val,
                                          );
                                        },
                                      ),
                                      const SizedBox(width: 8),
                                      const Text(
                                        'Verified services only',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(
                                        Icons.verified,
                                        color: Colors.teal,
                                        size: 14,
                                      ),
                                    ],
                                  ),

                                  if (activeFilters > 0) ...[
                                    const SizedBox(height: 12),
                                    TextButton.icon(
                                      onPressed: () {
                                        setState(() {
                                          _selectedCategory = 'All';
                                          _selectedDistrict = 'All';
                                          _showVerifiedOnly = false;
                                        });
                                      },
                                      icon: const Icon(
                                        Icons.clear_all,
                                        size: 16,
                                        color: Colors.red,
                                      ),
                                      label: const Text(
                                        'Clear all filters',
                                        style: TextStyle(
                                          color: Colors.red,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Main Listing Body
                Center(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 1100),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        // Stats & Sort Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  companiesAsync.isLoading
                                      ? 'Loading...'
                                      : '${filteredServices.length} Services Available',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                Text(
                                  _selectedCategory != 'All'
                                      ? 'Category: $_selectedCategory'
                                      : 'All categories across Tamil Nadu',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: TailwindColors.slate.shade500,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),

                            // Sort dropdown
                            Row(
                              children: [
                                Text(
                                  'Sort: ',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: TailwindColors.slate.shade500,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    border: Border.all(
                                      color: TailwindColors.slate.shade200,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      value: _sortBy,
                                      isExpanded: true,
                                      style: TextStyle(
                                        color: TailwindColors.slate.shade700,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      items: const [
                                        DropdownMenuItem(
                                          value: 'premium',
                                          child: Text('Featured First'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'rating',
                                          child: Text('Top Rated'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'jobs',
                                          child: Text('Most Jobs'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'new',
                                          child: Text('Newest'),
                                        ),
                                      ],
                                      onChanged: (val) {
                                        if (val != null) {
                                          setState(() => _sortBy = val);
                                        }
                                      },
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Horizontal Categories pills
                        SizedBox(
                          height: 44,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: _categories.length - 1,
                            itemBuilder: (context, idx) {
                              final cat = _categories[idx + 1];
                              final isSelected = _selectedCategory == cat;
                              return Padding(
                                padding: const EdgeInsets.only(right: 6.0),
                                child: ChoiceChip(
                                  label: Text(
                                    cat,
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                  selected: isSelected,
                                  onSelected: (selected) {
                                    setState(() {
                                      _selectedCategory = selected
                                          ? cat
                                          : 'All';
                                    });
                                  },
                                  selectedColor: AppTheme.primaryPurple,
                                  labelStyle: TextStyle(
                                    color: isSelected
                                        ? Colors.white
                                        : Colors.black87,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Grid List of services
                        companiesAsync.when(
                          data: (companiesList) {
                            if (filteredServices.isEmpty) {
                              return _buildEmptyState();
                            }

                            return ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: filteredServices.length,
                              itemBuilder: (context, index) {
                                final svc = filteredServices[index];
                                final jobsCount = companyJobCounts[svc.id] ?? 0;
                                final logoText = svc.name.isNotEmpty
                                    ? svc.name
                                          .split(' ')
                                          .map((w) => w.isNotEmpty ? w[0] : '')
                                          .join('')
                                          .substring(0, 2)
                                          .toUpperCase()
                                    : 'S';

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: TailwindColors.slate.shade200,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(
                                          alpha: 0.01,
                                        ),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          // Logo placeholder
                                          Container(
                                            width: 52,
                                            height: 52,
                                            decoration: BoxDecoration(
                                              color:
                                                  TailwindColors.slate.shade50,
                                              border: Border.all(
                                                color: TailwindColors
                                                    .slate
                                                    .shade200,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                            child: Center(
                                              child: Text(
                                                logoText,
                                                style: const TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.teal,
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 12),

                                          // Details info
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Expanded(
                                                      child: InkWell(
                                                        onTap: () => context.push(
                                                          '/company/${svc.id}',
                                                        ),
                                                        child: Text(
                                                          svc.name,
                                                          style:
                                                              const TextStyle(
                                                                fontSize: 14,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w900,
                                                                color: Color(
                                                                  0xFF0F172A,
                                                                ),
                                                              ),
                                                        ),
                                                      ),
                                                    ),
                                                    if (svc.verificationStatus ==
                                                            VerificationStatus
                                                                .verified ||
                                                        svc
                                                            .verificationBadges
                                                            .businessVerified)
                                                      const Icon(
                                                        Icons.verified,
                                                        color: Colors.teal,
                                                        size: 14,
                                                      ),
                                                  ],
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  svc.description.length > 90
                                                      ? '${svc.description.substring(0, 90)}...'
                                                      : svc.description,
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    color: TailwindColors
                                                        .slate
                                                        .shade500,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),

                                      // Badges & Meta
                                      Wrap(
                                        spacing: 12,
                                        runSpacing: 4,
                                        children: [
                                          Text(
                                            svc.category,
                                            style: const TextStyle(
                                              color: Colors.teal,
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(
                                                Icons.location_on_outlined,
                                                size: 12,
                                                color: Colors.grey,
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                svc.district,
                                                style: TextStyle(
                                                  fontSize: 10,
                                                  color: TailwindColors
                                                      .slate
                                                      .shade500,
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (svc.rating > 0)
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(
                                                  Icons.star,
                                                  size: 12,
                                                  color: Colors.amber,
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  '${svc.rating} (${svc.reviewCount})',
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    color: TailwindColors
                                                        .slate
                                                        .shade500,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          if (jobsCount > 0)
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(
                                                  Icons.work_outline,
                                                  size: 12,
                                                  color: Colors.cyan,
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  '$jobsCount jobs',
                                                  style: const TextStyle(
                                                    fontSize: 10,
                                                    color: Colors.cyan,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ],
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),

                                      // Actions Buttons
                                      Row(
                                        children: [
                                          Expanded(
                                            child: SizedBox(
                                              height: 44,
                                              child: ElevatedButton(
                                                onPressed: () => context.push(
                                                  '/company/${svc.id}',
                                                ),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: const Color(
                                                    0xFF0F172A,
                                                  ),
                                                  foregroundColor: Colors.white,
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          10,
                                                        ),
                                                  ),
                                                  elevation: 0,
                                                ),
                                                child: const Text(
                                                  'View Profile',
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          if (svc.phone.isNotEmpty)
                                            SizedBox(
                                              width: 44,
                                              height: 44,
                                              child: IconButton(
                                                onPressed: () async {
                                                  final url = Uri.parse(
                                                    'tel:${svc.phone}',
                                                  );
                                                  if (await canLaunchUrl(url)) {
                                                    await launchUrl(url);
                                                  }
                                                },
                                                icon: const Icon(
                                                  Icons.phone,
                                                  size: 16,
                                                ),
                                                style: IconButton.styleFrom(
                                                  backgroundColor:
                                                      TailwindColors
                                                          .slate
                                                          .shade50,
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          10,
                                                        ),
                                                    side: BorderSide(
                                                      color: TailwindColors
                                                          .slate
                                                          .shade200,
                                                    ),
                                                  ),
                                                  padding: EdgeInsets.zero,
                                                ),
                                              ),
                                            ),
                                          if (svc.whatsapp != null &&
                                              svc.whatsapp!.isNotEmpty) ...[
                                            const SizedBox(width: 8),
                                            SizedBox(
                                              width: 44,
                                              height: 44,
                                              child: IconButton(
                                                onPressed: () async {
                                                  final cleanNum = svc.whatsapp!
                                                      .replaceAll(
                                                        RegExp(r'[^0-9]'),
                                                        '',
                                                      );
                                                  final url = Uri.parse(
                                                    'https://wa.me/$cleanNum',
                                                  );
                                                  if (await canLaunchUrl(url)) {
                                                    await launchUrl(
                                                      url,
                                                      mode: LaunchMode
                                                          .externalApplication,
                                                    );
                                                  }
                                                },
                                                icon: const Icon(
                                                  Icons.message,
                                                  size: 16,
                                                ),
                                                style: IconButton.styleFrom(
                                                  backgroundColor:
                                                      TailwindColors
                                                          .slate
                                                          .shade50,
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          10,
                                                        ),
                                                    side: BorderSide(
                                                      color: TailwindColors
                                                          .slate
                                                          .shade200,
                                                    ),
                                                  ),
                                                  padding: EdgeInsets.zero,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            );
                          },
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(48.0),
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          error: (err, stack) => _buildEmptyState(),
                        ),

                        // Register CTA banner
                        Container(
                          margin: const EdgeInsets.symmetric(vertical: 24),
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(
                              color: Colors.teal.withValues(alpha: 0.2),
                            ),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Column(
                            children: [
                              const Text('🚀', style: TextStyle(fontSize: 32)),
                              const SizedBox(height: 8),
                              const Text(
                                'List Your Services Free',
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Get your own Google-ready SEO page on THENIJOBS',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: () =>
                                    context.push('/company/register'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0F172A),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 14,
                                  ),
                                ),
                                child: const Text(
                                  'Register Now — It\'s Free',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const HomeFooter(),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: const FloatingWhatsApp(),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: TailwindColors.slate.shade300),
      ),
      child: Column(
        children: [
          const Icon(Icons.plumbing, size: 48, color: Colors.grey),
          const SizedBox(height: 12),
          const Text(
            'No services found',
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Try adjusting your search query or clear filters.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: TailwindColors.slate.shade500,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _searchController.clear();
                _selectedCategory = 'All';
                _selectedDistrict = 'All';
                _showVerifiedOnly = false;
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            ),
            child: const Text(
              'Clear Filters',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
