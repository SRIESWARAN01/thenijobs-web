// ============================================================
// THENIJOBS — Screens Stub/Placeholders for Router Setup
// ============================================================

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thenijobs/core/routes/portal_concrete_screens.dart';
import 'package:thenijobs/core/services/platform_actions_service.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/core/utils/slug.dart';

const Object _currentUid = Object();
const Object _currentCompanyId = Object();
const String _functionsRegion = 'asia-south1';

Widget _buildStubScreen(String title) {
  if (title == 'Admin Login') {
    return const _AdminLoginBridgeScreen();
  }
  return _PortalFeatureScreen(config: _featureConfigFor(title));
}

class _WhereSpec {
  const _WhereSpec(this.field, this.value, {this.op = '=='});

  final String field;
  final Object? value;
  final String op;
}

class _MetricConfig {
  const _MetricConfig({
    required this.label,
    required this.collection,
    required this.icon,
    required this.color,
    this.filters = const [],
  });

  final String label;
  final String collection;
  final IconData icon;
  final Color color;
  final List<_WhereSpec> filters;
}

class _QuickAction {
  const _QuickAction({
    required this.label,
    required this.path,
    required this.icon,
    required this.color,
  });

  final String label;
  final String path;
  final IconData icon;
  final Color color;
}

class _DocAction {
  const _DocAction({
    required this.label,
    required this.icon,
    required this.color,
    required this.data,
  });

  final String label;
  final IconData icon;
  final Color color;
  final Map<String, Object?> data;
}

class _ListSectionConfig {
  const _ListSectionConfig({
    required this.title,
    required this.collection,
    this.filters = const [],
    this.orderBy,
    this.primaryFields = const ['title', 'name', 'displayName'],
    this.subtitleFields = const [
      'companyName',
      'email',
      'message',
      'description',
    ],
    this.metaFields = const ['status', 'role', 'district', 'createdAt'],
    this.actions = const [],
  }) : descending = true,
       limit = 20;

  final String title;
  final String collection;
  final List<_WhereSpec> filters;
  final String? orderBy;
  final bool descending;
  final int limit;
  final List<String> primaryFields;
  final List<String> subtitleFields;
  final List<String> metaFields;
  final List<_DocAction> actions;
}

class _FeatureConfig {
  const _FeatureConfig({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    this.needsCompany = false,
    this.metrics = const [],
    this.actions = const [],
    this.sections = const [],
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final bool needsCompany;
  final List<_MetricConfig> metrics;
  final List<_QuickAction> actions;
  final List<_ListSectionConfig> sections;
}

class _AdminLoginBridgeScreen extends StatelessWidget {
  const _AdminLoginBridgeScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBg,
      body: Center(
        child: Container(
          width: 420,
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          decoration: AppTheme.glassCard(borderRadius: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.admin_panel_settings_outlined,
                color: AppTheme.brandRose,
                size: 54,
              ),
              const SizedBox(height: 18),
              const Text(
                'Admin Login',
                style: TextStyle(
                  color: AppTheme.lightTextPrimary,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Outfit',
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Use your admin email and password on the common sign-in screen. Admin accounts are routed back here automatically.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppTheme.lightTextSecondary,
                  height: 1.5,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () => context.go('/login'),
                  icon: const Icon(Icons.login_rounded),
                  label: const Text('Continue to Sign In'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.brandRose,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
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

class CompanyRegisterScreen extends StatefulWidget {
  const CompanyRegisterScreen({super.key});

  @override
  State<CompanyRegisterScreen> createState() => _CompanyRegisterScreenState();
}

class _CompanyRegisterScreenState extends State<CompanyRegisterScreen> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _websiteController = TextEditingController();
  final _servicesController = TextEditingController();

  String _category = 'Agriculture';
  String _district = 'Theni';
  bool _checkingExisting = true;
  bool _submitting = false;
  String? _existingCompanyId;

  static const _categories = [
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
    'Services',
  ];

  static const _districts = [
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
    _loadExistingCompany();
    _emailController.text = fb.FirebaseAuth.instance.currentUser?.email ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _websiteController.dispose();
    _servicesController.dispose();
    super.dispose();
  }

  Future<void> _loadExistingCompany() async {
    final uid = fb.FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) {
      setState(() => _checkingExisting = false);
      return;
    }
    final snap = await FirebaseFirestore.instance
        .collection('companies')
        .where('ownerId', isEqualTo: uid)
        .limit(1)
        .get();
    if (!mounted) return;
    setState(() {
      _existingCompanyId = snap.docs.isEmpty ? null : snap.docs.first.id;
      _checkingExisting = false;
    });
  }

  Future<void> _submitCompany() async {
    final user = fb.FirebaseAuth.instance.currentUser;
    if (user == null) {
      context.go('/login');
      return;
    }

    final name = _nameController.text.trim();
    final description = _descriptionController.text.trim();
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();
    final address = _addressController.text.trim();

    if (name.isEmpty ||
        description.isEmpty ||
        phone.isEmpty ||
        email.isEmpty ||
        address.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete all required company fields'),
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    final doc = FirebaseFirestore.instance.collection('companies').doc();
    final baseSlug = slugify(name).isEmpty ? 'company' : slugify(name);
    final services = _servicesController.text
        .split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();

    try {
      await doc.set({
        'slug': '$baseSlug-${doc.id.substring(0, 6)}',
        'ownerId': user.uid,
        'name': name,
        'category': _category,
        'description': description,
        'phone': phone,
        'email': email,
        'website': _websiteController.text.trim().isEmpty
            ? null
            : _websiteController.text.trim(),
        'whatsapp': phone,
        'address': address,
        'district': _district,
        'state': 'Tamil Nadu',
        'country': 'India',
        'galleryImages': <String>[],
        'galleryVideos': <String>[],
        'services': services,
        'status': 'pending',
        'verificationBadges': {
          'mobileVerified': false,
          'emailVerified': user.emailVerified,
          'gstVerified': false,
          'businessVerified': false,
        },
        'isActive': false,
        'viewCount': 0,
        'enquiryCount': 0,
        'rating': 0,
        'reviewCount': 0,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      try {
        await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
          'companyId': doc.id,
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      } catch (_) {
        // Company creation is the source of truth; rules may limit user profile fields.
      }

      if (!mounted) return;
      setState(() {
        _submitting = false;
        _existingCompanyId = doc.id;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Company submitted for admin approval')),
      );
      context.go('/employer/company-profile');
    } catch (err) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Company registration failed: $err')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = fb.FirebaseAuth.instance.currentUser;
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Register Company'),
        actions: [
          IconButton(
            tooltip: 'Home',
            onPressed: () => context.go('/'),
            icon: const Icon(Icons.home_outlined),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const _HeaderCard(
                    config: _FeatureConfig(
                      title: 'Company Registration',
                      subtitle:
                          'Submit your business profile for admin approval, public listing, jobs, leads and reviews.',
                      icon: Icons.business_outlined,
                      color: AppTheme.brandCyan,
                    ),
                  ),
                  const SizedBox(height: 18),
                  if (user == null)
                    _SimpleActionCard(
                      title: 'Sign in required',
                      body:
                          'Create or sign in to an employer or business-owner account before registering a company.',
                      icon: Icons.login_rounded,
                      actionLabel: 'Sign In',
                      onPressed: () => context.go('/login'),
                    )
                  else if (_checkingExisting)
                    const Padding(
                      padding: EdgeInsets.all(32),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (_existingCompanyId != null)
                    _SimpleActionCard(
                      title: 'Company profile already exists',
                      body:
                          'Manage approval status, contact details, jobs, leads and reviews from the employer portal.',
                      icon: Icons.verified_outlined,
                      actionLabel: 'Open Company Profile',
                      onPressed: () => context.go('/employer/company-profile'),
                    )
                  else
                    _buildForm(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppTheme.glassCard(borderRadius: 22),
      child: Column(
        children: [
          _PortalTextField(
            controller: _nameController,
            label: 'Business name *',
            icon: Icons.storefront_outlined,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PortalDropdown(
                  label: 'Category',
                  icon: Icons.category_outlined,
                  value: _category,
                  values: _categories,
                  onChanged: (value) => setState(() => _category = value),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _PortalDropdown(
                  label: 'District',
                  icon: Icons.place_outlined,
                  value: _district,
                  values: _districts,
                  onChanged: (value) => setState(() => _district = value),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _PortalTextField(
            controller: _descriptionController,
            label: 'Description *',
            icon: Icons.notes_outlined,
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PortalTextField(
                  controller: _phoneController,
                  label: 'Phone / WhatsApp *',
                  icon: Icons.phone_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _PortalTextField(
                  controller: _emailController,
                  label: 'Email *',
                  icon: Icons.mail_outline,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _PortalTextField(
            controller: _addressController,
            label: 'Address *',
            icon: Icons.location_city_outlined,
            maxLines: 2,
          ),
          const SizedBox(height: 12),
          _PortalTextField(
            controller: _websiteController,
            label: 'Website',
            icon: Icons.language_outlined,
          ),
          const SizedBox(height: 12),
          _PortalTextField(
            controller: _servicesController,
            label: 'Services offered (comma separated)',
            icon: Icons.handyman_outlined,
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _submitting ? null : _submitCompany,
              icon: _submitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send_outlined),
              label: Text(
                _submitting ? 'Submitting...' : 'Submit for Approval',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PublicProfileScreen extends StatelessWidget {
  const PublicProfileScreen({super.key, this.identifier});

  final String? identifier;

  @override
  Widget build(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!context.mounted) return;
      context.go(identifier == null ? '/seeker/profile' : '/id/$identifier');
    });
    return const Scaffold(
      backgroundColor: AppTheme.darkBg,
      body: Center(child: CircularProgressIndicator()),
    );
  }
}

class PublicThenijobsIdScreen extends StatelessWidget {
  const PublicThenijobsIdScreen({super.key, required this.identifier});

  final String identifier;

  @override
  Widget build(BuildContext context) {
    return _PublicIdentityScreen(identifier: identifier, title: 'THENIJOBS ID');
  }
}

class _PublicIdentityData {
  const _PublicIdentityData({this.uid, this.user, this.profile, this.company});

  final String? uid;
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? profile;
  final Map<String, dynamic>? company;

  bool get isEmpty => user == null && profile == null && company == null;
}

class _PublicIdentityScreen extends StatelessWidget {
  const _PublicIdentityScreen({required this.identifier, required this.title});

  final String identifier;
  final String title;

  Future<_PublicIdentityData> _loadIdentity() async {
    final firestore = FirebaseFirestore.instance;
    var uid = identifier;
    Map<String, dynamic>? user;
    Map<String, dynamic>? profile;
    Map<String, dynamic>? company;

    try {
      // 1. Check publicProfiles by document ID first
      var publicProfileDoc = await firestore
          .collection('publicProfiles')
          .doc(identifier)
          .get();
      Map<String, dynamic>? publicData;
      if (publicProfileDoc.exists) {
        publicData = publicProfileDoc.data();
      } else {
        // 2. Query publicProfiles by theniJobsId
        final publicProfilesQuery = await firestore
            .collection('publicProfiles')
            .where('theniJobsId', isEqualTo: identifier)
            .limit(1)
            .get();
        if (publicProfilesQuery.docs.isNotEmpty) {
          publicData = publicProfilesQuery.docs.first.data();
        }
      }

      if (publicData != null) {
        final resolvedUid = publicData['ownerId'] as String? ?? publicData['uid'] as String? ?? identifier;
        final type = publicData['type'] as String?;
        final isSeeker = type == 'job_seeker';

        user = {
          'displayName': publicData['name'] ?? publicData['displayName'],
          'email': publicData['email'],
          'phone': publicData['phone'],
          'role': type ?? (isSeeker ? 'job_seeker' : 'employer'),
          'isVerified': publicData['isVerified'] ?? false,
        };

        if (isSeeker) {
          profile = {
            'name': publicData['name'] ?? publicData['displayName'],
            'displayName': publicData['displayName'] ?? publicData['name'],
            'headline': publicData['headline'],
            'currentRole':
                publicData['currentRole'] ?? publicData['headline'],
            'qualification': publicData['qualification'],
            'photoUrl':
                publicData['photoUrl'] ?? publicData['profilePhotoUrl'],
            'profilePhotoUrl':
                publicData['profilePhotoUrl'] ?? publicData['photoUrl'],
            'email': publicData['email'],
            'phone': publicData['phone'],
            'skills': publicData['skills'],
            'district': publicData['district'],
            'portfolioLinks':
                publicData['portfolioLinks'] ?? publicData['portfolio'],
            'portfolio': publicData['portfolio'] ?? publicData['portfolioLinks'],
            'resumeUrl': publicData['resumeUrl'],
            'resumes': publicData['resumes'],
            'education': publicData['education'],
            'experience': publicData['experience'],
            'certifications': publicData['certifications'],
            'projects': publicData['projects'],
            'profileStrength': publicData['profileStrength'],
            'summary':
                publicData['aiSummary'] ??
                publicData['summary'] ??
                publicData['qualification'],
          };
        } else {
          company = {
            'id': publicData['id'] ?? publicData['companyId'] ?? identifier,
            'name': publicData['name'] ?? publicData['displayName'] ?? publicData['companyName'],
            'category': publicData['category'],
            'district': publicData['district'],
            'description': publicData['description'] ?? publicData['summary'],
            'logoUrl': publicData['logoUrl'],
            'phone': publicData['phone'],
            'email': publicData['email'],
            'website': publicData['website'],
            'whatsapp': publicData['whatsapp'] ?? publicData['phone'],
            'services': publicData['services'],
            'verificationStatus': publicData['verificationStatus'] ?? (publicData['isVerified'] == true ? 'verified' : 'pending'),
            'isPremium': publicData['isPremium'],
            'isVerified': publicData['isVerified'],
            'rating': publicData['rating'],
            'reviewCount': publicData['reviewCount'],
          };
        }

        return _PublicIdentityData(
          uid: resolvedUid,
          user: user,
          profile: profile,
          company: company,
        );
      }
    } catch (e) {
      debugPrint('Error loading publicProfile: $e');
    }

    var companyDoc = await firestore
        .collection('companies')
        .doc(identifier)
        .get();
    if (companyDoc.exists) {
      company = companyDoc.data();
      uid = company?['ownerId'] as String? ?? uid;
    } else {
      final slugCompany = await firestore
          .collection('companies')
          .where('slug', isEqualTo: identifier)
          .limit(1)
          .get();
      if (slugCompany.docs.isNotEmpty) {
        company = slugCompany.docs.first.data();
        uid = company['ownerId'] as String? ?? uid;
      } else {
        final idCompany = await firestore
            .collection('companies')
            .where('theniJobsId', isEqualTo: identifier)
            .limit(1)
            .get();
        if (idCompany.docs.isNotEmpty) {
          company = idCompany.docs.first.data();
          uid = company['ownerId'] as String? ?? uid;
        }
      }
    }

    try {
      final userDoc = await firestore.collection('users').doc(identifier).get();
      if (userDoc.exists) {
        user = userDoc.data();
        uid = userDoc.id;
      } else {
        final publicUser = await firestore
            .collection('users')
            .where('theniJobsId', isEqualTo: identifier)
            .limit(1)
            .get();
        if (publicUser.docs.isNotEmpty) {
          user = publicUser.docs.first.data();
          uid = publicUser.docs.first.id;
        }
      }
    } catch (_) {
      // User records are private by rules unless the owner/admin is reading.
    }

    if (company == null && user != null) {
      final ownedCompany = await firestore
          .collection('companies')
          .where('ownerId', isEqualTo: uid)
          .limit(1)
          .get();
      if (ownedCompany.docs.isNotEmpty) {
        company = ownedCompany.docs.first.data();
      }
    }

    try {
      final profileDoc = await firestore
          .collection('seekerProfiles')
          .doc(uid)
          .get();
      if (profileDoc.exists) {
        profile = profileDoc.data();
      }
    } catch (_) {
      // Seeker profiles are visible to owner, employers and admins.
    }

    if (user == null && uid != identifier) {
      try {
        final ownerDoc = await firestore.collection('users').doc(uid).get();
        if (ownerDoc.exists) user = ownerDoc.data();
      } catch (_) {}
    }

    return _PublicIdentityData(
      uid: uid,
      user: user,
      profile: profile,
      company: company,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            tooltip: 'Home',
            onPressed: () => context.go('/'),
            icon: const Icon(Icons.home_outlined),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
        child: SafeArea(
          child: FutureBuilder<_PublicIdentityData>(
            future: _loadIdentity(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Center(
                  child: Text(
                    'Could not load profile: ${snapshot.error}',
                    style: const TextStyle(color: AppTheme.brandRose),
                  ),
                );
              }
              final data = snapshot.data;
              if (data == null || data.isEmpty) {
                return _PublicEmptyState(
                  title: 'Profile not available',
                  body: 'This public ID does not have a visible profile yet.',
                  actionLabel: 'Explore Jobs',
                  onPressed: () => context.go('/jobs'),
                  standalone: false,
                );
              }
              return Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 760),
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _PublicIdentityCard(data: data, identifier: identifier),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _PublicIdentityCard extends StatelessWidget {
  const _PublicIdentityCard({required this.data, required this.identifier});

  final _PublicIdentityData data;
  final String identifier;

  @override
  Widget build(BuildContext context) {
    final user = data.user ?? const <String, dynamic>{};
    final profile = data.profile ?? const <String, dynamic>{};
    final company = data.company ?? const <String, dynamic>{};
    final name = _firstValue(
      profile,
      const ['name'],
      fallback: _firstValue(
        user,
        const ['displayName', 'email'],
        fallback: _firstValue(company, const [
          'name',
        ], fallback: 'THENIJOBS Member'),
      ),
    );
    final role = _formatValue(user['role']).replaceAll('_', ' ');
    final designation = _firstValue(
      profile,
      const ['currentRole', 'headline', 'qualification'],
      fallback: _firstValue(
        company,
        const ['category'],
        fallback: role.isEmpty ? 'Professional Member' : role,
      ),
    );
    final photoUrl = _firstValue(
      profile,
      const ['profilePhotoUrl', 'photoUrl'],
      fallback: _firstValue(
        user,
        const ['photoURL'],
        fallback: _formatValue(company['logoUrl']),
      ),
    );
    final skills = _formatValue(
      profile['skills'] ?? company['services'],
    );
    final district = _firstValue(profile, const [
      'district',
    ], fallback: _formatValue(company['district']));
    final email = _firstValue(
      profile,
      const ['email'],
      fallback: _firstValue(
        user,
        const ['email'],
        fallback: _formatValue(company['email']),
      ),
    );
    final phone = _firstValue(
      profile,
      const ['phone'],
      fallback: _firstValue(
        user,
        const ['phone'],
        fallback: _formatValue(company['phone']),
      ),
    );
    final resumeUrl = _resumeUrl(profile);
    final portfolioUrl = _portfolioUrl(profile, identifier);
    final qrUrl = Uri.https('api.qrserver.com', '/v1/create-qr-code/', {
      'size': '240x240',
      'data': portfolioUrl,
    }).toString();
    final verified =
        user['isVerified'] == true ||
        company['isVerified'] == true ||
        company['verificationStatus'] == 'verified';
    final premium = profile['isPremium'] == true || company['isPremium'] == true;
    final score = _formatValue(profile['profileStrength']);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppTheme.glassCard(
        borderRadius: 28,
        borderColor: AppTheme.brandCyan.withValues(alpha: 0.28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _StatusChip(label: verified ? 'Verified' : 'Public ID'),
                if (premium) const _StatusChip(label: 'Premium'),
                if (score.isNotEmpty) _TinyChip(label: 'Score $score%'),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 78,
                height: 78,
                decoration: BoxDecoration(
                  color: AppTheme.brandCyan.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: AppTheme.brandEmerald.withValues(alpha: 0.28),
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: photoUrl.isEmpty
                    ? const Icon(
                        Icons.badge_outlined,
                        color: AppTheme.brandCyan,
                        size: 38,
                      )
                    : Image.network(photoUrl, fit: BoxFit.cover),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 23,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      designation,
                      style: const TextStyle(
                        color: AppTheme.brandCyan,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        _TinyChip(label: 'ID: $identifier'),
                        if (district.isNotEmpty) _TinyChip(label: district),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: AppTheme.statCard(borderRadius: 22),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 126,
                  height: 126,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Image.network(qrUrl, fit: BoxFit.contain),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'QR Portfolio',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        portfolioUrl,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.darkTextSecondary,
                          fontSize: 12,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          FilledButton.tonalIcon(
                            onPressed: () => _openUrl(context, portfolioUrl),
                            icon: const Icon(Icons.open_in_new, size: 16),
                            label: const Text('Open'),
                          ),
                          OutlinedButton.icon(
                            onPressed: () =>
                                _copyToClipboard(context, portfolioUrl),
                            icon: const Icon(Icons.copy, size: 16),
                            label: const Text('Copy'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          if (_formatValue(profile['summary']).isNotEmpty ||
              _formatValue(company['description']).isNotEmpty)
            Text(
              _formatValue(profile['summary']).isNotEmpty
                  ? _formatValue(profile['summary'])
                  : _formatValue(company['description']),
              style: const TextStyle(
                color: AppTheme.darkTextSecondary,
                height: 1.5,
              ),
            ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              if (phone.isNotEmpty)
                _ContactChip(
                  icon: Icons.phone_outlined,
                  label: phone,
                  onTap: () => _openUrl(context, 'tel:$phone'),
                ),
              if (email.isNotEmpty)
                _ContactChip(
                  icon: Icons.mail_outline,
                  label: email,
                  onTap: () => _openUrl(context, 'mailto:$email'),
                ),
              _ContactChip(
                icon: Icons.badge_outlined,
                label: 'Digital ID Card',
                onTap: () => _copyToClipboard(context, portfolioUrl),
              ),
            ],
          ),
          if (skills.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'Skills & Strengths',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: skills
                  .split(',')
                  .where((skill) => skill.trim().isNotEmpty)
                  .map((skill) => _StatusChip(label: skill.trim()))
                  .toList(),
            ),
          ],
          if (company.isNotEmpty) ...[
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: AppTheme.statCard(borderRadius: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _firstValue(company, const ['name'], fallback: 'Company'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _firstValue(company, const [
                      'category',
                      'email',
                      'phone',
                    ], fallback: 'Business profile'),
                    style: const TextStyle(color: AppTheme.darkTextSecondary),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      _TinyChip(
                        label: _fieldLabel(
                          'status',
                          company['verificationStatus'],
                        ).replaceFirst('status: ', ''),
                      ),
                      if (_formatValue(company['rating']).isNotEmpty)
                        _TinyChip(
                          label: 'rating: ${_formatValue(company['rating'])}',
                        ),
                      if (_formatValue(company['reviewCount']).isNotEmpty)
                        _TinyChip(
                          label:
                              'reviews: ${_formatValue(company['reviewCount'])}',
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              if (resumeUrl.isNotEmpty)
                FilledButton.icon(
                  onPressed: () => _openUrl(context, resumeUrl),
                  icon: const Icon(Icons.description_outlined),
                  label: const Text('Resume PDF'),
                ),
              OutlinedButton.icon(
                onPressed: () => _openUrl(context, qrUrl),
                icon: const Icon(Icons.qr_code_2_outlined),
                label: const Text('Download QR'),
              ),
              OutlinedButton.icon(
                onPressed: () => _copyToClipboard(context, portfolioUrl),
                icon: const Icon(Icons.share_outlined),
                label: const Text('Share Link'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _resumeUrl(Map<String, dynamic> profile) {
    final direct = _formatValue(profile['resumeUrl']);
    if (direct.startsWith('http')) return direct;
    final resumes = profile['resumes'];
    if (resumes is Iterable) {
      final maps = resumes.whereType<Map>().toList();
      final defaultResume = maps.where(
        (item) => item['isDefault'] == true,
      );
      for (final resume in [...defaultResume, ...maps]) {
        final url = _formatValue(resume['url']);
        if (url.startsWith('http')) return url;
      }
    }
    return '';
  }

  String _portfolioUrl(Map<String, dynamic> profile, String identifier) {
    final direct = _formatValue(profile['portfolioUrl']);
    if (direct.startsWith('http')) return direct;
    final links = profile['portfolioLinks'] ?? profile['portfolio'];
    if (links is Iterable) {
      for (final link in links) {
        final value = _formatValue(link);
        if (value.startsWith('http')) return value;
      }
    }
    return 'https://thenijobs.com/p/$identifier';
  }

  Future<void> _openUrl(BuildContext context, String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open link')),
      );
    }
  }

  Future<void> _copyToClipboard(BuildContext context, String value) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Portfolio link copied')),
    );
  }
}

class _ContactChip extends StatelessWidget {
  const _ContactChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: AppTheme.brandCyan),
            const SizedBox(width: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 220),
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppTheme.darkTextSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PublicEmptyState extends StatelessWidget {
  const _PublicEmptyState({
    required this.title,
    required this.body,
    required this.actionLabel,
    required this.onPressed,
    this.standalone = true,
  });

  final String title;
  final String body;
  final String actionLabel;
  final VoidCallback onPressed;
  final bool standalone;

  @override
  Widget build(BuildContext context) {
    final content = Center(
      child: Container(
        width: 430,
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(22),
        decoration: AppTheme.glassCard(borderRadius: 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.badge_outlined,
              color: AppTheme.brandCyan,
              size: 42,
            ),
            const SizedBox(height: 14),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              body,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.darkTextSecondary,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 18),
            ElevatedButton(onPressed: onPressed, child: Text(actionLabel)),
          ],
        ),
      ),
    );
    if (!standalone) return content;
    return Scaffold(backgroundColor: AppTheme.darkBg, body: content);
  }
}

class _SimpleActionCard extends StatelessWidget {
  const _SimpleActionCard({
    required this.title,
    required this.body,
    required this.icon,
    required this.actionLabel,
    required this.onPressed,
  });

  final String title;
  final String body;
  final IconData icon;
  final String actionLabel;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppTheme.glassCard(borderRadius: 22),
      child: Column(
        children: [
          Icon(icon, color: AppTheme.brandCyan, size: 42),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.darkTextSecondary,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: onPressed, child: Text(actionLabel)),
        ],
      ),
    );
  }
}

class _PortalTextField extends StatelessWidget {
  const _PortalTextField({
    required this.controller,
    required this.label,
    required this.icon,
    this.maxLines = 1,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: AppTheme.darkTextSecondary),
        prefixIcon: Icon(icon, color: AppTheme.darkTextSecondary),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.brandCyan),
        ),
      ),
    );
  }
}

class _PortalDropdown extends StatelessWidget {
  const _PortalDropdown({
    required this.label,
    required this.icon,
    required this.value,
    required this.values,
    required this.onChanged,
  });

  final String label;
  final IconData icon;
  final String value;
  final List<String> values;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      dropdownColor: AppTheme.darkCardBg,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: AppTheme.darkTextSecondary),
        prefixIcon: Icon(icon, color: AppTheme.darkTextSecondary),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.brandCyan),
        ),
      ),
      items: values
          .map((item) => DropdownMenuItem(value: item, child: Text(item)))
          .toList(),
      onChanged: (value) {
        if (value != null) onChanged(value);
      },
    );
  }
}

class _PortalFeatureScreen extends StatefulWidget {
  const _PortalFeatureScreen({required this.config});

  final _FeatureConfig config;

  @override
  State<_PortalFeatureScreen> createState() => _PortalFeatureScreenState();
}

class _PortalFeatureScreenState extends State<_PortalFeatureScreen> {
  late final Future<String?> _companyIdFuture;

  String? get _uid => fb.FirebaseAuth.instance.currentUser?.uid;

  @override
  void initState() {
    super.initState();
    _companyIdFuture = _loadCompanyId();
  }

  Future<String?> _loadCompanyId() async {
    final uid = _uid;
    if (uid == null) return null;
    final snap = await FirebaseFirestore.instance
        .collection('companies')
        .where('ownerId', isEqualTo: uid)
        .limit(1)
        .get();
    if (snap.docs.isEmpty) return null;
    return snap.docs.first.id;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String?>(
      future: _companyIdFuture,
      builder: (context, snapshot) {
        final companyId = snapshot.data;
        return Scaffold(
          backgroundColor: AppTheme.darkBg,
          appBar: AppBar(
            title: Text(widget.config.title),
            actions: [
              IconButton(
                tooltip: 'Home',
                onPressed: () => context.go('/'),
                icon: const Icon(Icons.home_outlined),
              ),
            ],
          ),
          body: Container(
            decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
            child: SafeArea(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                children: [
                  _HeaderCard(config: widget.config),
                  if (widget.config.needsCompany &&
                      snapshot.connectionState == ConnectionState.waiting)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (widget.config.needsCompany && companyId == null)
                    _NoCompanyCard(
                      onCreate: () => context.push('/company/register'),
                    )
                  else ...[
                    if (widget.config.metrics.isNotEmpty) ...[
                      const SizedBox(height: 18),
                      _MetricsGrid(
                        metrics: widget.config.metrics,
                        uid: _uid,
                        companyId: companyId,
                      ),
                    ],
                    if (widget.config.actions.isNotEmpty) ...[
                      const SizedBox(height: 18),
                      _QuickActionsGrid(actions: widget.config.actions),
                    ],
                    for (final section in widget.config.sections) ...[
                      const SizedBox(height: 18),
                      _FirestoreListSection(
                        section: section,
                        uid: _uid,
                        companyId: companyId,
                      ),
                    ],
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.config});

  final _FeatureConfig config;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppTheme.glassCard(
        borderRadius: 22,
        borderColor: config.color.withValues(alpha: 0.35),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: config.color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(config.icon, color: config.color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  config.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  config.subtitle,
                  style: const TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 13,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NoCompanyCard extends StatelessWidget {
  const _NoCompanyCard({required this.onCreate});

  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 18),
      padding: const EdgeInsets.all(18),
      decoration: AppTheme.glassCard(borderRadius: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Company profile required',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Create or complete your company profile first. Jobs, leads, candidates, billing and reviews are linked to that company record.',
            style: TextStyle(color: AppTheme.darkTextSecondary, height: 1.45),
          ),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            onPressed: onCreate,
            icon: const Icon(Icons.business_outlined),
            label: const Text('Register Company'),
          ),
        ],
      ),
    );
  }
}

class _MetricsGrid extends StatelessWidget {
  const _MetricsGrid({
    required this.metrics,
    required this.uid,
    required this.companyId,
  });

  final List<_MetricConfig> metrics;
  final String? uid;
  final String? companyId;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 820
            ? 4
            : constraints.maxWidth >= 560
            ? 2
            : 1;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: metrics.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: columns == 1 ? 3.6 : 2.6,
          ),
          itemBuilder: (context, index) => _MetricTile(
            metric: metrics[index],
            uid: uid,
            companyId: companyId,
          ),
        );
      },
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.metric,
    required this.uid,
    required this.companyId,
  });

  final _MetricConfig metric;
  final String? uid;
  final String? companyId;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<int>(
      stream: _countStream(metric.collection, metric.filters, uid, companyId),
      builder: (context, snapshot) {
        final value = snapshot.data;
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: AppTheme.statCard(borderRadius: 18),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: metric.color.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(metric.icon, color: metric.color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      value == null
                          ? '-'
                          : NumberFormat.compact().format(value),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 20,
                      ),
                    ),
                    Text(
                      metric.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.darkTextSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid({required this.actions});

  final List<_QuickAction> actions;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 820
            ? 4
            : constraints.maxWidth >= 560
            ? 2
            : 1;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: actions.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: columns == 1 ? 4.1 : 3.1,
          ),
          itemBuilder: (context, index) {
            final action = actions[index];
            return InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () => context.push(action.path),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: AppTheme.glassCard(borderRadius: 18),
                child: Row(
                  children: [
                    Icon(action.icon, color: action.color),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        action.label,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: AppTheme.darkTextSecondary,
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
}

class _FirestoreListSection extends StatelessWidget {
  const _FirestoreListSection({
    required this.section,
    required this.uid,
    required this.companyId,
  });

  final _ListSectionConfig section;
  final String? uid;
  final String? companyId;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: AppTheme.glassCard(borderRadius: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    section.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                ),
                Text(
                  section.collection,
                  style: const TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          StreamBuilder<List<QueryDocumentSnapshot<Map<String, dynamic>>>>(
            stream: _docsStream(section, uid, companyId),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              if (snapshot.hasError) {
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Could not load this section: ${snapshot.error}',
                    style: const TextStyle(
                      color: AppTheme.brandRose,
                      fontSize: 12,
                    ),
                  ),
                );
              }
              final docs = snapshot.data ?? const [];
              if (docs.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(18),
                  child: Text(
                    'No records yet. Data will appear here as users work through this feature.',
                    style: TextStyle(
                      color: AppTheme.darkTextSecondary,
                      fontSize: 13,
                    ),
                  ),
                );
              }
              return Column(
                children: docs
                    .map((doc) => _DocListTile(section: section, doc: doc))
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _DocListTile extends StatelessWidget {
  const _DocListTile({required this.section, required this.doc});

  final _ListSectionConfig section;
  final QueryDocumentSnapshot<Map<String, dynamic>> doc;

  @override
  Widget build(BuildContext context) {
    final data = doc.data();
    final title = _firstValue(data, section.primaryFields, fallback: doc.id);
    final subtitle = _firstValue(data, section.subtitleFields, fallback: '');
    final meta = section.metaFields
        .map((field) => _fieldLabel(field, _valueForField(data, field)))
        .where((value) => value.isNotEmpty)
        .take(4)
        .toList();

    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppTheme.darkBorder)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                    if (subtitle.isNotEmpty) ...[
                      const SizedBox(height: 5),
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.darkTextSecondary,
                          fontSize: 12,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 10),
              _StatusChip(
                label: _firstValue(data, const [
                  'status',
                  'role',
                  'verificationStatus',
                ], fallback: 'live'),
              ),
            ],
          ),
          if (meta.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: meta.map((item) => _TinyChip(label: item)).toList(),
            ),
          ],
          if (section.actions.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: section.actions.map((action) {
                return OutlinedButton.icon(
                  onPressed: () => _updateDoc(context, action),
                  icon: Icon(action.icon, size: 15),
                  label: Text(action.label),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: action.color,
                    side: BorderSide(
                      color: action.color.withValues(alpha: 0.45),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _updateDoc(BuildContext context, _DocAction action) async {
    try {
      final handledByFunction = await _runCallableDocAction(doc, action);
      if (!handledByFunction) {
        await doc.reference.update({
          ...action.data,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('${action.label} updated')));
      }
    } catch (err) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Update failed: $err')));
      }
    }
  }
}

Future<bool> _runCallableDocAction(
  QueryDocumentSnapshot<Map<String, dynamic>> doc,
  _DocAction action,
) async {
  final collection = doc.reference.parent.id;
  final status = action.data['status']?.toString();
  final verificationStatus = action.data['verificationStatus']?.toString();
  final functions = FirebaseFunctions.instanceFor(region: _functionsRegion);

  Future<void> call(String name, Map<String, Object?> data) async {
    await functions.httpsCallable(name).call(data);
  }

  switch (collection) {
    case 'applications':
      if (status == null) return false;
      await call('updateApplicationStatus', {
        'applicationId': doc.id,
        'status': status,
      });
      return true;
    case 'interviews':
      if (status == null) return false;
      await call('updateInterviewStatus', {
        'interviewId': doc.id,
        'status': status,
      });
      return true;
    case 'companies':
      if (verificationStatus == 'verified' ||
          action.data['isVerified'] == true) {
        await call('approveCompany', {'id': doc.id});
        return true;
      }
      if (verificationStatus == 'rejected' || status == 'rejected') {
        await call('rejectCompany', {'id': doc.id});
        return true;
      }
      return false;
    case 'jobs':
      if (status == 'active' || status == 'approved') {
        await call('approveJob', {'id': doc.id});
        return true;
      }
      if (status == 'rejected') {
        await call('rejectJob', {'id': doc.id});
        return true;
      }
      return false;
    default:
      return false;
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final normalized = label.toLowerCase();
    final color =
        normalized.contains('active') ||
            normalized.contains('verified') ||
            normalized.contains('approved')
        ? AppTheme.brandEmerald
        : normalized.contains('reject') ||
              normalized.contains('blocked') ||
              normalized.contains('flag')
        ? AppTheme.brandRose
        : normalized.contains('pending') || normalized.contains('scheduled')
        ? AppTheme.brandAmber
        : AppTheme.brandCyan;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        border: Border.all(color: color.withValues(alpha: 0.28)),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _TinyChip extends StatelessWidget {
  const _TinyChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppTheme.darkTextSecondary,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

Stream<int> _countStream(
  String collection,
  List<_WhereSpec> filters,
  String? uid,
  String? companyId,
) {
  if (_hasMissingContext(filters, uid, companyId)) return Stream.value(0);
  return _applyQuery(
    collection,
    filters,
    uid,
    companyId,
  ).snapshots().map((snap) => snap.docs.length);
}

Stream<List<QueryDocumentSnapshot<Map<String, dynamic>>>> _docsStream(
  _ListSectionConfig section,
  String? uid,
  String? companyId,
) {
  if (_hasMissingContext(section.filters, uid, companyId)) {
    return Stream.value(const []);
  }
  Query<Map<String, dynamic>> query = _applyQuery(
    section.collection,
    section.filters,
    uid,
    companyId,
  );
  if (section.orderBy != null) {
    query = query.orderBy(section.orderBy!, descending: section.descending);
  }
  query = query.limit(section.limit);
  return query.snapshots().map((snap) => snap.docs);
}

Query<Map<String, dynamic>> _applyQuery(
  String collection,
  List<_WhereSpec> filters,
  String? uid,
  String? companyId,
) {
  Query<Map<String, dynamic>> query = FirebaseFirestore.instance.collection(
    collection,
  );
  for (final filter in filters) {
    final field = filter.field == '__name__'
        ? FieldPath.documentId
        : filter.field;
    final value = _resolveFilterValue(filter.value, uid, companyId);
    switch (filter.op) {
      case 'array-contains':
        query = query.where(field, arrayContains: value);
        break;
      case 'in':
        query = query.where(field, whereIn: value as List<Object?>);
        break;
      default:
        query = query.where(field, isEqualTo: value);
    }
  }
  return query;
}

bool _hasMissingContext(
  List<_WhereSpec> filters,
  String? uid,
  String? companyId,
) {
  for (final filter in filters) {
    if (filter.value == _currentUid && uid == null) return true;
    if (filter.value == _currentCompanyId && companyId == null) return true;
  }
  return false;
}

Object? _resolveFilterValue(Object? value, String? uid, String? companyId) {
  if (value == _currentUid) return uid;
  if (value == _currentCompanyId) return companyId;
  return value;
}

String _firstValue(
  Map<String, dynamic> data,
  List<String> fields, {
  required String fallback,
}) {
  for (final field in fields) {
    final value = _valueForField(data, field);
    final formatted = _formatValue(value);
    if (formatted.isNotEmpty) return formatted;
  }
  return fallback;
}

Object? _valueForField(Map<String, dynamic> data, String field) {
  switch (field) {
    case 'applicationCount':
    case 'applicationsCount':
      return data['applicationsCount'] ?? data['applicationCount'];
    case 'profileCompletion':
    case 'profileStrength':
      return data['profileStrength'] ?? data['profileCompletion'];
    case 'resumeTitle':
      return data['resumeTitle'] ??
          _firstResumeValue(data, const ['name', 'title', 'fileName']);
    case 'resumeUrl':
      return _firstResumeValue(data, const ['name', 'title', 'fileName']) ??
          data['resumeUrl'] ??
          _firstResumeValue(data, const ['url']);
    default:
      return data[field];
  }
}

Object? _firstResumeValue(Map<String, dynamic> data, List<String> fields) {
  final resumes = data['resumes'];
  if (resumes is! Iterable) return null;
  for (final resume in resumes) {
    if (resume is! Map) continue;
    for (final field in fields) {
      final value = resume[field];
      if (_formatValue(value).isNotEmpty) return value;
    }
  }
  return null;
}

String _fieldLabel(String field, Object? value) {
  final formatted = _formatValue(value);
  if (formatted.isEmpty) return '';
  final label = field
      .replaceAll('At', '')
      .replaceAll('Id', '')
      .replaceAllMapped(RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]} ${m[2]}')
      .toLowerCase();
  return '$label: $formatted';
}

String _formatValue(Object? value) {
  if (value == null) return '';
  if (value is Timestamp) {
    return DateFormat('d MMM yyyy').format(value.toDate());
  }
  if (value is DateTime) {
    return DateFormat('d MMM yyyy').format(value);
  }
  if (value is bool) return value ? 'yes' : 'no';
  if (value is Iterable) {
    return value
        .take(4)
        .map((item) {
          if (item is Map) {
            return (item['name'] ?? item['title'] ?? item['url'] ?? '')
                .toString();
          }
          return item.toString();
        })
        .where((item) => item.trim().isNotEmpty)
        .join(', ');
  }
  if (value is Map) return '';
  return value.toString().trim();
}

_FeatureConfig _featureConfigFor(String title) {
  switch (title) {
    case 'Seeker Dashboard':
      return _seekerDashboardConfig;
    case 'Seeker Profile':
      return const _FeatureConfig(
        title: 'Seeker Profile',
        subtitle:
            'Profile readiness, contact details, education, experience and portfolio data used by employers.',
        icon: Icons.person_outline,
        color: AppTheme.brandEmerald,
        actions: _seekerActions,
        sections: [
          _ListSectionConfig(
            title: 'Profile document',
            collection: 'seekerProfiles',
            filters: [_WhereSpec('__name__', _currentUid)],
            primaryFields: ['name', 'headline', 'currentRole'],
            subtitleFields: ['summary', 'email', 'phone'],
            metaFields: ['district', 'profileStrength', 'updatedAt'],
          ),
          _ListSectionConfig(
            title: 'Account details',
            collection: 'users',
            filters: [_WhereSpec('__name__', _currentUid)],
            primaryFields: ['displayName', 'email'],
            subtitleFields: ['phone', 'district'],
            metaFields: ['role', 'isVerified', 'updatedAt'],
          ),
        ],
      );
    case 'Seeker Resume & Builder':
      return const _FeatureConfig(
        title: 'Seeker Resume & Builder',
        subtitle:
            'Resume uploads, builder data and profile documents used during job applications.',
        icon: Icons.description_outlined,
        color: AppTheme.brandCyan,
        actions: [
          _QuickAction(
            label: 'Applications',
            path: '/seeker/applications',
            icon: Icons.send_outlined,
            color: AppTheme.brandEmerald,
          ),
          _QuickAction(
            label: 'Browse jobs',
            path: '/jobs',
            icon: Icons.search_outlined,
            color: AppTheme.brandCyan,
          ),
        ],
        sections: [
          _ListSectionConfig(
            title: 'Resume profile',
            collection: 'seekerProfiles',
            filters: [_WhereSpec('__name__', _currentUid)],
            primaryFields: ['name', 'headline', 'currentRole'],
            subtitleFields: ['resumes', 'summary', 'skills'],
            metaFields: ['updatedAt', 'district'],
          ),
        ],
      );
    case 'Seeker Applications':
      return const _FeatureConfig(
        title: 'Seeker Applications',
        subtitle:
            'Track every submitted application, resume, cover letter and employer status update.',
        icon: Icons.send_outlined,
        color: AppTheme.brandEmerald,
        metrics: [
          _MetricConfig(
            label: 'Applications',
            collection: 'applications',
            icon: Icons.send_outlined,
            color: AppTheme.brandEmerald,
            filters: [_WhereSpec('seekerId', _currentUid)],
          ),
          _MetricConfig(
            label: 'Interviews',
            collection: 'interviews',
            icon: Icons.event_outlined,
            color: AppTheme.brandAmber,
            filters: [_WhereSpec('seekerId', _currentUid)],
          ),
        ],
        sections: [
          _ListSectionConfig(
            title: 'My applications',
            collection: 'applications',
            filters: [_WhereSpec('seekerId', _currentUid)],
            orderBy: 'createdAt',
            primaryFields: ['jobTitle', 'title'],
            subtitleFields: ['companyName', 'coverLetter'],
            metaFields: ['status', 'createdAt', 'updatedAt'],
          ),
        ],
      );
    case 'Seeker Saved Jobs':
      return const _FeatureConfig(
        title: 'Seeker Saved Jobs',
        subtitle:
            'Saved opportunities from the job marketplace, including deadline and salary snapshots.',
        icon: Icons.bookmark_outline,
        color: AppTheme.primaryPurple,
        sections: [
          _ListSectionConfig(
            title: 'Saved jobs',
            collection: 'savedJobs',
            filters: [_WhereSpec('userId', _currentUid)],
            orderBy: 'savedAt',
            primaryFields: ['jobTitle', 'title'],
            subtitleFields: ['companyName', 'description'],
            metaFields: ['district', 'jobType', 'deadline', 'savedAt'],
          ),
        ],
      );
    case 'Seeker Job Alerts':
      return const _FeatureConfig(
        title: 'Seeker Job Alerts',
        subtitle:
            'Keyword, location and channel preferences for matching new jobs.',
        icon: Icons.notifications_active_outlined,
        color: AppTheme.brandCyan,
        sections: [
          _ListSectionConfig(
            title: 'Job alerts',
            collection: 'jobAlerts',
            filters: [_WhereSpec('userId', _currentUid)],
            orderBy: 'createdAt',
            primaryFields: ['title', 'keyword', 'category'],
            subtitleFields: ['district', 'location', 'jobType'],
            metaFields: ['status', 'pushEnabled', 'createdAt'],
            actions: [
              _DocAction(
                label: 'Activate',
                icon: Icons.play_arrow_rounded,
                color: AppTheme.brandEmerald,
                data: {'status': 'active'},
              ),
              _DocAction(
                label: 'Pause',
                icon: Icons.pause_rounded,
                color: AppTheme.brandAmber,
                data: {'status': 'paused'},
              ),
            ],
          ),
        ],
      );
    case 'Seeker Interviews':
      return const _FeatureConfig(
        title: 'Seeker Interviews',
        subtitle: 'Interview schedules, mode, timing and candidate reminders.',
        icon: Icons.event_available_outlined,
        color: AppTheme.brandAmber,
        sections: [
          _ListSectionConfig(
            title: 'My interviews',
            collection: 'interviews',
            filters: [_WhereSpec('seekerId', _currentUid)],
            orderBy: 'createdAt',
            primaryFields: ['jobTitle', 'companyName'],
            subtitleFields: ['mode', 'location', 'notes'],
            metaFields: ['status', 'date', 'time', 'createdAt'],
          ),
        ],
      );
    case 'Seeker Messages':
      return _messagesConfig(
        title,
        'Direct conversations with employers and admins.',
      );
    case 'Seeker Notifications':
      return _notificationsConfig(title);
    case 'Seeker Rewards':
      return const _FeatureConfig(
        title: 'Seeker Rewards',
        subtitle: 'Gamification points, badges and activity progress.',
        icon: Icons.emoji_events_outlined,
        color: AppTheme.brandAmber,
        sections: [
          _ListSectionConfig(
            title: 'Rewards profile',
            collection: 'gamification',
            filters: [_WhereSpec('__name__', _currentUid)],
            primaryFields: ['displayName', 'userName', 'level'],
            subtitleFields: ['badges', 'achievements'],
            metaFields: ['points', 'monthlyPoints', 'rank', 'updatedAt'],
          ),
        ],
      );
    case 'Seeker AI Coach':
      return const _FeatureConfig(
        title: 'Seeker AI Coach',
        subtitle:
            'AI interview practice, resume review and local career guidance surface matching the web app roadmap.',
        icon: Icons.auto_awesome_outlined,
        color: AppTheme.brandEmerald,
        actions: [
          _QuickAction(
            label: 'Improve resume',
            path: '/seeker/resume',
            icon: Icons.description_outlined,
            color: AppTheme.brandCyan,
          ),
          _QuickAction(
            label: 'Find jobs',
            path: '/jobs',
            icon: Icons.search_outlined,
            color: AppTheme.brandEmerald,
          ),
          _QuickAction(
            label: 'Review skills',
            path: '/seeker/skills',
            icon: Icons.school_outlined,
            color: AppTheme.primaryPurple,
          ),
        ],
        sections: [
          _ListSectionConfig(
            title: 'Profile input for coaching',
            collection: 'seekerProfiles',
            filters: [_WhereSpec('__name__', _currentUid)],
            primaryFields: ['headline', 'currentRole', 'name'],
            subtitleFields: ['summary', 'skills', 'experience'],
            metaFields: ['profileStrength', 'district', 'updatedAt'],
          ),
        ],
      );
    case 'Seeker Skills':
      return const _FeatureConfig(
        title: 'Seeker Skills',
        subtitle:
            'Skills, certifications and portfolio readiness used by matching and talent search.',
        icon: Icons.school_outlined,
        color: AppTheme.primaryPurple,
        sections: [
          _ListSectionConfig(
            title: 'Skills profile',
            collection: 'seekerProfiles',
            filters: [_WhereSpec('__name__', _currentUid)],
            primaryFields: ['name', 'headline'],
            subtitleFields: ['skills', 'certifications', 'portfolioLinks'],
            metaFields: ['updatedAt', 'profileStrength'],
          ),
        ],
      );
    case 'Seeker Subscription':
      return _subscriptionConfig(title, employer: false);
    case 'Seeker Settings':
      return const _FeatureConfig(
        title: 'Seeker Settings',
        subtitle: 'Account, privacy and notification preference records.',
        icon: Icons.settings_outlined,
        color: AppTheme.brandCyan,
        sections: [
          _ListSectionConfig(
            title: 'User settings',
            collection: 'users',
            filters: [_WhereSpec('__name__', _currentUid)],
            primaryFields: ['displayName', 'email'],
            subtitleFields: ['preferences', 'phone'],
            metaFields: ['district', 'isVerified', 'updatedAt'],
          ),
        ],
      );
    case 'Employer Dashboard':
      return _employerDashboardConfig;
    case 'Employer Company Profile':
      return const _FeatureConfig(
        title: 'Employer Company Profile',
        subtitle:
            'Business profile, verification status, gallery, contact details and Smart ID readiness.',
        icon: Icons.business_outlined,
        color: AppTheme.brandCyan,
        actions: [
          _QuickAction(
            label: 'Post job',
            path: '/employer/post-job',
            icon: Icons.add_business_outlined,
            color: AppTheme.brandEmerald,
          ),
          _QuickAction(
            label: 'View leads',
            path: '/employer/leads',
            icon: Icons.trending_up_outlined,
            color: AppTheme.brandAmber,
          ),
        ],
        sections: [
          _ListSectionConfig(
            title: 'My company profile',
            collection: 'companies',
            filters: [_WhereSpec('ownerId', _currentUid)],
            primaryFields: ['name', 'tagline'],
            subtitleFields: ['description', 'email', 'phone'],
            metaFields: [
              'verificationStatus',
              'district',
              'category',
              'updatedAt',
            ],
          ),
        ],
      );
    case 'Employer Post Job':
      return const _FeatureConfig(
        title: 'Employer Post Job',
        subtitle:
            'Job posting workspace. Created jobs remain pending until admin approval, same as the web app.',
        icon: Icons.post_add_outlined,
        color: AppTheme.brandEmerald,
        needsCompany: true,
        actions: [
          _QuickAction(
            label: 'Manage jobs',
            path: '/employer/jobs',
            icon: Icons.work_outline,
            color: AppTheme.brandCyan,
          ),
          _QuickAction(
            label: 'Company profile',
            path: '/employer/company-profile',
            icon: Icons.business_outlined,
            color: AppTheme.brandAmber,
          ),
        ],
        sections: [
          _ListSectionConfig(
            title: 'Recent job drafts and submissions',
            collection: 'jobs',
            filters: [_WhereSpec('companyId', _currentCompanyId)],
            orderBy: 'createdAt',
            primaryFields: ['title'],
            subtitleFields: ['description', 'companyName'],
            metaFields: ['status', 'isActive', 'district', 'createdAt'],
          ),
        ],
      );
    case 'Employer Jobs':
      return _employerCollectionConfig(
        title,
        Icons.work_outline,
        AppTheme.brandCyan,
        'jobs',
        'My jobs',
        ['title'],
        ['description', 'companyName'],
        ['status', 'isActive', 'applicationsCount', 'createdAt'],
      );
    case 'Employer Candidates':
      return _employerCollectionConfig(
        title,
        Icons.groups_outlined,
        AppTheme.primaryPurple,
        'applications',
        'Candidate applications',
        ['seekerName', 'jobTitle'],
        ['coverLetter', 'resumeUrl'],
        ['status', 'createdAt', 'updatedAt'],
        actions: _applicationActions,
      );
    case 'Employer Talent Search':
      return const _FeatureConfig(
        title: 'Employer Talent Search',
        subtitle:
            'Candidate discovery surface using seeker profiles, skills and local readiness signals.',
        icon: Icons.manage_search_outlined,
        color: AppTheme.brandEmerald,
        needsCompany: true,
        sections: [
          _ListSectionConfig(
            title: 'Visible seeker profiles',
            collection: 'publicProfiles',
            orderBy: 'updatedAt',
            primaryFields: ['name', 'headline', 'currentRole'],
            subtitleFields: ['skills', 'summary', 'email'],
            metaFields: ['district', 'profileStrength', 'updatedAt'],
          ),
        ],
      );
    case 'Employer Interviews':
      return _employerCollectionConfig(
        title,
        Icons.event_outlined,
        AppTheme.brandAmber,
        'interviews',
        'Interview schedule',
        ['jobTitle', 'seekerName'],
        ['mode', 'location', 'notes'],
        ['status', 'date', 'time', 'createdAt'],
        actions: const [
          _DocAction(
            label: 'Complete',
            icon: Icons.check_circle_outline,
            color: AppTheme.brandEmerald,
            data: {'status': 'completed'},
          ),
          _DocAction(
            label: 'Cancel',
            icon: Icons.cancel_outlined,
            color: AppTheme.brandRose,
            data: {'status': 'cancelled'},
          ),
        ],
      );
    case 'Employer Leads':
      return _employerCollectionConfig(
        title,
        Icons.trending_up_outlined,
        AppTheme.brandEmerald,
        'leads',
        'Lead inbox',
        ['name', 'companyName'],
        ['message', 'phone'],
        ['status', 'createdAt', 'updatedAt'],
        actions: _leadActions,
      );
    case 'Employer Reviews':
      return const _FeatureConfig(
        title: 'Employer Reviews',
        subtitle: 'Customer and employee reviews for your company profile.',
        icon: Icons.star_border_rounded,
        color: AppTheme.brandAmber,
        needsCompany: true,
        sections: [
          _ListSectionConfig(
            title: 'Company reviews',
            collection: 'reviews',
            filters: [_WhereSpec('targetId', _currentCompanyId)],
            orderBy: 'createdAt',
            primaryFields: ['title', 'reviewerName'],
            subtitleFields: ['content', 'replyText'],
            metaFields: ['status', 'rating', 'createdAt'],
          ),
        ],
      );
    case 'Employer Messages':
      return _messagesConfig(
        title,
        'Conversations with candidates and admins.',
      );
    case 'Employer Billing':
    case 'Employer Subscription':
      return _subscriptionConfig(title, employer: true);
    case 'Employer Reports':
      return const _FeatureConfig(
        title: 'Employer Reports',
        subtitle:
            'Live operational data for jobs, applicants, leads, reviews and interviews.',
        icon: Icons.bar_chart_outlined,
        color: AppTheme.brandCyan,
        needsCompany: true,
        metrics: _employerMetrics,
        sections: [
          _ListSectionConfig(
            title: 'Recent applications',
            collection: 'applications',
            filters: [_WhereSpec('companyId', _currentCompanyId)],
            orderBy: 'createdAt',
            primaryFields: ['seekerName', 'jobTitle'],
            subtitleFields: ['coverLetter'],
            metaFields: ['status', 'createdAt'],
          ),
          _ListSectionConfig(
            title: 'Recent leads',
            collection: 'leads',
            filters: [_WhereSpec('companyId', _currentCompanyId)],
            orderBy: 'createdAt',
            primaryFields: ['name'],
            subtitleFields: ['message', 'phone'],
            metaFields: ['status', 'createdAt'],
          ),
        ],
      );
    case 'Employer Settings':
      return const _FeatureConfig(
        title: 'Employer Settings',
        subtitle:
            'Employer account and company notification preference records.',
        icon: Icons.settings_outlined,
        color: AppTheme.brandCyan,
        needsCompany: true,
        sections: [
          _ListSectionConfig(
            title: 'Company settings',
            collection: 'companies',
            filters: [_WhereSpec('__name__', _currentCompanyId)],
            primaryFields: ['name'],
            subtitleFields: ['email', 'phone'],
            metaFields: ['verificationStatus', 'updatedAt'],
          ),
          _ListSectionConfig(
            title: 'Account settings',
            collection: 'users',
            filters: [_WhereSpec('__name__', _currentUid)],
            primaryFields: ['displayName'],
            subtitleFields: ['email', 'phone'],
            metaFields: ['role', 'updatedAt'],
          ),
        ],
      );
    case 'Admin Dashboard':
      return _adminDashboardConfig;
    case 'Admin Businesses':
      return _adminCollectionConfig(
        title,
        Icons.business_outlined,
        'companies',
        'Business approvals',
        ['name', 'tagline'],
        ['description', 'email', 'phone'],
        ['verificationStatus', 'status', 'district', 'category', 'createdAt'],
        _businessActions,
      );
    case 'Admin Jobs':
      return _adminCollectionConfig(
        title,
        Icons.work_outline,
        'jobs',
        'Job approvals',
        ['title'],
        ['companyName', 'description'],
        ['status', 'isActive', 'district', 'createdAt'],
        _jobAdminActions,
      );
    case 'Admin Users':
      return _adminCollectionConfig(
        title,
        Icons.people_alt_outlined,
        'users',
        'Platform users',
        ['displayName', 'email'],
        ['phone', 'district'],
        ['role', 'isVerified', 'createdAt'],
        const [],
      );
    case 'Admin Leads':
      return _adminCollectionConfig(
        title,
        Icons.trending_up_outlined,
        'leads',
        'Lead operations',
        ['name', 'companyName'],
        ['message', 'phone'],
        ['status', 'createdAt'],
        _leadActions,
      );
    case 'Admin Services':
      return _adminCollectionConfig(
        title,
        Icons.handyman_outlined,
        'services',
        'Service listings',
        ['name', 'title'],
        ['providerName', 'description'],
        ['status', 'category', 'district', 'createdAt'],
        const [
          _DocAction(
            label: 'Activate',
            icon: Icons.check_circle_outline,
            color: AppTheme.brandEmerald,
            data: {'status': 'active'},
          ),
          _DocAction(
            label: 'Pause',
            icon: Icons.pause_circle_outline,
            color: AppTheme.brandAmber,
            data: {'status': 'paused'},
          ),
        ],
      );
    case 'Admin Subscriptions':
      return const _FeatureConfig(
        title: 'Admin Subscriptions',
        subtitle: 'Subscription and payment records across the marketplace.',
        icon: Icons.credit_card_outlined,
        color: AppTheme.brandCyan,
        metrics: [
          _MetricConfig(
            label: 'Subscriptions',
            collection: 'subscriptions',
            icon: Icons.card_membership_outlined,
            color: AppTheme.brandCyan,
          ),
          _MetricConfig(
            label: 'Payments',
            collection: 'payments',
            icon: Icons.payments_outlined,
            color: AppTheme.brandEmerald,
          ),
        ],
        sections: [
          _ListSectionConfig(
            title: 'Subscriptions',
            collection: 'subscriptions',
            orderBy: 'createdAt',
            primaryFields: ['planName', 'userName', 'companyName'],
            subtitleFields: ['companyId', 'userId'],
            metaFields: ['status', 'amount', 'createdAt'],
          ),
          _ListSectionConfig(
            title: 'Payments',
            collection: 'payments',
            orderBy: 'createdAt',
            primaryFields: ['description', 'planName', 'userName'],
            subtitleFields: ['companyName', 'provider'],
            metaFields: ['status', 'amount', 'createdAt'],
          ),
        ],
      );
    case 'Admin Ads':
      return _adminCollectionConfig(
        title,
        Icons.campaign_outlined,
        'advertisements',
        'Ad campaigns',
        ['title', 'name'],
        ['placement', 'targetUrl'],
        ['status', 'budget', 'createdAt'],
        const [
          _DocAction(
            label: 'Activate',
            icon: Icons.play_arrow_rounded,
            color: AppTheme.brandEmerald,
            data: {'status': 'active'},
          ),
          _DocAction(
            label: 'Pause',
            icon: Icons.pause_rounded,
            color: AppTheme.brandAmber,
            data: {'status': 'paused'},
          ),
        ],
      );
    case 'Admin Reviews':
      return _adminCollectionConfig(
        title,
        Icons.rate_review_outlined,
        'reviews',
        'Review moderation',
        ['title', 'reviewerName'],
        ['content', 'targetName'],
        ['status', 'rating', 'createdAt'],
        _reviewActions,
      );
    case 'Admin Notifications':
      return const _FeatureConfig(
        title: 'Admin Notifications',
        subtitle: 'In-app notification broadcasts and delivery history.',
        icon: Icons.notifications_outlined,
        color: AppTheme.primaryPurple,
        metrics: [
          _MetricConfig(
            label: 'Notifications',
            collection: 'notifications',
            icon: Icons.notifications_outlined,
            color: AppTheme.primaryPurple,
          ),
          _MetricConfig(
            label: 'Broadcasts',
            collection: 'broadcasts',
            icon: Icons.campaign_outlined,
            color: AppTheme.brandCyan,
          ),
        ],
        sections: [
          _ListSectionConfig(
            title: 'Broadcasts',
            collection: 'broadcasts',
            orderBy: 'createdAt',
            primaryFields: ['title'],
            subtitleFields: ['message', 'audience'],
            metaFields: ['type', 'status', 'createdAt'],
          ),
          _ListSectionConfig(
            title: 'Notifications',
            collection: 'notifications',
            orderBy: 'createdAt',
            primaryFields: ['title'],
            subtitleFields: ['message', 'userId'],
            metaFields: ['type', 'read', 'createdAt'],
          ),
        ],
      );
    case 'Admin Reports':
      return _adminDashboardConfig.copyWith(
        title: title,
        subtitle: 'Aggregated platform operations from Firestore collections.',
      );
    case 'Admin Security':
      return const _FeatureConfig(
        title: 'Admin Security',
        subtitle: 'Admin roles, account verification and recent activity logs.',
        icon: Icons.shield_outlined,
        color: AppTheme.brandRose,
        sections: [
          _ListSectionConfig(
            title: 'Admin users',
            collection: 'users',
            filters: [
              _WhereSpec('role', ['admin', 'super_admin'], op: 'in'),
            ],
            primaryFields: ['displayName', 'email'],
            subtitleFields: ['phone'],
            metaFields: ['role', 'isVerified', 'lastLoginAt'],
          ),
          _ListSectionConfig(
            title: 'Activity logs',
            collection: 'activityLogs',
            orderBy: 'timestamp',
            primaryFields: ['action'],
            subtitleFields: ['target', 'userName'],
            metaFields: ['timestamp', 'userId'],
          ),
        ],
      );
    case 'Admin Settings':
      return _adminCollectionConfig(
        title,
        Icons.settings_outlined,
        'platformSettings',
        'Platform settings documents',
        ['title', 'name', 'key'],
        ['description', 'value'],
        ['updatedAt', 'createdAt'],
        const [],
      );
    default:
      return _FeatureConfig(
        title: title,
        subtitle:
            'Feature surface connected to Firebase. Add records in the web app or admin tools and they will appear here.',
        icon: Icons.dashboard_customize_outlined,
        color: AppTheme.primaryPurple,
      );
  }
}

extension on _FeatureConfig {
  _FeatureConfig copyWith({String? title, String? subtitle}) {
    return _FeatureConfig(
      title: title ?? this.title,
      subtitle: subtitle ?? this.subtitle,
      icon: icon,
      color: color,
      needsCompany: needsCompany,
      metrics: metrics,
      actions: actions,
      sections: sections,
    );
  }
}

const _seekerActions = [
  _QuickAction(
    label: 'Find jobs',
    path: '/jobs',
    icon: Icons.search_outlined,
    color: AppTheme.brandEmerald,
  ),
  _QuickAction(
    label: 'Applications',
    path: '/seeker/applications',
    icon: Icons.send_outlined,
    color: AppTheme.brandCyan,
  ),
  _QuickAction(
    label: 'Resume',
    path: '/seeker/resume',
    icon: Icons.description_outlined,
    color: AppTheme.primaryPurple,
  ),
  _QuickAction(
    label: 'Notifications',
    path: '/seeker/notifications',
    icon: Icons.notifications_outlined,
    color: AppTheme.brandAmber,
  ),
];

const _employerActions = [
  _QuickAction(
    label: 'Post job',
    path: '/employer/post-job',
    icon: Icons.post_add_outlined,
    color: AppTheme.brandEmerald,
  ),
  _QuickAction(
    label: 'Candidates',
    path: '/employer/candidates',
    icon: Icons.groups_outlined,
    color: AppTheme.primaryPurple,
  ),
  _QuickAction(
    label: 'Leads',
    path: '/employer/leads',
    icon: Icons.trending_up_outlined,
    color: AppTheme.brandAmber,
  ),
  _QuickAction(
    label: 'Billing',
    path: '/employer/billing',
    icon: Icons.credit_card_outlined,
    color: AppTheme.brandCyan,
  ),
];

const _adminActions = [
  _QuickAction(
    label: 'Businesses',
    path: '/admin/businesses',
    icon: Icons.business_outlined,
    color: AppTheme.brandCyan,
  ),
  _QuickAction(
    label: 'Jobs',
    path: '/admin/jobs',
    icon: Icons.work_outline,
    color: AppTheme.brandEmerald,
  ),
  _QuickAction(
    label: 'Users',
    path: '/admin/users',
    icon: Icons.people_alt_outlined,
    color: AppTheme.primaryPurple,
  ),
  _QuickAction(
    label: 'Notifications',
    path: '/admin/notifications',
    icon: Icons.campaign_outlined,
    color: AppTheme.brandAmber,
  ),
];

const _applicationActions = [
  _DocAction(
    label: 'Shortlist',
    icon: Icons.star_border_rounded,
    color: AppTheme.primaryPurple,
    data: {'status': 'shortlisted'},
  ),
  _DocAction(
    label: 'Select',
    icon: Icons.check_circle_outline,
    color: AppTheme.brandEmerald,
    data: {'status': 'selected'},
  ),
  _DocAction(
    label: 'Reject',
    icon: Icons.cancel_outlined,
    color: AppTheme.brandRose,
    data: {'status': 'rejected'},
  ),
];

const _leadActions = [
  _DocAction(
    label: 'Contacted',
    icon: Icons.call_outlined,
    color: AppTheme.brandCyan,
    data: {'status': 'contacted'},
  ),
  _DocAction(
    label: 'Converted',
    icon: Icons.check_circle_outline,
    color: AppTheme.brandEmerald,
    data: {'status': 'converted'},
  ),
  _DocAction(
    label: 'Closed',
    icon: Icons.close_rounded,
    color: AppTheme.brandRose,
    data: {'status': 'closed'},
  ),
];

const _businessActions = [
  _DocAction(
    label: 'Approve',
    icon: Icons.verified_outlined,
    color: AppTheme.brandEmerald,
    data: {
      'verificationStatus': 'verified',
      'status': 'approved',
      'isVerified': true,
    },
  ),
  _DocAction(
    label: 'Feature',
    icon: Icons.workspace_premium_outlined,
    color: AppTheme.brandAmber,
    data: {'isFeatured': true},
  ),
  _DocAction(
    label: 'Reject',
    icon: Icons.cancel_outlined,
    color: AppTheme.brandRose,
    data: {'verificationStatus': 'rejected', 'status': 'rejected'},
  ),
];

const _jobAdminActions = [
  _DocAction(
    label: 'Approve',
    icon: Icons.check_circle_outline,
    color: AppTheme.brandEmerald,
    data: {'status': 'active', 'isActive': true},
  ),
  _DocAction(
    label: 'Reject',
    icon: Icons.cancel_outlined,
    color: AppTheme.brandRose,
    data: {'status': 'rejected', 'isActive': false},
  ),
];

const _reviewActions = [
  _DocAction(
    label: 'Approve',
    icon: Icons.check_circle_outline,
    color: AppTheme.brandEmerald,
    data: {'status': 'approved', 'isVerified': true},
  ),
  _DocAction(
    label: 'Flag',
    icon: Icons.flag_outlined,
    color: AppTheme.brandAmber,
    data: {'status': 'flagged'},
  ),
];

const _employerMetrics = [
  _MetricConfig(
    label: 'Jobs',
    collection: 'jobs',
    icon: Icons.work_outline,
    color: AppTheme.brandCyan,
    filters: [_WhereSpec('companyId', _currentCompanyId)],
  ),
  _MetricConfig(
    label: 'Applications',
    collection: 'applications',
    icon: Icons.groups_outlined,
    color: AppTheme.primaryPurple,
    filters: [_WhereSpec('companyId', _currentCompanyId)],
  ),
  _MetricConfig(
    label: 'Leads',
    collection: 'leads',
    icon: Icons.trending_up_outlined,
    color: AppTheme.brandEmerald,
    filters: [_WhereSpec('companyId', _currentCompanyId)],
  ),
  _MetricConfig(
    label: 'Interviews',
    collection: 'interviews',
    icon: Icons.event_outlined,
    color: AppTheme.brandAmber,
    filters: [_WhereSpec('companyId', _currentCompanyId)],
  ),
];

const _seekerDashboardConfig = _FeatureConfig(
  title: 'Seeker Dashboard',
  subtitle:
      'Mobile workspace for profile readiness, applications, saved jobs, alerts, interviews and rewards.',
  icon: Icons.dashboard_outlined,
  color: AppTheme.brandEmerald,
  metrics: [
    _MetricConfig(
      label: 'Applications',
      collection: 'applications',
      icon: Icons.send_outlined,
      color: AppTheme.brandEmerald,
      filters: [_WhereSpec('seekerId', _currentUid)],
    ),
    _MetricConfig(
      label: 'Saved jobs',
      collection: 'savedJobs',
      icon: Icons.bookmark_outline,
      color: AppTheme.primaryPurple,
      filters: [_WhereSpec('userId', _currentUid)],
    ),
    _MetricConfig(
      label: 'Interviews',
      collection: 'interviews',
      icon: Icons.event_outlined,
      color: AppTheme.brandAmber,
      filters: [_WhereSpec('seekerId', _currentUid)],
    ),
    _MetricConfig(
      label: 'Unread',
      collection: 'notifications',
      icon: Icons.notifications_outlined,
      color: AppTheme.brandCyan,
      filters: [_WhereSpec('userId', _currentUid), _WhereSpec('read', false)],
    ),
  ],
  actions: _seekerActions,
  sections: [
    _ListSectionConfig(
      title: 'Recent applications',
      collection: 'applications',
      filters: [_WhereSpec('seekerId', _currentUid)],
      orderBy: 'createdAt',
      primaryFields: ['jobTitle'],
      subtitleFields: ['companyName', 'coverLetter'],
      metaFields: ['status', 'createdAt'],
    ),
    _ListSectionConfig(
      title: 'Latest notifications',
      collection: 'notifications',
      filters: [_WhereSpec('userId', _currentUid)],
      orderBy: 'createdAt',
      primaryFields: ['title'],
      subtitleFields: ['message'],
      metaFields: ['type', 'read', 'createdAt'],
    ),
  ],
);

const _employerDashboardConfig = _FeatureConfig(
  title: 'Employer Dashboard',
  subtitle:
      'Hiring command center for jobs, candidates, leads, interviews, reviews and billing.',
  icon: Icons.dashboard_outlined,
  color: AppTheme.brandCyan,
  needsCompany: true,
  metrics: _employerMetrics,
  actions: _employerActions,
  sections: [
    _ListSectionConfig(
      title: 'Recent applications',
      collection: 'applications',
      filters: [_WhereSpec('companyId', _currentCompanyId)],
      orderBy: 'createdAt',
      primaryFields: ['seekerName', 'jobTitle'],
      subtitleFields: ['coverLetter'],
      metaFields: ['status', 'createdAt'],
    ),
    _ListSectionConfig(
      title: 'Recent jobs',
      collection: 'jobs',
      filters: [_WhereSpec('companyId', _currentCompanyId)],
      orderBy: 'createdAt',
      primaryFields: ['title'],
      subtitleFields: ['description'],
      metaFields: ['status', 'isActive', 'applicationsCount', 'createdAt'],
    ),
  ],
);

const _adminDashboardConfig = _FeatureConfig(
  title: 'Admin Dashboard',
  subtitle:
      'Platform operations for users, businesses, jobs, services, reviews, leads, subscriptions and security.',
  icon: Icons.admin_panel_settings_outlined,
  color: AppTheme.primaryPurple,
  metrics: [
    _MetricConfig(
      label: 'Users',
      collection: 'users',
      icon: Icons.people_alt_outlined,
      color: AppTheme.primaryPurple,
    ),
    _MetricConfig(
      label: 'Businesses',
      collection: 'companies',
      icon: Icons.business_outlined,
      color: AppTheme.brandCyan,
    ),
    _MetricConfig(
      label: 'Jobs',
      collection: 'jobs',
      icon: Icons.work_outline,
      color: AppTheme.brandEmerald,
    ),
    _MetricConfig(
      label: 'Leads',
      collection: 'leads',
      icon: Icons.trending_up_outlined,
      color: AppTheme.brandAmber,
    ),
  ],
  actions: _adminActions,
  sections: [
    _ListSectionConfig(
      title: 'Business approvals',
      collection: 'companies',
      orderBy: 'createdAt',
      primaryFields: ['name'],
      subtitleFields: ['description', 'email'],
      metaFields: [
        'verificationStatus',
        'status',
        'district',
        'category',
        'createdAt',
      ],
      actions: _businessActions,
    ),
    _ListSectionConfig(
      title: 'Pending jobs',
      collection: 'jobs',
      filters: [_WhereSpec('status', 'pending')],
      orderBy: 'createdAt',
      primaryFields: ['title'],
      subtitleFields: ['companyName', 'description'],
      metaFields: ['district', 'createdAt'],
      actions: _jobAdminActions,
    ),
  ],
);

_FeatureConfig _messagesConfig(String title, String subtitle) {
  return _FeatureConfig(
    title: title,
    subtitle: subtitle,
    icon: Icons.chat_bubble_outline,
    color: AppTheme.brandCyan,
    sections: const [
      _ListSectionConfig(
        title: 'Conversations',
        collection: 'conversations',
        filters: [
          _WhereSpec('participants', _currentUid, op: 'array-contains'),
        ],
        orderBy: 'lastMessageAt',
        primaryFields: ['otherUserName', 'title', 'lastMessage'],
        subtitleFields: ['lastMessage', 'otherUserRole'],
        metaFields: ['status', 'lastMessageAt', 'unreadCount'],
      ),
    ],
  );
}

_FeatureConfig _notificationsConfig(String title) {
  return _FeatureConfig(
    title: title,
    subtitle:
        'Live notification center with read state, action links and broadcast messages.',
    icon: Icons.notifications_outlined,
    color: AppTheme.primaryPurple,
    metrics: const [
      _MetricConfig(
        label: 'All notifications',
        collection: 'notifications',
        icon: Icons.notifications_outlined,
        color: AppTheme.primaryPurple,
        filters: [_WhereSpec('userId', _currentUid)],
      ),
      _MetricConfig(
        label: 'Unread',
        collection: 'notifications',
        icon: Icons.markunread_outlined,
        color: AppTheme.brandAmber,
        filters: [_WhereSpec('userId', _currentUid), _WhereSpec('read', false)],
      ),
    ],
    sections: const [
      _ListSectionConfig(
        title: 'Notifications',
        collection: 'notifications',
        filters: [_WhereSpec('userId', _currentUid)],
        orderBy: 'createdAt',
        primaryFields: ['title'],
        subtitleFields: ['message'],
        metaFields: ['type', 'read', 'createdAt'],
        actions: [
          _DocAction(
            label: 'Mark read',
            icon: Icons.done_all_rounded,
            color: AppTheme.brandEmerald,
            data: {'read': true},
          ),
        ],
      ),
    ],
  );
}

_FeatureConfig _subscriptionConfig(String title, {required bool employer}) {
  return _FeatureConfig(
    title: title,
    subtitle: employer
        ? 'Company subscription, payments and premium visibility state.'
        : 'Seeker plan, resume boosts and premium preparation features.',
    icon: Icons.card_membership_outlined,
    color: AppTheme.brandCyan,
    needsCompany: employer,
    sections: [
      _ListSectionConfig(
        title: 'Subscriptions',
        collection: 'subscriptions',
        filters: [
          employer
              ? const _WhereSpec('companyId', _currentCompanyId)
              : const _WhereSpec('userId', _currentUid),
        ],
        orderBy: 'createdAt',
        primaryFields: const ['planName', 'name'],
        subtitleFields: const ['companyName', 'description'],
        metaFields: const ['status', 'amount', 'startDate', 'endDate'],
      ),
      _ListSectionConfig(
        title: 'Payments',
        collection: 'payments',
        filters: [
          employer
              ? const _WhereSpec('companyId', _currentCompanyId)
              : const _WhereSpec('userId', _currentUid),
        ],
        orderBy: 'createdAt',
        primaryFields: const ['description', 'planName'],
        subtitleFields: const ['provider', 'paymentMethod'],
        metaFields: const ['status', 'amount', 'createdAt'],
      ),
    ],
  );
}

_FeatureConfig _employerCollectionConfig(
  String title,
  IconData icon,
  Color color,
  String collection,
  String sectionTitle,
  List<String> primary,
  List<String> subtitle,
  List<String> meta, {
  List<_DocAction> actions = const [],
}) {
  return _FeatureConfig(
    title: title,
    subtitle:
        'Firestore-backed ${sectionTitle.toLowerCase()} view synced with the web portal.',
    icon: icon,
    color: color,
    needsCompany: true,
    metrics: _employerMetrics,
    actions: _employerActions,
    sections: [
      _ListSectionConfig(
        title: sectionTitle,
        collection: collection,
        filters: const [_WhereSpec('companyId', _currentCompanyId)],
        orderBy: 'createdAt',
        primaryFields: primary,
        subtitleFields: subtitle,
        metaFields: meta,
        actions: actions,
      ),
    ],
  );
}

_FeatureConfig _adminCollectionConfig(
  String title,
  IconData icon,
  String collection,
  String sectionTitle,
  List<String> primary,
  List<String> subtitle,
  List<String> meta,
  List<_DocAction> actions,
) {
  return _FeatureConfig(
    title: title,
    subtitle:
        'Admin management surface for ${sectionTitle.toLowerCase()} synced with Firebase.',
    icon: icon,
    color: AppTheme.primaryPurple,
    actions: _adminActions,
    sections: [
      _ListSectionConfig(
        title: sectionTitle,
        collection: collection,
        orderBy: 'createdAt',
        primaryFields: primary,
        subtitleFields: subtitle,
        metaFields: meta,
        actions: actions,
      ),
    ],
  );
}

class _EmployerPostJobForm extends StatefulWidget {
  const _EmployerPostJobForm();

  @override
  State<_EmployerPostJobForm> createState() => _EmployerPostJobFormState();
}

class _EmployerPostJobFormState extends State<_EmployerPostJobForm> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _experienceController = TextEditingController();
  final _educationController = TextEditingController();
  final _skillsController = TextEditingController();
  final _salaryMinController = TextEditingController();
  final _salaryMaxController = TextEditingController();

  bool _loadingCompany = true;
  bool _submitting = false;
  String? _companyId;
  String _companyName = '';
  String _district = 'Theni';
  String _jobType = 'full_time';
  String _salaryType = 'monthly';
  int _openings = 1;
  bool _isNegotiable = true;

  static const _districts = [
    'Theni',
    'Madurai',
    'Dindigul',
    'Coimbatore',
    'Salem',
    'Chennai',
    'Trichy',
  ];

  static const _jobTypes = [
    'full_time',
    'part_time',
    'internship',
    'remote',
    'work_from_home',
    'fresher',
    'contract',
  ];

  static const _salaryTypes = ['monthly', 'yearly', 'daily', 'hourly'];

  @override
  void initState() {
    super.initState();
    _loadCompany();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _experienceController.dispose();
    _educationController.dispose();
    _skillsController.dispose();
    _salaryMinController.dispose();
    _salaryMaxController.dispose();
    super.dispose();
  }

  Future<void> _loadCompany() async {
    final uid = fb.FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) {
      if (mounted) setState(() => _loadingCompany = false);
      return;
    }

    final snap = await FirebaseFirestore.instance
        .collection('companies')
        .where('ownerId', isEqualTo: uid)
        .limit(1)
        .get();

    if (!mounted) return;
    if (snap.docs.isEmpty) {
      setState(() => _loadingCompany = false);
      return;
    }

    final company = snap.docs.first.data();
    setState(() {
      _companyId = snap.docs.first.id;
      _companyName = (company['name'] ?? company['businessName'] ?? '')
          .toString();
      final district = (company['district'] ?? '').toString();
      if (_districts.contains(district)) _district = district;
      _loadingCompany = false;
    });
  }

  List<String> _csv(TextEditingController controller) {
    return controller.text
        .split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList(growable: false);
  }

  num? _number(TextEditingController controller) {
    final text = controller.text.trim();
    if (text.isEmpty) return null;
    return num.tryParse(text);
  }

  Future<void> _submit() async {
    final user = fb.FirebaseAuth.instance.currentUser;
    if (user == null) {
      context.go('/login');
      return;
    }
    if (_companyId == null) {
      context.go('/company/register');
      return;
    }

    final title = _titleController.text.trim();
    final description = _descriptionController.text.trim();
    if (title.isEmpty || description.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter job title and description')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final result = await PlatformActionsService().createJobPosting(
        CreateJobPostingInput(
          companyId: _companyId!,
          title: title,
          description: description,
          jobType: _jobType,
          district: _district,
          openings: _openings,
          salaryType: _salaryType,
          isNegotiable: _isNegotiable,
          benefits: const [],
          skills: _csv(_skillsController),
          isPremium: false,
          isUrgent: false,
          isFeatured: false,
          location: _locationController.text.trim(),
          experience: _experienceController.text.trim(),
          education: _educationController.text.trim(),
          salaryMin: _number(_salaryMinController),
          salaryMax: _number(_salaryMaxController),
        ),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result.remainingJobSlots == null
                ? 'Job submitted for admin approval'
                : 'Job submitted. Remaining slots: ${result.remainingJobSlots}',
          ),
        ),
      );
      context.go('/employer/jobs');
    } catch (err) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Post job failed: $err')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = fb.FirebaseAuth.instance.currentUser;
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Post Job'),
        actions: [
          IconButton(
            tooltip: 'Jobs',
            onPressed: () => context.go('/employer/jobs'),
            icon: const Icon(Icons.work_outline),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: _loadingCompany
                  ? const Center(child: CircularProgressIndicator())
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        const _HeaderCard(
                          config: _FeatureConfig(
                            title: 'Post Job',
                            subtitle:
                                'Create a job listing for admin approval and publish it to seekers.',
                            icon: Icons.post_add_outlined,
                            color: AppTheme.brandEmerald,
                          ),
                        ),
                        const SizedBox(height: 18),
                        if (user == null)
                          _SimpleActionCard(
                            title: 'Sign in required',
                            body:
                                'Sign in with an employer account to post jobs.',
                            icon: Icons.login_rounded,
                            actionLabel: 'Sign In',
                            onPressed: () => context.go('/login'),
                          )
                        else if (_companyId == null)
                          _SimpleActionCard(
                            title: 'Company profile required',
                            body:
                                'Register or open your company profile before posting jobs.',
                            icon: Icons.business_outlined,
                            actionLabel: 'Register Company',
                            onPressed: () => context.go('/company/register'),
                          )
                        else
                          _buildForm(),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppTheme.glassCard(borderRadius: 22),
      child: Column(
        children: [
          if (_companyName.isNotEmpty) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _companyName,
                style: const TextStyle(
                  color: AppTheme.brandCyan,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
          _PortalTextField(
            controller: _titleController,
            label: 'Job title *',
            icon: Icons.work_outline,
          ),
          const SizedBox(height: 12),
          _PortalTextField(
            controller: _descriptionController,
            label: 'Job description *',
            icon: Icons.notes_outlined,
            maxLines: 4,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PortalDropdown(
                  label: 'District',
                  icon: Icons.place_outlined,
                  value: _district,
                  values: _districts,
                  onChanged: (value) => setState(() => _district = value),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _PortalDropdown(
                  label: 'Job type',
                  icon: Icons.badge_outlined,
                  value: _jobType,
                  values: _jobTypes,
                  onChanged: (value) => setState(() => _jobType = value),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PortalDropdown(
                  label: 'Openings',
                  icon: Icons.groups_outlined,
                  value: _openings.toString(),
                  values: const ['1', '2', '3', '4', '5', '10', '15', '20'],
                  onChanged: (value) =>
                      setState(() => _openings = int.tryParse(value) ?? 1),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _PortalTextField(
                  controller: _locationController,
                  label: 'Area / town',
                  icon: Icons.location_city_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _PortalTextField(
            controller: _skillsController,
            label: 'Skills, comma separated',
            icon: Icons.psychology_outlined,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PortalTextField(
                  controller: _experienceController,
                  label: 'Experience',
                  icon: Icons.timeline_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _PortalTextField(
                  controller: _educationController,
                  label: 'Education',
                  icon: Icons.school_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PortalTextField(
                  controller: _salaryMinController,
                  label: 'Min salary',
                  icon: Icons.currency_rupee,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _PortalTextField(
                  controller: _salaryMaxController,
                  label: 'Max salary',
                  icon: Icons.currency_rupee,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PortalDropdown(
                  label: 'Salary type',
                  icon: Icons.payments_outlined,
                  value: _salaryType,
                  values: _salaryTypes,
                  onChanged: (value) => setState(() => _salaryType = value),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _isNegotiable,
                  onChanged: (value) => setState(() => _isNegotiable = value),
                  title: const Text(
                    'Negotiable',
                    style: TextStyle(color: Colors.white),
                  ),
                  activeThumbColor: AppTheme.brandEmerald,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: _submitting ? null : _submit,
              icon: _submitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send_outlined),
              label: Text(_submitting ? 'Submitting...' : 'Submit Job'),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessagesThreadScreen extends StatefulWidget {
  const _MessagesThreadScreen({required this.title, required this.senderRole});

  final String title;
  final String senderRole;

  @override
  State<_MessagesThreadScreen> createState() => _MessagesThreadScreenState();
}

class _MessagesThreadScreenState extends State<_MessagesThreadScreen> {
  final _messageController = TextEditingController();
  String? _activeConversationId;
  bool _sending = false;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> _conversationStream(String uid) {
    return FirebaseFirestore.instance
        .collection('conversations')
        .where('participants', arrayContains: uid)
        .where('status', isEqualTo: 'active')
        .snapshots();
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> _messagesStream(String id) {
    return FirebaseFirestore.instance
        .collection('conversations/$id/messages')
        .orderBy('createdAt')
        .limit(200)
        .snapshots();
  }

  int _timeValue(Object? value) {
    if (value is Timestamp) return value.millisecondsSinceEpoch;
    if (value is DateTime) return value.millisecondsSinceEpoch;
    return 0;
  }

  String _otherParticipantId(Map<String, dynamic> data, String uid) {
    final participants = (data['participants'] as List<dynamic>? ?? const [])
        .map((item) => item.toString())
        .toList();
    return participants.firstWhere((id) => id != uid, orElse: () => '');
  }

  String _otherName(Map<String, dynamic> data, String uid) {
    final otherId = _otherParticipantId(data, uid);
    final names = data['participantNames'];
    if (names is Map && otherId.isNotEmpty && names[otherId] != null) {
      return names[otherId].toString();
    }
    return (data['jobTitle'] ?? 'Conversation').toString();
  }

  Future<void> _send(String uid) async {
    final conversationId = _activeConversationId;
    final text = _messageController.text.trim();
    if (conversationId == null || text.isEmpty || _sending) return;

    setState(() => _sending = true);
    try {
      final user = fb.FirebaseAuth.instance.currentUser;
      final conversationRef = FirebaseFirestore.instance
          .collection('conversations')
          .doc(conversationId);
      await conversationRef.collection('messages').add({
        'conversationId': conversationId,
        'senderId': uid,
        'senderName': user?.displayName?.isNotEmpty == true
            ? user!.displayName
            : user?.email ?? 'User',
        'senderRole': widget.senderRole,
        'text': text,
        'type': 'text',
        'read': false,
        'createdAt': FieldValue.serverTimestamp(),
      });
      await conversationRef.update({
        'lastMessage': text,
        'lastMessageAt': FieldValue.serverTimestamp(),
        'lastMessageSenderId': uid,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      _messageController.clear();
    } catch (err) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Message failed: $err')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = fb.FirebaseAuth.instance.currentUser;
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(title: Text(widget.title)),
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
        child: SafeArea(
          child: user == null
              ? Center(
                  child: _SimpleActionCard(
                    title: 'Sign in required',
                    body: 'Sign in to view and send messages.',
                    icon: Icons.login_rounded,
                    actionLabel: 'Sign In',
                    onPressed: () => context.go('/login'),
                  ),
                )
              : StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: _conversationStream(user.uid),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return Center(
                        child: Text(
                          'Could not load messages: ${snapshot.error}',
                          style: const TextStyle(color: AppTheme.brandRose),
                        ),
                      );
                    }

                    final conversations = [...(snapshot.data?.docs ?? const [])]
                      ..sort(
                        (a, b) => _timeValue(
                          b.data()['lastMessageAt'],
                        ).compareTo(_timeValue(a.data()['lastMessageAt'])),
                      );

                    if (conversations.isEmpty) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: _SimpleActionCard(
                            title: 'No conversations yet',
                            body:
                                'Your conversations will appear after an employer or candidate thread is created.',
                            icon: Icons.chat_bubble_outline,
                            actionLabel: 'Browse',
                            onPressed: () => context.go('/jobs'),
                          ),
                        ),
                      );
                    }

                    final activeExists = conversations.any(
                      (doc) => doc.id == _activeConversationId,
                    );
                    if (!activeExists) {
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (mounted) {
                          setState(
                            () =>
                                _activeConversationId = conversations.first.id,
                          );
                        }
                      });
                    }

                    return Column(
                      children: [
                        SizedBox(
                          height: 164,
                          child: ListView.separated(
                            padding: const EdgeInsets.all(12),
                            scrollDirection: Axis.horizontal,
                            itemBuilder: (context, index) {
                              final doc = conversations[index];
                              final data = doc.data();
                              final selected = doc.id == _activeConversationId;
                              return InkWell(
                                borderRadius: BorderRadius.circular(18),
                                onTap: () => setState(
                                  () => _activeConversationId = doc.id,
                                ),
                                child: Container(
                                  width: 250,
                                  padding: const EdgeInsets.all(14),
                                  decoration: selected
                                      ? AppTheme.statCard(borderRadius: 18)
                                      : AppTheme.glassCard(borderRadius: 18),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _otherName(data, user.uid),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        (data['jobTitle'] ?? '').toString(),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: AppTheme.darkTextSecondary,
                                          fontSize: 12,
                                        ),
                                      ),
                                      const Spacer(),
                                      Text(
                                        (data['lastMessage'] ??
                                                'No messages yet')
                                            .toString(),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: AppTheme.darkTextSecondary,
                                          fontSize: 12,
                                          height: 1.3,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 10),
                            itemCount: conversations.length,
                          ),
                        ),
                        Expanded(child: _buildThread(user.uid)),
                      ],
                    );
                  },
                ),
        ),
      ),
    );
  }

  Widget _buildThread(String uid) {
    final conversationId = _activeConversationId;
    if (conversationId == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        Expanded(
          child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: _messagesStream(conversationId),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              final messages = snapshot.data?.docs ?? const [];
              if (messages.isEmpty) {
                return const Center(
                  child: Text(
                    'No messages yet',
                    style: TextStyle(color: AppTheme.darkTextSecondary),
                  ),
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.fromLTRB(14, 8, 14, 14),
                itemCount: messages.length,
                itemBuilder: (context, index) {
                  final data = messages[index].data();
                  final mine = data['senderId'] == uid;
                  return Align(
                    alignment: mine
                        ? Alignment.centerRight
                        : Alignment.centerLeft,
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 320),
                      margin: const EdgeInsets.symmetric(vertical: 5),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: mine
                            ? AppTheme.brandCyan.withValues(alpha: 0.2)
                            : Colors.white.withValues(alpha: 0.08),
                        border: Border.all(
                          color: mine
                              ? AppTheme.brandCyan.withValues(alpha: 0.35)
                              : Colors.white.withValues(alpha: 0.1),
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        (data['text'] ?? '').toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          height: 1.35,
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
          decoration: BoxDecoration(
            color: AppTheme.darkBg.withValues(alpha: 0.72),
            border: const Border(top: BorderSide(color: AppTheme.darkBorder)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  minLines: 1,
                  maxLines: 4,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Type a message',
                    hintStyle: const TextStyle(
                      color: AppTheme.darkTextSecondary,
                    ),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.06),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onSubmitted: (_) => _send(uid),
                ),
              ),
              const SizedBox(width: 10),
              IconButton.filled(
                onPressed: _sending ? null : () => _send(uid),
                icon: _sending
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send_rounded),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ===== PUBLIC SCREENS =====
// HomeScreen is implemented in lib/features/public/presentation/screens/home_screen.dart

// LoginScreen is implemented in lib/features/auth/presentation/screens/login_screen.dart

// RegisterScreen is implemented in lib/features/auth/presentation/screens/register_screen.dart

// ForgotPasswordScreen is implemented in lib/features/auth/presentation/screens/forgot_password_screen.dart

class AdminLoginScreen extends StatelessWidget {
  const AdminLoginScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Login');
}

// ===== SEEKER PORTAL =====
class SeekerDashboardScreen extends StatelessWidget {
  const SeekerDashboardScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Seeker Dashboard');
}

class SeekerProfileScreen extends StatelessWidget {
  const SeekerProfileScreen({super.key});
  @override
  Widget build(BuildContext context) => const SeekerProfileEditorScreen();
}

class SeekerResumeScreen extends StatelessWidget {
  const SeekerResumeScreen({super.key});
  @override
  Widget build(BuildContext context) => const SeekerResumeManagerScreen();
}

class SeekerApplicationsScreen extends StatelessWidget {
  const SeekerApplicationsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Seeker Applications');
}

class SeekerSavedJobsScreen extends StatelessWidget {
  const SeekerSavedJobsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Seeker Saved Jobs');
}

class SeekerJobAlertsScreen extends StatelessWidget {
  const SeekerJobAlertsScreen({super.key});
  @override
  Widget build(BuildContext context) => const SeekerJobAlertsEditorScreen();
}

class SeekerInterviewsScreen extends StatelessWidget {
  const SeekerInterviewsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Seeker Interviews');
}

class SeekerMessagesScreen extends StatelessWidget {
  const SeekerMessagesScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const PortalMessagesScreen(title: 'Seeker Messages');
}

class SeekerNotificationsScreen extends StatelessWidget {
  const SeekerNotificationsScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const PortalNotificationsScreen(title: 'Seeker Notifications');
}

class SeekerRewardsScreen extends StatelessWidget {
  const SeekerRewardsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Seeker Rewards');
}

class SeekerAICoachScreen extends StatelessWidget {
  const SeekerAICoachScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Seeker AI Coach');
}

class SeekerSkillsScreen extends StatelessWidget {
  const SeekerSkillsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Seeker Skills');
}

class SeekerSubscriptionScreen extends StatelessWidget {
  const SeekerSubscriptionScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Seeker Subscription');
}

class SeekerSettingsScreen extends StatelessWidget {
  const SeekerSettingsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Seeker Settings');
}

// ===== EMPLOYER PORTAL =====
class EmployerDashboardScreen extends StatelessWidget {
  const EmployerDashboardScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Employer Dashboard');
}

class EmployerCompanyProfileScreen extends StatelessWidget {
  const EmployerCompanyProfileScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      _buildStubScreen('Employer Company Profile');
}

class EmployerPostJobScreen extends StatelessWidget {
  const EmployerPostJobScreen({super.key});
  @override
  Widget build(BuildContext context) => const EmployerPostJobWizardScreen();
}

class EmployerJobsScreen extends StatelessWidget {
  const EmployerJobsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Employer Jobs');
}

class EmployerCandidatesScreen extends StatelessWidget {
  const EmployerCandidatesScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const EmployerCandidatesPipelineScreen();
}

class EmployerTalentSearchScreen extends StatelessWidget {
  const EmployerTalentSearchScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const EmployerTalentSearchConcreteScreen();
}

class EmployerInterviewsScreen extends StatelessWidget {
  const EmployerInterviewsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Employer Interviews');
}

class EmployerLeadsScreen extends StatelessWidget {
  const EmployerLeadsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Employer Leads');
}

class EmployerReviewsScreen extends StatelessWidget {
  const EmployerReviewsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Employer Reviews');
}

class EmployerMessagesScreen extends StatelessWidget {
  const EmployerMessagesScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const PortalMessagesScreen(title: 'Employer Messages');
}

class EmployerBillingScreen extends StatelessWidget {
  const EmployerBillingScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Employer Billing');
}

class EmployerSubscriptionScreen extends StatelessWidget {
  const EmployerSubscriptionScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      _buildStubScreen('Employer Subscription');
}

class EmployerReportsScreen extends StatelessWidget {
  const EmployerReportsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Employer Reports');
}

class EmployerSettingsScreen extends StatelessWidget {
  const EmployerSettingsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Employer Settings');
}

// ===== ADMIN PORTAL =====
class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Dashboard');
}

class AdminBusinessesScreen extends StatelessWidget {
  const AdminBusinessesScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Businesses');
}

class AdminJobsScreen extends StatelessWidget {
  const AdminJobsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Jobs');
}

class AdminUsersScreen extends StatelessWidget {
  const AdminUsersScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Users');
}

class AdminLeadsScreen extends StatelessWidget {
  const AdminLeadsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Leads');
}

class AdminServicesScreen extends StatelessWidget {
  const AdminServicesScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Services');
}

class AdminSubscriptionsScreen extends StatelessWidget {
  const AdminSubscriptionsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Subscriptions');
}

class AdminAdsScreen extends StatelessWidget {
  const AdminAdsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Ads');
}

class AdminReviewsScreen extends StatelessWidget {
  const AdminReviewsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Reviews');
}

class AdminNotificationsScreen extends StatelessWidget {
  const AdminNotificationsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Notifications');
}

class AdminReportsScreen extends StatelessWidget {
  const AdminReportsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Reports');
}

class AdminSecurityScreen extends StatelessWidget {
  const AdminSecurityScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Security');
}

class AdminSettingsScreen extends StatelessWidget {
  const AdminSettingsScreen({super.key});
  @override
  Widget build(BuildContext context) => _buildStubScreen('Admin Settings');
}
