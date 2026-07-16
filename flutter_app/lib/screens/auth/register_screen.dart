import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _acceptTerms = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (!_acceptTerms) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Please accept the terms and conditions', style: GoogleFonts.inter()),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ));
      return;
    }
    ref.read(authProvider.notifier).registerWithEmail(
      _emailController.text.trim(),
      _passwordController.text.trim(),
      _nameController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        width: size.width,
        height: size.height,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF0F2FF), AppColors.background],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: GestureDetector(
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
                  ),
                  const SizedBox(height: 24),

                  Text(
                    'Create Account',
                    style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.primary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Join THENIJOBS and start your journey',
                    style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 32),

                  _label('Full Name'),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(hintText: 'Enter your full name', prefixIcon: Icon(Icons.person_outline, size: 20)),
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500),
                    validator: (val) => val == null || val.isEmpty ? 'Name is required' : null,
                  ),
                  const SizedBox(height: 18),

                  _label('Email Address'),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(hintText: 'name@example.com', prefixIcon: Icon(Icons.email_outlined, size: 20)),
                    keyboardType: TextInputType.emailAddress,
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500),
                    validator: (val) => val == null || !val.contains('@') ? 'Enter a valid email' : null,
                  ),
                  const SizedBox(height: 18),

                  _label('Password'),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _passwordController,
                    decoration: InputDecoration(
                      hintText: 'Create a strong password',
                      prefixIcon: const Icon(Icons.lock_outline, size: 20),
                      suffixIcon: IconButton(
                        icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: AppColors.textSecondary),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    obscureText: _obscurePassword,
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500),
                    validator: (val) => val == null || val.length < 6 ? 'At least 6 characters' : null,
                  ),
                  const SizedBox(height: 18),

                  _label('Confirm Password'),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _confirmPasswordController,
                    decoration: InputDecoration(
                      hintText: 'Confirm your password',
                      prefixIcon: const Icon(Icons.lock_outline, size: 20),
                      suffixIcon: IconButton(
                        icon: Icon(_obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: AppColors.textSecondary),
                        onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                      ),
                    ),
                    obscureText: _obscureConfirm,
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500),
                    validator: (val) => val != _passwordController.text ? 'Passwords do not match' : null,
                  ),
                  const SizedBox(height: 20),

                  Row(
                    children: [
                      GestureDetector(
                        onTap: () => setState(() => _acceptTerms = !_acceptTerms),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 22, height: 22,
                          decoration: BoxDecoration(
                            color: _acceptTerms ? AppColors.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: _acceptTerms ? AppColors.primary : AppColors.textTertiary, width: 2),
                          ),
                          child: _acceptTerms ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: RichText(
                          text: TextSpan(
                            style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary),
                            children: [
                              const TextSpan(text: 'I agree to the '),
                              TextSpan(text: 'Terms & Conditions', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary)),
                              const TextSpan(text: ' and '),
                              TextSpan(text: 'Privacy Policy', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  Container(
                    height: 54,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryLight]),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6))],
                    ),
                    child: ElevatedButton(
                      onPressed: state.isLoading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: state.isLoading
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                          : Text('Create Account', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                    ),
                  ),
                  const SizedBox(height: 24),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Already have an account? ', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: Text('Sign In', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Text(text, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary));
  }
}
