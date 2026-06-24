// ============================================================
// THENIJOBS — CategoriesSection Widget
// ============================================================

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_theme.dart';

class CategoriesSection extends StatelessWidget {
  const CategoriesSection({super.key});

  // Predefined category data mapping exactly to Next.js
  final List<Map<String, dynamic>> _categories = const [
    {
      'label': 'Agriculture',
      'tamil': 'விவசாயம்',
      'href': '/businesses?category=Agriculture',
      'count': 340,
      'bgColor': Color(0xFFECFDF5), // emerald-50
      'iconColor': Color(0xFF047857), // emerald-700
      'icon': Icons.eco_outlined,
    },
    {
      'label': 'Construction',
      'tamil': 'கட்டிடம்',
      'href': '/businesses?category=Construction',
      'count': 210,
      'bgColor': Color(0xFFFFFBEB), // amber-50
      'iconColor': Color(0xFFB45309), // amber-700
      'icon': Icons.business_outlined,
    },
    {
      'label': 'IT & Software',
      'tamil': 'IT',
      'href': '/businesses?category=IT & Software',
      'count': 185,
      'bgColor': Color(0xFFEFF6FF), // blue-50
      'iconColor': Color(0xFF1D4ED8), // blue-700
      'icon': Icons.laptop_chromebook_outlined,
    },
    {
      'label': 'Healthcare',
      'tamil': 'மருத்துவம்',
      'href': '/businesses?category=Healthcare',
      'count': 290,
      'bgColor': Color(0xFFFFF1F2), // rose-50
      'iconColor': Color(0xFFBE123C), // rose-700
      'icon': Icons.favorite_outline,
    },
    {
      'label': 'Education',
      'tamil': 'கல்வி',
      'href': '/businesses?category=Education',
      'count': 175,
      'bgColor': Color(0xFFECFEFF), // cyan-50
      'iconColor': Color(0xFF0E7490), // cyan-700
      'icon': Icons.school_outlined,
    },
    {
      'label': 'Textiles',
      'tamil': 'Textiles',
      'href': '/businesses?category=Textiles',
      'count': 260,
      'bgColor': Color(0xFFFDF4FF), // fuchsia-50
      'iconColor': Color(0xFFA21CAF), // fuchsia-700
      'icon': Icons.inventory_2_outlined,
    },
    {
      'label': 'Manufacturing',
      'tamil': 'தொழிற்சாலை',
      'href': '/businesses?category=Manufacturing',
      'count': 310,
      'bgColor': Color(0xFFFFF7ED), // orange-50
      'iconColor': Color(0xFFC2410C), // orange-700
      'icon': Icons.build_outlined,
    },
    {
      'label': 'Retail',
      'tamil': 'கடை',
      'href': '/businesses?category=Retail',
      'count': 145,
      'bgColor': Color(0xFFF7FEE7), // lime-50
      'iconColor': Color(0xFF4D7C0F), // lime-700
      'icon': Icons.storefront_outlined,
    },
    {
      'label': 'Transport',
      'tamil': 'Transport',
      'href': '/businesses?category=Transportation',
      'count': 190,
      'bgColor': Color(0xFFF0F9FF), // sky-50
      'iconColor': Color(0xFF0369A1), // sky-700
      'icon': Icons.local_shipping_outlined,
    },
    {
      'label': 'Finance',
      'tamil': 'Finance',
      'href': '/businesses?category=Finance',
      'count': 120,
      'bgColor': Color(0xFFFEF08A), // yellow-100/50
      'iconColor': Color(0xFF854D0E), // yellow-800
      'icon': Icons.account_balance_outlined,
    },
    {
      'label': 'Services',
      'tamil': 'சேவைகள்',
      'href': '/services',
      'count': 430,
      'bgColor': Color(0xFFF1F5F9), // slate-100
      'iconColor': Color(0xFF334155), // slate-700
      'icon': Icons.work_outline,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 768;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'BROWSE CATEGORIES',
                          style: TextStyle(
                            color: Colors.teal,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Jobs + Businesses by industry',
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Theni local market-க்கு முக்கியமான categories. Mobile-ல் swipe இல்லாமல் scan பண்ண easy.',
                          style: TextStyle(
                            color: TailwindColors.slate.shade500,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Categories Grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: isWide ? 6 : 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: isWide ? 1.0 : 1.1,
                ),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  return InkWell(
                    onTap: () => context.push(cat['href'] as String),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: TailwindColors.slate.shade200,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Icon Container
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: cat['bgColor'] as Color,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              cat['icon'] as IconData,
                              size: 18,
                              color: cat['iconColor'] as Color,
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Text Info
                          Text(
                            cat['label'] as String,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            cat['tamil'] as String,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 10,
                              color: TailwindColors.slate.shade500,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${cat['count']} listings',
                            style: const TextStyle(
                              fontSize: 10,
                              color: Colors.teal,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
