import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/models/service.dart';

class ServiceDetailScreen extends StatelessWidget {
  final String serviceId;
  final Service? service;
  const ServiceDetailScreen({super.key, required this.serviceId, this.service});

  @override
  Widget build(BuildContext context) {
    if (service == null) {
      return const Scaffold(body: Center(child: Text('Service not found')));
    }

    final s = service!;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Service Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.xl),
              decoration: BoxDecoration(
                color: AppColors.primarySurface,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Icon(Icons.build_outlined, size: 64, color: AppColors.primary),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    s.name,
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    s.providerName,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Pricing',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              s.pricing ?? 'Quote requested',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Description',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              s.description,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
            ),
            const SizedBox(height: AppSpacing.xxl),
            ElevatedButton(
              onPressed: () {
                context.push('/services/booking', extra: s);
              },
              child: const Text('Book Appointment'),
            ),
          ],
        ),
      ),
    );
  }
}
