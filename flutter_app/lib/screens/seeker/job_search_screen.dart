import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class JobSearchScreen extends ConsumerStatefulWidget {
  const JobSearchScreen({super.key});

  @override
  ConsumerState<JobSearchScreen> createState() => _JobSearchScreenState();
}

class _JobSearchScreenState extends ConsumerState<JobSearchScreen> {
  final _searchController = TextEditingController();
  final List<String> _activeFilters = ['Theni', 'IT & Software'];
  String _selectedSort = 'Recent';

  final _mockJobs = [
    _MockJob('Flutter Developer', 'Theni Tech Labs', 'Theni, Tamil Nadu', '₹30K - 50K/month', 'Full Time', false, '2 hours ago'),
    _MockJob('Business Development Executive', 'ABC Industries', 'Theni, Tamil Nadu', '₹20K - 30K/month', 'Full Time', true, '2 days ago'),
    _MockJob('Tally Accountant', 'PQR Finance', 'Bodinayakanur', '₹15K - 20K/month', 'Full Time', false, '3 days ago'),
    _MockJob('Digital Marketing Intern', 'StartupXYZ', 'Cumbum', '₹10K - 15K/month', 'Part Time', true, '1 week ago'),
    _MockJob('Delivery Partner', 'Quick Logistics', 'Theni', '₹18K - 22K/month', 'Contract', false, '5 hours ago'),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar
            Container(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded, size: 16),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text('Search Jobs', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  GestureDetector(
                    onTap: _showFilterSheet,
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.primarySurface,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.tune_rounded, size: 20, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Search Input
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search by job title or keyword...',
                  prefixIcon: const Icon(Icons.search_rounded, size: 22, color: AppColors.textTertiary),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close_rounded, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {});
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: AppColors.surface,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                  ),
                ),
                style: GoogleFonts.inter(fontSize: 14),
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(height: 14),

            // Active Filter Chips
            if (_activeFilters.isNotEmpty)
              SizedBox(
                height: 38,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _activeFilters.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: AppColors.primarySurface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _activeFilters[i],
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary),
                          ),
                          const SizedBox(width: 6),
                          GestureDetector(
                            onTap: () => setState(() => _activeFilters.removeAt(i)),
                            child: Icon(Icons.close_rounded, size: 15, color: AppColors.primary.withValues(alpha: 0.7)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            const SizedBox(height: 14),

            // Results count & Sort
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Text(
                    '${_mockJobs.length} jobs found',
                    style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () {},
                    child: Row(
                      children: [
                        const Icon(Icons.sort_rounded, size: 16, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(_selectedSort, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Job List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                itemCount: _mockJobs.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) => _buildJobCard(_mockJobs[i]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildJobCard(_MockJob job) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: AppColors.primarySurface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.business_rounded, color: AppColors.primary, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(job.title, style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 3),
                    Text(job.company, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              const Icon(Icons.bookmark_border_rounded, color: AppColors.textTertiary, size: 20),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(job.location, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
              const Spacer(),
              Text(job.salary, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _chip(job.jobType, AppColors.primary, AppColors.primarySurface),
              if (job.isUrgent) ...[
                const SizedBox(width: 8),
                _chip('Urgent', AppColors.error, AppColors.errorSurface),
              ],
              const Spacer(),
              Text(job.timeAgo, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _chip(String text, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => Container(
        height: MediaQuery.of(context).size.height * 0.65,
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text('Filters', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 20),
            Text('Job Type', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: ['Full Time', 'Part Time', 'Contract', 'Internship'].map((t) {
                return FilterChip(
                  label: Text(t, style: GoogleFonts.inter(fontSize: 12)),
                  selected: false,
                  onSelected: (_) {},
                  backgroundColor: AppColors.surfaceVariant,
                  selectedColor: AppColors.primarySurface,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            Text('Salary Range', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: ['₹10K-20K', '₹20K-40K', '₹40K-60K', '₹60K+'].map((t) {
                return FilterChip(
                  label: Text(t, style: GoogleFonts.inter(fontSize: 12)),
                  selected: false,
                  onSelected: (_) {},
                  backgroundColor: AppColors.surfaceVariant,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                );
              }).toList(),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('Apply Filters', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MockJob {
  final String title, company, location, salary, jobType, timeAgo;
  final bool isUrgent;
  _MockJob(this.title, this.company, this.location, this.salary, this.jobType, this.isUrgent, this.timeAgo);
}
