import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class ServicesScreen extends ConsumerWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mockServices = [
      _MockService('Electrician', 'Home Services', Icons.electrical_services, 4.7, '₹200/hr', 24),
      _MockService('Plumber', 'Home Services', Icons.plumbing, 4.5, '₹250/hr', 18),
      _MockService('AC Repair', 'Appliances', Icons.ac_unit, 4.8, '₹500/visit', 12),
      _MockService('House Cleaning', 'Cleaning', Icons.cleaning_services, 4.6, '₹350/visit', 31),
      _MockService('Painting', 'Home Services', Icons.format_paint, 4.4, '₹400/day', 8),
      _MockService('Carpenter', 'Furniture', Icons.handyman, 4.3, '₹300/hr', 15),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded, size: 16),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text('Services', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.filter_list_rounded, size: 20, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Search
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search services...',
                  prefixIcon: const Icon(Icons.search_rounded, size: 22, color: AppColors.textTertiary),
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.border)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
                style: GoogleFonts.inter(fontSize: 14),
              ),
            ),
            const SizedBox(height: 18),

            // Service List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                itemCount: mockServices.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) {
                  final service = mockServices[i];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 4))],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 56, height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.primarySurface,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(service.icon, color: AppColors.primary, size: 26),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(service.name, style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 3),
                              Text(service.category, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary)),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Icon(Icons.star_rounded, size: 14, color: Colors.amber.shade700),
                                  const SizedBox(width: 3),
                                  Text('${service.rating}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                                  const SizedBox(width: 8),
                                  Text('${service.providers} providers', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(service.price, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary)),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryLight]),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text('Book', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MockService {
  final String name, category, price;
  final IconData icon;
  final double rating;
  final int providers;
  _MockService(this.name, this.category, this.icon, this.rating, this.price, this.providers);
}
