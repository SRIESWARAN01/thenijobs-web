import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/models/company.dart';
import 'package:thenijobs/providers/auth_provider.dart';
import 'package:thenijobs/screens/seeker/job_search_screen.dart';
import 'package:thenijobs/widgets/common/loading.dart';

final companyProfileProvider = FutureProvider<Company?>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  final user = ref.watch(authProvider).user;
  if (user == null || user.companyId == null) return Future.value(null);
  return service.getCompanyById(user.companyId!);
});

class CompanyProfileScreen extends ConsumerStatefulWidget {
  const CompanyProfileScreen({super.key});

  @override
  ConsumerState<CompanyProfileScreen> createState() => _CompanyProfileScreenState();
}

class _CompanyProfileScreenState extends ConsumerState<CompanyProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _districtController = TextEditingController();
  final _categoryController = TextEditingController();
  final _descriptionController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _districtController.dispose();
    _categoryController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _save(Company? existing) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final company = Company(
      id: user.companyId ?? 'company_${user.uid}',
      slug: _nameController.text.trim().toLowerCase().replaceAll(RegExp(r'\s+'), '-'),
      ownerId: user.uid,
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      email: user.email,
      address: _addressController.text.trim(),
      district: _districtController.text.trim(),
      category: _categoryController.text.trim(),
      description: _descriptionController.text.trim(),
      createdAt: existing?.createdAt ?? DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await ref.read(firestoreServiceProvider).saveCompanyProfile(company);
    ref.invalidate(companyProfileProvider);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Company profile saved successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final companyState = ref.watch(companyProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Company Profile'),
      ),
      body: SafeArea(
        child: companyState.when(
          data: (company) {
            if (company != null) {
              _nameController.text = company.name;
              _phoneController.text = company.phone;
              _addressController.text = company.address;
              _districtController.text = company.district;
              _categoryController.text = company.category;
              _descriptionController.text = company.description;
            }

            return SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.base),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo Placeholder
                  Center(
                    child: CircleAvatar(
                      radius: 48,
                      backgroundColor: AppColors.accentSurface,
                      child: Icon(Icons.business, size: 48, color: AppColors.accent),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),

                  // Fields
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'Company Name'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _categoryController,
                    decoration: const InputDecoration(labelText: 'Business Category'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(labelText: 'Description'),
                    maxLines: 3,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _phoneController,
                    decoration: const InputDecoration(labelText: 'Contact Phone'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _addressController,
                    decoration: const InputDecoration(labelText: 'Address'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _districtController,
                    decoration: const InputDecoration(labelText: 'District'),
                  ),
                  const SizedBox(height: AppSpacing.xl),

                  ElevatedButton(
                    onPressed: () => _save(company),
                    child: const Text('Save Company Profile'),
                  ),
                ],
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      ),
    );
  }
}
