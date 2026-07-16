import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class PostJobScreen extends ConsumerStatefulWidget {
  const PostJobScreen({super.key});

  @override
  ConsumerState<PostJobScreen> createState() => _PostJobScreenState();
}

class _PostJobScreenState extends ConsumerState<PostJobScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _salaryMinController = TextEditingController();
  final _salaryMaxController = TextEditingController();
  final _locationController = TextEditingController();
  String _selectedJobType = 'Full Time';
  String _selectedCategory = 'IT & Software';
  int _currentStep = 0;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _salaryMinController.dispose();
    _salaryMaxController.dispose();
    _locationController.dispose();
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
                      child: const Icon(Icons.close_rounded, size: 18),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text('Post a Job', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.accentSurface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Step ${_currentStep + 1}/3',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.accent),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Progress Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: List.generate(3, (i) {
                  return Expanded(
                    child: Container(
                      height: 4,
                      margin: EdgeInsets.only(right: i < 2 ? 6 : 0),
                      decoration: BoxDecoration(
                        color: i <= _currentStep ? AppColors.accent : AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 24),

            // Form
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _label('Job Title'),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _titleController,
                        decoration: const InputDecoration(
                          hintText: 'e.g. Flutter Developer',
                          prefixIcon: Icon(Icons.work_outline, size: 20),
                        ),
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500),
                        validator: (val) => val == null || val.isEmpty ? 'Job title required' : null,
                      ),
                      const SizedBox(height: 20),

                      _label('Category'),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedCategory,
                            isExpanded: true,
                            icon: const Icon(Icons.keyboard_arrow_down, color: AppColors.textSecondary),
                            items: ['IT & Software', 'Sales & Marketing', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Others']
                                .map((v) => DropdownMenuItem(value: v, child: Text(v, style: GoogleFonts.inter(fontSize: 14))))
                                .toList(),
                            onChanged: (val) => setState(() => _selectedCategory = val!),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      _label('Job Type'),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: ['Full Time', 'Part Time', 'Contract', 'Internship'].map((type) {
                          final isSelected = _selectedJobType == type;
                          return GestureDetector(
                            onTap: () => setState(() => _selectedJobType = type),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.accent : AppColors.surface,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: isSelected ? AppColors.accent : AppColors.border),
                              ),
                              child: Text(
                                type,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isSelected ? Colors.white : AppColors.textSecondary,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 20),

                      _label('Location'),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _locationController,
                        decoration: const InputDecoration(
                          hintText: 'e.g. Theni, Tamil Nadu',
                          prefixIcon: Icon(Icons.location_on_outlined, size: 20),
                        ),
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 20),

                      _label('Salary Range (₹ per month)'),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _salaryMinController,
                              decoration: const InputDecoration(hintText: 'Min'),
                              keyboardType: TextInputType.number,
                              style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text('to', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
                          ),
                          Expanded(
                            child: TextFormField(
                              controller: _salaryMaxController,
                              decoration: const InputDecoration(hintText: 'Max'),
                              keyboardType: TextInputType.number,
                              style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      _label('Job Description'),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _descController,
                        maxLines: 5,
                        decoration: const InputDecoration(hintText: 'Describe the role, responsibilities, and requirements...'),
                        style: GoogleFonts.inter(fontSize: 14, height: 1.5),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ),

            // Bottom Submit
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, -4))],
              ),
              child: Container(
                width: double.infinity,
                height: 54,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.accentDark, AppColors.accent]),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: AppColors.accent.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6))],
                ),
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text('Publish Job', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Text(text, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary));
  }
}
