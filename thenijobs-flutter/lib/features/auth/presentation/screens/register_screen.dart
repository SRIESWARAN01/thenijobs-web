// ============================================================
// THENIJOBS — Registration Screen
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/core/utils/validators.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/shared/widgets/glass_container.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  int _step = 1;
  String _selectedRole = '';

  // Form Field Controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // Predefined role configurations matching TS
  final List<Map<String, dynamic>> _roles = [
    {
      'id': 'job_seeker',
      'label': 'Job Seeker',
      'subLabel': 'வேலை தேடுகிறேன்',
      'desc': 'Find jobs, build resume, track applications',
      'icon': Icons.work_outline,
      'color': Colors.deepPurple,
    },
    {
      'id': 'employer',
      'label': 'Employer / HR',
      'subLabel': 'ஆட்களை எடுக்கிறேன்',
      'desc': 'Post jobs, search candidates, hire talent',
      'icon': Icons.business_outlined,
      'color': Colors.cyan,
    },
    {
      'id': 'business_owner',
      'label': 'Business Owner',
      'subLabel': 'Business வைத்திருக்கிறேன்',
      'desc': 'List your business, get leads & enquiries',
      'icon': Icons.people_outline,
      'color': TailwindColors.emerald,
    },
  ];

  // Navigate to Step 2 or create account
  Future<void> _handleNext() async {
    ref.read(authNotifierProvider.notifier).clearError();

    if (_step == 1) {
      if (_selectedRole.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select a role to continue')),
        );
        return;
      }
      setState(() => _step = 2);
    } else {
      if (!_formKey.currentState!.validate()) return;

      try {
        await ref
            .read(authNotifierProvider.notifier)
            .register(
              email: _emailController.text.trim(),
              password: _passwordController.text,
              displayName: _nameController.text.trim(),
              role: _selectedRole,
              phone: _phoneController.text.trim().isNotEmpty
                  ? '+91${_phoneController.text.trim()}'
                  : null,
            );
      } catch (_) {
        // Notifier handles storing error message
      }
    }
  }

  // Handle Google signup
  Future<void> _handleGoogleRegister() async {
    try {
      await ref.read(authNotifierProvider.notifier).signInWithGoogle();
    } catch (_) {
      // Notifier handles error
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      body: Stack(
        children: [
          // Background layout glow
          Positioned(
            top: -200,
            left: -100,
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryPurple.withValues(alpha: 0.12),
              ),
            ),
          ),
          Positioned(
            bottom: -200,
            right: -100,
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.brandCyan.withValues(alpha: 0.08),
              ),
            ),
          ),

          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.work,
                        size: 28,
                        color: AppTheme.primaryPurple,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'THE',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Colors.white.withValues(alpha: 0.7),
                        ),
                      ),
                      const Text(
                        'NIJOBS',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.brandCyan,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Glassmorphic Register Card
                  GlassContainer(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Progress Bar indicators
                          Row(
                            children: [
                              _buildProgressIndicator(1, _step >= 1),
                              Expanded(
                                child: Divider(
                                  color: _step > 1
                                      ? TailwindColors.emerald
                                      : Colors.white10,
                                  thickness: 2,
                                ),
                              ),
                              _buildProgressIndicator(2, _step >= 2),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // Display auth error if active
                          if (authState.errorMessage != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.brandRose.withValues(
                                  alpha: 0.1,
                                ),
                                border: Border.all(
                                  color: AppTheme.brandRose.withValues(
                                    alpha: 0.2,
                                  ),
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.error_outline,
                                    size: 16,
                                    color: AppTheme.brandRose,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      authState.errorMessage!,
                                      style: const TextStyle(
                                        color: Color(0xFFFCA5A5),
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],

                          if (_step == 1) ...[
                            // STEP 1: Role Selection
                            const Text(
                              'I am a...',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Select your role to get a personalised experience',
                              style: TextStyle(
                                color: AppTheme.darkTextSecondary,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 20),

                            Column(
                              children: _roles.map((r) {
                                final isSelected = _selectedRole == r['id'];
                                return GestureDetector(
                                  onTap: () =>
                                      setState(() => _selectedRole = r['id']),
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? (r['color'] as Color).withValues(
                                              alpha: 0.1,
                                            )
                                          : Colors.white.withValues(
                                              alpha: 0.02,
                                            ),
                                      border: Border.all(
                                        color: isSelected
                                            ? r['color']
                                            : Colors.white.withValues(
                                                alpha: 0.1,
                                              ),
                                        width: 1,
                                      ),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 44,
                                          height: 44,
                                          decoration: BoxDecoration(
                                            color: isSelected
                                                ? (r['color'] as Color)
                                                      .withValues(alpha: 0.2)
                                                : Colors.white.withValues(
                                                    alpha: 0.04,
                                                  ),
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                          ),
                                          child: Icon(
                                            r['icon'],
                                            color: isSelected
                                                ? r['color']
                                                : Colors.grey,
                                            size: 20,
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                r['label'],
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
                                                ),
                                              ),
                                              Text(
                                                r['subLabel'],
                                                style: const TextStyle(
                                                  color: AppTheme
                                                      .darkTextSecondary,
                                                  fontSize: 11,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                r['desc'],
                                                style: TextStyle(
                                                  color: Colors.white
                                                      .withValues(alpha: 0.4),
                                                  fontSize: 10,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (isSelected)
                                          Icon(
                                            Icons.check_circle_rounded,
                                            color: r['color'],
                                            size: 20,
                                          ),
                                      ],
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ] else ...[
                            // STEP 2: Basic details
                            const Text(
                              'Create Account',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Fill in your basic details',
                              style: TextStyle(
                                color: AppTheme.darkTextSecondary,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Full Name
                            const Text(
                              'Full Name *',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppTheme.darkTextSecondary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _nameController,
                              validator: (val) =>
                                  Validators.validateRequired(val, 'Full Name'),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                              decoration: _inputDecoration(
                                hint: 'Your full name',
                                prefixIcon: Icons.person_outline,
                              ),
                            ),
                            const SizedBox(height: 12),

                            // Mobile Number
                            const Text(
                              'Mobile Number',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppTheme.darkTextSecondary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  width: 64,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.04),
                                    border: Border.all(
                                      color: Colors.white.withValues(
                                        alpha: 0.1,
                                      ),
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Text(
                                    '+91',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: AppTheme.darkTextSecondary,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextFormField(
                                    controller: _phoneController,
                                    keyboardType: TextInputType.phone,
                                    maxLength: 10,
                                    validator: (val) =>
                                        val != null && val.isNotEmpty
                                        ? Validators.validatePhone(val)
                                        : null,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                    ),
                                    decoration: _inputDecoration(
                                      hint: '98765 43210',
                                      prefixIcon: Icons.phone_android_outlined,
                                    ).copyWith(counterText: ''),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // Email Address
                            const Text(
                              'Email Address *',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppTheme.darkTextSecondary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              validator: Validators.validateEmail,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                              decoration: _inputDecoration(
                                hint: 'your@email.com',
                                prefixIcon: Icons.mail_outline,
                              ),
                            ),
                            const SizedBox(height: 12),

                            // Password
                            const Text(
                              'Password *',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppTheme.darkTextSecondary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _passwordController,
                              obscureText: true,
                              validator: Validators.validatePassword,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                              decoration: _inputDecoration(
                                hint: 'Min. 6 characters',
                                prefixIcon: Icons.lock_outline,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Google Registration
                            const Row(
                              children: [
                                Expanded(child: Divider(color: Colors.white10)),
                                Padding(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: 12.0,
                                  ),
                                  child: Text(
                                    'or',
                                    style: TextStyle(
                                      color: Colors.grey,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                Expanded(child: Divider(color: Colors.white10)),
                              ],
                            ),
                            const SizedBox(height: 12),

                            OutlinedButton(
                              onPressed: authState.isLoading
                                  ? null
                                  : _handleGoogleRegister,
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(
                                  color: Colors.white.withValues(alpha: 0.12),
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(
                                    Icons.g_mobiledata_rounded,
                                    size: 24,
                                    color: Colors.white,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Continue with Google',
                                    style: TextStyle(
                                      color: Colors.white.withValues(
                                        alpha: 0.9,
                                      ),
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 24),

                          // Navigation buttons
                          Row(
                            children: [
                              if (_step > 1) ...[
                                Expanded(
                                  flex: 1,
                                  child: OutlinedButton(
                                    onPressed: () => setState(() => _step = 1),
                                    style: OutlinedButton.styleFrom(
                                      side: BorderSide(
                                        color: Colors.white.withValues(
                                          alpha: 0.15,
                                        ),
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                    ),
                                    child: const Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.arrow_back,
                                          size: 16,
                                          color: Colors.white,
                                        ),
                                        SizedBox(width: 6),
                                        Text(
                                          'Back',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                              ],
                              Expanded(
                                flex: 2,
                                child: Container(
                                  height: 48,
                                  decoration: BoxDecoration(
                                    gradient: AppTheme.brandGradient,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: ElevatedButton(
                                    onPressed: authState.isLoading
                                        ? null
                                        : _handleNext,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    child: authState.isLoading
                                        ? const SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Colors.white,
                                            ),
                                          )
                                        : Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                _step == 2
                                                    ? 'Create Account'
                                                    : 'Continue',
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              const Icon(
                                                Icons.arrow_forward,
                                                size: 16,
                                                color: Colors.white,
                                              ),
                                            ],
                                          ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Footer Redirect
                  if (_step == 1)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Already have an account? ',
                          style: TextStyle(
                            color: AppTheme.darkTextSecondary,
                            fontSize: 13,
                          ),
                        ),
                        GestureDetector(
                          onTap: () => context.push('/login'),
                          child: const Text(
                            'Sign In',
                            style: TextStyle(
                              color: AppTheme.brandCyan,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator(int stepNum, bool active) {
    final isDone = _step > stepNum;
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: isDone
            ? TailwindColors.emerald
            : active
            ? AppTheme.primaryPurple
            : Colors.white.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: isDone
            ? const Icon(Icons.check, size: 14, color: Colors.white)
            : Text(
                '$stepNum',
                style: TextStyle(
                  color: active ? Colors.white : AppTheme.darkTextSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData prefixIcon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        color: Colors.white.withValues(alpha: 0.3),
        fontSize: 13,
      ),
      prefixIcon: Icon(prefixIcon, size: 16, color: Colors.grey),
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.04),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.primaryPurple, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: AppTheme.brandRose.withValues(alpha: 0.5),
        ),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.brandRose, width: 1.5),
      ),
      errorStyle: const TextStyle(fontSize: 10, color: AppTheme.brandRose),
    );
  }
}
