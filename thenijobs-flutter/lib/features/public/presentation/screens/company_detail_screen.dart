// ============================================================
// THENIJOBS — Company Detail Screen
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/shared/data/models/user_model.dart';
import 'package:thenijobs/shared/data/models/company_model.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';
import 'package:thenijobs/shared/data/models/review_model.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';
import 'package:thenijobs/features/public/presentation/widgets/home_footer.dart';
import 'package:thenijobs/shared/widgets/floating_whatsapp.dart';

class CompanyDetailScreen extends ConsumerStatefulWidget {
  final String companyId;
  const CompanyDetailScreen({super.key, required this.companyId});

  @override
  ConsumerState<CompanyDetailScreen> createState() =>
      _CompanyDetailScreenState();
}

class _CompanyDetailScreenState extends ConsumerState<CompanyDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _enquirySent = false;
  bool _submittingEnquiry = false;
  bool _submittingReview = false;

  final _enquiryNameController = TextEditingController();
  final _enquiryPhoneController = TextEditingController();
  final _enquiryMsgController = TextEditingController();

  final _reviewTitleController = TextEditingController();
  final _reviewContentController = TextEditingController();
  double _reviewRating = 5.0;
  final String _reviewType = 'company';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _enquiryNameController.dispose();
    _enquiryPhoneController.dispose();
    _enquiryMsgController.dispose();
    _reviewTitleController.dispose();
    _reviewContentController.dispose();
    super.dispose();
  }

  Future<void> _submitEnquiry(Company company, String? userId) async {
    final name = _enquiryNameController.text.trim();
    final phone = _enquiryPhoneController.text.trim();
    final msg = _enquiryMsgController.text.trim();

    if (name.isEmpty || phone.isEmpty || msg.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill out all enquiry fields')),
      );
      return;
    }

    setState(() => _submittingEnquiry = true);

    try {
      final service = ref.read(firestoreServiceProvider);
      await service.createCompanyEnquiry(
        CompanyEnquiryData(
          companyId: company.id,
          companyName: company.name,
          ownerId: company.ownerId,
          name: name,
          phone: phone,
          message: msg,
          userId: userId,
          category: company.category,
          district: company.district,
        ),
      );

      if (mounted) {
        setState(() {
          _submittingEnquiry = false;
          _enquirySent = true;
        });
        _enquiryNameController.clear();
        _enquiryPhoneController.clear();
        _enquiryMsgController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Inquiry sent successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submittingEnquiry = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit inquiry: $e')));
      }
    }
  }

  Future<void> _submitReview(
    Company company,
    String? userId,
    String? userName,
  ) async {
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to leave a review')),
      );
      return;
    }

    final title = _reviewTitleController.text.trim();
    final content = _reviewContentController.text.trim();

    if (content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please write some review content')),
      );
      return;
    }

    setState(() => _submittingReview = true);

    try {
      final service = ref.read(firestoreServiceProvider);
      await service.createCompanyReview(
        CompanyReviewData(
          companyId: company.id,
          companyName: company.name,
          reviewerId: userId,
          reviewerName: userName ?? 'Anonymous',
          rating: _reviewRating,
          title: title.isNotEmpty ? title : 'Customer Review',
          content: content,
          reviewType: _reviewType,
        ),
      );

      if (mounted) {
        setState(() => _submittingReview = false);
        _reviewTitleController.clear();
        _reviewContentController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Review submitted! It will appear once verified by admin.',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submittingReview = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit review: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final companyAsync = ref.watch(companyDetailProvider(widget.companyId));
    final jobsAsync = ref.watch(companyJobsProvider(widget.companyId));
    final reviewsAsync = ref.watch(companyReviewsProvider(widget.companyId));
    final authState = ref.watch(authStateStreamProvider);

    final user = authState.value;

    return Scaffold(
      backgroundColor: AppTheme.lightBg,
      appBar: AppBar(
        title: const Text('Company Profile'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 1,
      ),
      body: SafeArea(
        child: companyAsync.when(
          data: (company) {
            if (company == null) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Company Not Found',
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text('This company profile is not available yet.'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => context.pop(),
                        child: const Text('Browse Companies'),
                      ),
                    ],
                  ),
                ),
              );
            }

            final activeJobs = jobsAsync.value ?? [];
            final reviewsList = reviewsAsync.value ?? [];

            final logoText = company.name.isNotEmpty
                ? company.name
                      .split(' ')
                      .map((w) => w.isNotEmpty ? w[0] : '')
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                : 'B';

            return SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Cover Banner area
                  Container(
                    height: 140,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF1E0A5E), Color(0xFF0A2A4E)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Stack(
                      children: [
                        if (company.isPremium)
                          Positioned(
                            top: 12,
                            right: 12,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.amber,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'PREMIUM',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Profile Info Bar
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Transform.translate(
                          offset: const Offset(0, -48),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  border: Border.all(
                                    color: AppTheme.primaryPurple.withValues(
                                      alpha: 0.2,
                                    ),
                                    width: 2,
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.08,
                                      ),
                                      blurRadius: 16,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: Text(
                                    logoText,
                                    style: const TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.primaryPurple,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            company.name,
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontFamily: 'Outfit',
                                              fontSize: 18,
                                              fontWeight: FontWeight.w900,
                                              color: Color(0xFF0F172A),
                                            ),
                                          ),
                                        ),
                                        if (company.verificationStatus ==
                                                VerificationStatus.verified ||
                                            company
                                                .verificationBadges
                                                .businessVerified)
                                          const Icon(
                                            Icons.verified,
                                            color: Colors.teal,
                                            size: 16,
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 4,
                                      children: [
                                        Text(
                                          company.category,
                                          style: const TextStyle(
                                            color: AppTheme.primaryPurple,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Text(
                                          '• ${company.district}, ${company.state}',
                                          style: const TextStyle(
                                            color: Colors.grey,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Transform.translate(
                          offset: const Offset(0, -32),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Quick stats overview
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildMiniStat(
                                    'Views',
                                    '${company.viewCount}',
                                  ),
                                  _buildMiniStat(
                                    'Enquiries',
                                    '${company.enquiryCount}',
                                  ),
                                  _buildMiniStat(
                                    'Open Jobs',
                                    '${activeJobs.length}',
                                  ),
                                  _buildMiniStat(
                                    'Rating',
                                    '${company.rating} ★',
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Quick Action launcher row
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () async {
                                        final url = Uri.parse(
                                          'tel:${company.phone}',
                                        );
                                        if (await canLaunchUrl(url)) {
                                          await launchUrl(url);
                                        }
                                      },
                                      icon: const Icon(Icons.phone, size: 14),
                                      label: const Text(
                                        'Call Now',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(
                                          0xFF0F172A,
                                        ),
                                        foregroundColor: Colors.white,
                                        minimumSize: const Size.fromHeight(44),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  if (company.whatsapp != null &&
                                      company.whatsapp!.isNotEmpty)
                                    Expanded(
                                      child: ElevatedButton.icon(
                                        onPressed: () async {
                                          final cleanNum = company.whatsapp!
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
                                          size: 14,
                                        ),
                                        label: const Text(
                                          'WhatsApp',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(
                                            0xFF25D366,
                                          ),
                                          foregroundColor: Colors.white,
                                          minimumSize: const Size.fromHeight(
                                            44,
                                          ),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              10,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Tabs Header
                  Container(
                    color: Colors.white,
                    child: TabBar(
                      controller: _tabController,
                      labelColor: AppTheme.primaryPurple,
                      unselectedLabelColor: Colors.grey,
                      indicatorColor: AppTheme.primaryPurple,
                      tabs: [
                        const Tab(text: 'About'),
                        Tab(text: 'Jobs (${activeJobs.length})'),
                        const Tab(text: 'Gallery'),
                        Tab(text: 'Reviews (${reviewsList.length})'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Tab Content Area
                  Container(
                    constraints: const BoxConstraints(minHeight: 250),
                    child: [
                      // About Tab
                      _buildAboutTab(company),
                      // Jobs Tab
                      _buildJobsTab(activeJobs),
                      // Gallery Tab
                      _buildGalleryTab(),
                      // Reviews Tab
                      _buildReviewsTab(company, reviewsList, user),
                    ][_tabController.index],
                  ),
                  const SizedBox(height: 12),

                  // Contact Card Section
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Contact Information',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildContactRow(Icons.phone, 'Phone', company.phone),
                        _buildContactRow(
                          Icons.mail_outline,
                          'Email',
                          company.email,
                        ),
                        if (company.website != null &&
                            company.website!.isNotEmpty)
                          _buildContactRow(
                            Icons.language,
                            'Website',
                            company.website!,
                          ),
                        _buildContactRow(
                          Icons.location_on_outlined,
                          'Address',
                          company.address,
                        ),
                        const SizedBox(height: 12),
                        if (company.latitude != null &&
                            company.longitude != null)
                          OutlinedButton.icon(
                            onPressed: () async {
                              final url = Uri.parse(
                                'https://maps.google.com/?q=${company.latitude},${company.longitude}',
                              );
                              if (await canLaunchUrl(url)) {
                                await launchUrl(
                                  url,
                                  mode: LaunchMode.externalApplication,
                                );
                              }
                            },
                            icon: const Icon(Icons.navigation, size: 14),
                            label: const Text(
                              'Open in Google Maps',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.black87,
                              side: BorderSide(
                                color: TailwindColors.slate.shade300,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Verification Check Section
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Verification Checklist',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildVerificationItem(
                          'Mobile Verified',
                          company.verificationBadges.mobileVerified,
                          Icons.phone_android,
                        ),
                        _buildVerificationItem(
                          'Email Verified',
                          company.verificationBadges.emailVerified,
                          Icons.mail,
                        ),
                        _buildVerificationItem(
                          'GST Registered',
                          company.verificationBadges.gstVerified,
                          Icons.file_present,
                        ),
                        _buildVerificationItem(
                          'Business Approved',
                          company.verificationStatus ==
                              VerificationStatus.verified,
                          Icons.verified_user,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Send Enquiry Inquiry Form
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Request Quote / Enquiry',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Requirement details will be sent directly to employer dashboard.',
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _enquiryNameController,
                          style: const TextStyle(fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Your Name',
                            filled: true,
                            fillColor: TailwindColors.slate.shade50,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _enquiryPhoneController,
                          keyboardType: TextInputType.phone,
                          style: const TextStyle(fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Your Phone Number',
                            filled: true,
                            fillColor: TailwindColors.slate.shade50,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _enquiryMsgController,
                          maxLines: 3,
                          style: const TextStyle(fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Describe your requirement...',
                            filled: true,
                            fillColor: TailwindColors.slate.shade50,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _submittingEnquiry
                              ? null
                              : () => _submitEnquiry(company, user?.uid),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: const Center(
                            child: Text(
                              'Send Enquiry',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        if (_enquirySent) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.teal.shade50,
                              border: Border.all(color: Colors.teal.shade200),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text(
                              'Enquiry sent successfully! The company will contact you shortly.',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.teal,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                  const HomeFooter(),
                ],
              ),
            );
          },
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(48.0),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (err, stack) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Text('Error loading company: $err'),
            ),
          ),
        ),
      ),
      floatingActionButton: const FloatingWhatsApp(),
    );
  }

  Widget _buildMiniStat(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: TailwindColors.slate.shade50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: TailwindColors.slate.shade100),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 9, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppTheme.primaryPurple),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
              fontWeight: FontWeight.bold,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationItem(String label, bool isVerified, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: isVerified ? Colors.teal : Colors.grey),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isVerified ? Colors.black87 : Colors.grey,
            ),
          ),
          const Spacer(),
          Icon(
            isVerified ? Icons.check_circle : Icons.radio_button_unchecked,
            color: isVerified ? Colors.teal : Colors.grey.shade400,
            size: 16,
          ),
        ],
      ),
    );
  }

  // TAB BUILDERS
  Widget _buildAboutTab(Company company) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'About Us',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 8),
          Text(
            company.description,
            style: TextStyle(
              fontSize: 13,
              color: TailwindColors.slate.shade700,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Services Offered',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: company.services.map((serv) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: TailwindColors.slate.shade50,
                  border: Border.all(color: TailwindColors.slate.shade200),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(serv, style: const TextStyle(fontSize: 11)),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildJobsTab(List<Job> activeJobs) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Active Job Openings',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          if (activeJobs.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 24.0),
                child: Text(
                  'No active jobs listed currently.',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ),
            ),
          ...activeJobs.map((job) {
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: TailwindColors.slate.shade50,
                border: Border.all(color: TailwindColors.slate.shade200),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          job.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${job.location} • ${job.experience}',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => context.push('/jobs/${job.id}'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Apply', style: TextStyle(fontSize: 11)),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildGalleryTab() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Photos & Media',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemCount: 6,
            itemBuilder: (context, idx) {
              final emojis = ['🏢', '🚜', '👷', '🌿', '🌾', '🤝'];
              return Container(
                decoration: BoxDecoration(
                  color: TailwindColors.slate.shade50,
                  border: Border.all(color: TailwindColors.slate.shade200),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    emojis[idx],
                    style: const TextStyle(fontSize: 28),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildReviewsTab(
    Company company,
    List<Review> reviews,
    UserModel? user,
  ) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Write a verified review',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 10),

          // Star rating selector
          Row(
            children: [
              const Text(
                'Your Rating: ',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 8),
              Row(
                children: List.generate(5, (index) {
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _reviewRating = index + 1.0;
                      });
                    },
                    child: Icon(
                      index < _reviewRating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 24,
                    ),
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _reviewTitleController,
            style: const TextStyle(fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Review Title (Optional)',
              filled: true,
              fillColor: TailwindColors.slate.shade50,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _reviewContentController,
            maxLines: 3,
            style: const TextStyle(fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Share details of your experience...',
              filled: true,
              fillColor: TailwindColors.slate.shade50,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: _submittingReview
                ? null
                : () => _submitReview(company, user?.uid, user?.displayName),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text(
              'Submit Review',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),

          const SizedBox(height: 20),
          Text(
            'Customer Reviews (${reviews.length})',
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          if (reviews.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 24.0),
                child: Text(
                  'No verified reviews yet.',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ),
            ),
          ...reviews.map((rev) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: TailwindColors.slate.shade50,
                border: Border.all(color: TailwindColors.slate.shade200),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        rev.reviewerName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        DateFormat('dd MMM yyyy').format(rev.createdAt),
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: List.generate(5, (index) {
                      return Icon(
                        index < rev.rating ? Icons.star : Icons.star_border,
                        color: Colors.amber,
                        size: 12,
                      );
                    }),
                  ),
                  const SizedBox(height: 6),
                  if (rev.title.isNotEmpty)
                    Text(
                      rev.title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  const SizedBox(height: 2),
                  Text(
                    rev.content,
                    style: TextStyle(
                      fontSize: 12,
                      color: TailwindColors.slate.shade800,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
