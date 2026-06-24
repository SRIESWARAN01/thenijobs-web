// ============================================================
// THENIJOBS — Pricing Plans Screen
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/public/presentation/widgets/home_footer.dart';
import 'package:thenijobs/shared/widgets/floating_whatsapp.dart';
import 'package:url_launcher/url_launcher.dart';

class PricingScreen extends ConsumerStatefulWidget {
  const PricingScreen({super.key});

  @override
  ConsumerState<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends ConsumerState<PricingScreen> {
  bool _annualBilling = false;
  int? _expandedFaqIndex;

  final List<Map<String, dynamic>> _plans = [
    {
      'name': 'Free Plan',
      'slug': 'free',
      'icon': '🆓',
      'price': 0,
      'period': 'Forever',
      'description': 'Perfect to get started',
      'color': Colors.grey,
      'popular': false,
      'cta': 'Get Started Free',
      'features': [
        'Company Registration',
        '1 Company Profile Submission',
        'Business Directory Application',
        'WhatsApp Contact',
        'Basic Company Profile',
        'Pending Admin Approval',
      ],
      'notIncluded': [
        'Featured Listing',
        'Premium Badge',
        'Job Posting',
        'Analytics Dashboard',
      ],
      'note':
          'Company profile will NOT be visible publicly until approved by Admin.',
      'bestFor': 'Getting started',
    },
    {
      'name': 'Basic Plan',
      'slug': 'basic',
      'icon': '⭐',
      'price': 40,
      'period': 'Month',
      'description': 'For small businesses and startups',
      'color': Colors.cyan,
      'popular': false,
      'cta': 'Start Basic',
      'features': [
        'Verified Company Profile',
        'Up to 3 Job Postings / Month',
        'Business Directory Listing',
        'WhatsApp Button',
        'Call Button',
        'Company Gallery (Up to 5 Photos)',
        'Priority Approval',
        'Basic Analytics',
        'Customer Enquiry Form',
      ],
      'notIncluded': [
        'Premium Badge',
        'Featured Listing',
        'Lead Dashboard',
        'Social Media Links',
      ],
      'bestFor': 'Small businesses and startups',
    },
    {
      'name': 'Premium Plan',
      'slug': 'premium',
      'icon': '👑',
      'price': 100,
      'period': 'Month',
      'description': 'For growing businesses and recruiters',
      'color': AppTheme.primaryPurple,
      'popular': true,
      'cta': 'Go Premium',
      'features': [
        'Everything in Basic +',
        'Up to 15 Job Postings / Month',
        'Premium Badge',
        'Featured Business Listing',
        'Priority Search Placement',
        'Advanced Analytics',
        'Unlimited Gallery Photos',
        'Urgent Job Badge',
        'Lead Management Dashboard',
        'Social Media Links',
      ],
      'notIncluded': [],
      'bestFor': 'Growing businesses and recruiters',
    },
    {
      'name': 'Enterprise Plan',
      'slug': 'enterprise',
      'icon': '🏢',
      'price': 190,
      'period': 'Month',
      'description': 'For large businesses and agencies',
      'color': Colors.amber,
      'popular': false,
      'cta': 'Contact Sales',
      'features': [
        'Everything in Premium +',
        'Unlimited Job Postings',
        'Multiple Branch Profiles',
        'Dedicated Support',
        'Advanced Lead Tracking',
        'Business Performance Reports',
        'Homepage Featured Placement',
        'Supplier & Service Marketplace Access',
        'Franchise/Branch Management',
        'Custom Business URL',
      ],
      'notIncluded': [],
      'bestFor': 'Large businesses, agencies, and multi-branch companies',
    },
  ];

  final List<Map<String, String>> _faqs = [
    {
      'q': 'Can I switch plans anytime?',
      'a':
          'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
    },
    {
      'q': 'Is there a refund policy?',
      'a':
          'We offer a 7-day money-back guarantee on all paid plans. No questions asked.',
    },
    {
      'q': 'What payment methods do you accept?',
      'a':
          'We accept UPI, Debit/Credit cards, Net Banking, and popular wallets via Razorpay.',
    },
    {
      'q': 'Do I need a GST number?',
      'a':
          'GST number is optional but recommended for business verification badge.',
    },
    {
      'q': 'How does the approval process work?',
      'a':
          'After registration, our admin team reviews your company profile within 24-48 hours. Paid plans get priority approval.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBg,
      appBar: AppBar(
        title: const Text('Pricing Plans'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 1,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header area
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryPurple.withValues(alpha: 0.08),
                        border: Border.all(
                          color: AppTheme.primaryPurple.withValues(alpha: 0.2),
                        ),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.bolt,
                            color: AppTheme.primaryPurple,
                            size: 12,
                          ),
                          SizedBox(width: 6),
                          Text(
                            'CHOOSE YOUR GROWTH PLAN',
                            style: TextStyle(
                              color: AppTheme.primaryPurple,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Simple, Transparent Pricing',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Join businesses, employers, and service providers on THENIJOBS. Start free and grow at your own pace.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: TailwindColors.slate.shade500,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Billing Switch
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Monthly',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: !_annualBilling
                                ? const Color(0xFF0F172A)
                                : Colors.grey,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Switch.adaptive(
                          value: _annualBilling,
                          activeThumbColor: AppTheme.primaryPurple,
                          activeTrackColor: AppTheme.primaryPurple.withValues(
                            alpha: 0.35,
                          ),
                          onChanged: (val) {
                            setState(() => _annualBilling = val);
                          },
                        ),
                        const SizedBox(width: 8),
                        Row(
                          children: [
                            Text(
                              'Annual',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: _annualBilling
                                    ? const Color(0xFF0F172A)
                                    : Colors.grey,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: TailwindColors.emerald.shade50,
                                border: Border.all(
                                  color: TailwindColors.emerald.shade200,
                                ),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Save 20%',
                                style: TextStyle(
                                  color: AppTheme.brandEmerald,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Plans list
              Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 1100),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: _plans.map((plan) {
                      final popular = plan['popular'] as bool;
                      final basePrice = plan['price'] as int;
                      final price = _annualBilling && basePrice > 0
                          ? (basePrice * 0.8).round()
                          : basePrice;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: popular
                                ? AppTheme.primaryPurple.withValues(alpha: 0.5)
                                : TailwindColors.slate.shade200,
                            width: popular ? 2 : 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: popular
                                  ? AppTheme.primaryPurple.withValues(
                                      alpha: 0.04,
                                    )
                                  : Colors.black.withValues(alpha: 0.01),
                              blurRadius: 16,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (popular) ...[
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryPurple,
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: const Text(
                                    'MOST POPULAR',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 8,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ],

                            // Header details
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Row(
                                    children: [
                                      Text(
                                        plan['icon'] as String,
                                        style: const TextStyle(fontSize: 24),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          plan['name'] as String,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontFamily: 'Outfit',
                                            fontSize: 16,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.baseline,
                                      textBaseline: TextBaseline.alphabetic,
                                      children: [
                                        const Text(
                                          '₹',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Text(
                                          '$price',
                                          style: const TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Text(
                                          ' / ${plan['price'] == 0 ? "Forever" : plan['period']}',
                                          style: const TextStyle(
                                            fontSize: 10,
                                            color: Colors.grey,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (_annualBilling && basePrice > 0)
                                      Text(
                                        'Save ₹${(basePrice - price) * 12}/year',
                                        style: const TextStyle(
                                          color: AppTheme.brandEmerald,
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              plan['description'] as String,
                              style: const TextStyle(
                                fontSize: 11,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Note
                            if (plan['note'] != null) ...[
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.amber.shade50,
                                  border: Border.all(
                                    color: Colors.amber.shade200,
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  plan['note'] as String,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.amber.shade900,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],

                            // Features list
                            const Text(
                              'Plan Features',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Column(
                              children: (plan['features'] as List<String>).map((
                                feat,
                              ) {
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 6.0),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.check_circle,
                                        color: Colors.teal,
                                        size: 14,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          feat,
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: Color(0xFF1E293B),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),

                            // Excluded features list
                            if ((plan['notIncluded'] as List<String>)
                                .isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Column(
                                children: (plan['notIncluded'] as List<String>)
                                    .map((feat) {
                                      return Padding(
                                        padding: const EdgeInsets.only(
                                          bottom: 6.0,
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(
                                              Icons.cancel,
                                              color: Colors.grey.shade300,
                                              size: 14,
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                feat,
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: Colors.grey.shade400,
                                                  decoration: TextDecoration
                                                      .lineThrough,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    })
                                    .toList(),
                              ),
                            ],
                            const SizedBox(height: 16),

                            // Best For tag
                            Text(
                              'Best For: ${plan['bestFor']}',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.grey.shade500,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // CTA button
                            ElevatedButton(
                              onPressed: () {
                                if (plan['slug'] == 'enterprise') {
                                  // Contact support
                                  final Uri telUri = Uri.parse(
                                    'tel:919876543210',
                                  );
                                  launchUrl(telUri);
                                } else {
                                  // Go to registration or billing
                                  context.push('/company/register');
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: popular
                                    ? AppTheme.primaryPurple
                                    : const Color(0xFF0F172A),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    plan['cta'] as String,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Icon(Icons.arrow_forward, size: 14),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),

              // All Plans Inclusions Summary Card
              Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 1100),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: TailwindColors.slate.shade200),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'All Plans Include',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 12),
                        GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          // Stack into a single column on very narrow phones so
                          // longer feature labels never overflow their cell.
                          crossAxisCount:
                              MediaQuery.of(context).size.width < 380 ? 1 : 2,
                          childAspectRatio:
                              MediaQuery.of(context).size.width < 380 ? 6.5 : 4,
                          children:
                              [
                                'Company Registration',
                                'Admin Review Process',
                                'WhatsApp Support',
                                'SSL Security',
                                'Mobile Responsive',
                                'SEO Optimization',
                                'Tamil & English Support',
                                'Data Backup',
                              ].map((feat) {
                                return Row(
                                  children: [
                                    const Icon(
                                      Icons.check,
                                      color: Colors.teal,
                                      size: 14,
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        feat,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              }).toList(),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // FAQs accordion
              Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 700),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      const Text(
                        'Frequently Asked Questions',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _faqs.length,
                        itemBuilder: (context, index) {
                          final faq = _faqs[index];
                          final isExpanded = _expandedFaqIndex == index;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: TailwindColors.slate.shade200,
                              ),
                            ),
                            child: ExpansionTile(
                              title: Text(
                                faq['q']!,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              initiallyExpanded: isExpanded,
                              trailing: Icon(
                                isExpanded
                                    ? Icons.keyboard_arrow_up
                                    : Icons.keyboard_arrow_down,
                                color: Colors.grey,
                              ),
                              onExpansionChanged: (expanded) {
                                setState(() {
                                  _expandedFaqIndex = expanded ? index : null;
                                });
                              },
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(
                                    left: 16.0,
                                    right: 16.0,
                                    bottom: 16.0,
                                  ),
                                  child: Text(
                                    faq['a']!,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: TailwindColors.slate.shade600,
                                      height: 1.4,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
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
      floatingActionButton: const FloatingWhatsApp(),
    );
  }
}
