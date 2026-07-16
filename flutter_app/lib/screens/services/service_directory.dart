import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/models/service.dart';

class ServiceDirectoryScreen extends StatelessWidget {
  const ServiceDirectoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Stub local services database list
    final services = [
      Service(
        id: 's1',
        providerId: 'p1',
        providerName: 'Theni Plumbers Association',
        name: 'Emergency Plumbing Repair',
        category: 'Plumbing',
        description: 'Professional emergency leak repairs, pipe fitting, and tap replacements.',
        pricing: '₹350 / hour',
        district: 'Theni',
        status: 'active',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      Service(
        id: 's2',
        providerId: 'p2',
        providerName: 'Devi Electrical Works',
        name: 'Household Rewiring & Installations',
        category: 'Electrical',
        description: 'Complete home electrical rewiring, fan/light fittings, and switch repairs.',
        pricing: '₹400 / visit',
        district: 'Theni',
        status: 'active',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Local Services'),
      ),
      body: SafeArea(
        child: ListView.builder(
          padding: const EdgeInsets.all(AppSpacing.base),
          itemCount: services.length,
          itemBuilder: (context, index) {
            final service = services[index];
            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8),
              child: InkWell(
                onTap: () {
                  context.push('/services/${service.id}', extra: service);
                },
                borderRadius: AppRadius.cardRadius,
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.base),
                  child: Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: AppColors.primarySurface,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.build_outlined, color: AppColors.primary),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              service.name,
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              service.providerName,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              service.pricing ?? 'Call for Quote',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
