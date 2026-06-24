// ============================================================
// THENIJOBS — Mobile Redesign: Guest mode + login gate
// ------------------------------------------------------------
// The app is fully browsable as a guest. Login is only required
// for Apply / Save / Post / Profile. `ensureLoggedIn` pops a
// premium bottom sheet (Google / Email / Phone) and resolves
// `true` once the user is authenticated — the caller then resumes
// the original action (e.g. opening the apply sheet) in place.
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';

/// Returns true if a user is (or becomes) authenticated.
Future<bool> ensureLoggedIn(
  BuildContext context,
  WidgetRef ref, {
  String reason = 'Sign in to continue',
}) async {
  final current = ref.read(authStateStreamProvider).value;
  if (current != null) return true;

  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _LoginSheet(reason: reason),
  );
  return result ?? ref.read(authStateStreamProvider).value != null;
}

class _LoginSheet extends ConsumerStatefulWidget {
  const _LoginSheet({required this.reason});
  final String reason;

  @override
  ConsumerState<_LoginSheet> createState() => _LoginSheetState();
}

enum _Mode { options, email, phone }

class _LoginSheetState extends ConsumerState<_LoginSheet> {
  _Mode _mode = _Mode.options;
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  String? _verificationId;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _phone.dispose();
    _otp.dispose();
    super.dispose();
  }

  void _close() => Navigator.of(context).pop(true);

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
      // Auth state stream will have a user once sign-in completes.
      if (mounted && ref.read(authStateStreamProvider).value != null) _close();
    } catch (e) {
      if (mounted) setState(() => _error = _clean(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _clean(Object e) {
    final s = e.toString().replaceFirst('Exception: ', '');
    return s.length > 160 ? '${s.substring(0, 160)}…' : s;
  }

  @override
  Widget build(BuildContext context) {
    // Close automatically if auth completes via an async listener (e.g. Google).
    ref.listen(authStateStreamProvider, (_, next) {
      if (next.value != null && mounted) _close();
    });

    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppX.s20,
        4,
        AppX.s20,
        AppX.s20 + bottomInset,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: AppX.brandGradient,
                  borderRadius: BorderRadius.circular(AppX.rSm),
                ),
                child: const Icon(
                  Icons.lock_open_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.reason,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Browsing stays free — sign in only to take action.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          if (_error != null) _errorBanner(_error!),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: switch (_mode) {
              _Mode.options => _options(),
              _Mode.email => _emailForm(),
              _Mode.phone => _phoneForm(),
            },
          ),
          const SizedBox(height: 8),
          const Center(
            child: Text(
              'By continuing you agree to our Terms & Privacy Policy.',
              style: TextStyle(color: AppX.textTertiary, fontSize: 11.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _errorBanner(String msg) => Container(
    width: double.infinity,
    margin: const EdgeInsets.only(bottom: 14),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: AppX.rose.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(AppX.rSm),
      border: Border.all(color: AppX.rose.withValues(alpha: 0.25)),
    ),
    child: Row(
      children: [
        const Icon(Icons.error_outline_rounded, color: AppX.rose, size: 18),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            msg,
            style: const TextStyle(color: AppX.rose, fontSize: 12.5),
          ),
        ),
      ],
    ),
  );

  Widget _options() {
    return Column(
      key: const ValueKey('options'),
      children: [
        _ProviderButton(
          icon: Icons.g_mobiledata_rounded,
          label: 'Continue with Google',
          background: Colors.white,
          foreground: AppX.textPrimary,
          bordered: true,
          busy: _busy,
          onTap: () => _run(
            () => ref.read(authNotifierProvider.notifier).signInWithGoogle(),
          ),
        ),
        const SizedBox(height: 12),
        _ProviderButton(
          icon: Icons.mail_outline_rounded,
          label: 'Continue with Email',
          background: AppX.primary,
          foreground: Colors.white,
          onTap: () => setState(() => _mode = _Mode.email),
        ),
        const SizedBox(height: 12),
        _ProviderButton(
          icon: Icons.phone_iphone_rounded,
          label: 'Continue with Phone',
          background: AppX.textPrimary,
          foreground: Colors.white,
          onTap: () => setState(() => _mode = _Mode.phone),
        ),
      ],
    );
  }

  Widget _emailForm() {
    return Column(
      key: const ValueKey('email'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            hintText: 'Email address',
            prefixIcon: Icon(Icons.mail_outline_rounded),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _password,
          obscureText: true,
          decoration: const InputDecoration(
            hintText: 'Password',
            prefixIcon: Icon(Icons.lock_outline_rounded),
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _busy
              ? null
              : () => _run(
                  () => ref
                      .read(authNotifierProvider.notifier)
                      .signIn(_email.text.trim(), _password.text),
                ),
          child: _busy
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('Sign in'),
        ),
        const SizedBox(height: 6),
        Center(child: _backButton()),
      ],
    );
  }

  Widget _phoneForm() {
    final otpStage = _verificationId != null;
    return Column(
      key: const ValueKey('phone'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _phone,
          enabled: !otpStage,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            hintText: '+91 98765 43210',
            prefixIcon: Icon(Icons.phone_iphone_rounded),
          ),
        ),
        if (otpStage) ...[
          const SizedBox(height: 12),
          TextField(
            controller: _otp,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: '6-digit OTP',
              prefixIcon: Icon(Icons.pin_rounded),
            ),
          ),
        ],
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _busy
              ? null
              : () {
                  if (!otpStage) {
                    _run(() async {
                      final id = await ref
                          .read(authNotifierProvider.notifier)
                          .sendOtp(_phone.text.trim());
                      if (mounted) setState(() => _verificationId = id);
                    });
                  } else {
                    _run(
                      () => ref
                          .read(authNotifierProvider.notifier)
                          .verifyOtp(_verificationId!, _otp.text.trim()),
                    );
                  }
                },
          child: _busy
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Text(otpStage ? 'Verify & continue' : 'Send OTP'),
        ),
        const SizedBox(height: 6),
        Center(child: _backButton()),
      ],
    );
  }

  Widget _backButton() => TextButton.icon(
    onPressed: () => setState(() {
      _mode = _Mode.options;
      _verificationId = null;
      _error = null;
    }),
    icon: const Icon(Icons.arrow_back_rounded, size: 18),
    label: const Text('Other options'),
  );
}

class _ProviderButton extends StatelessWidget {
  const _ProviderButton({
    required this.icon,
    required this.label,
    required this.background,
    required this.foreground,
    required this.onTap,
    this.bordered = false,
    this.busy = false,
  });

  final IconData icon;
  final String label;
  final Color background;
  final Color foreground;
  final VoidCallback onTap;
  final bool bordered;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      width: double.infinity,
      child: Material(
        color: background,
        borderRadius: BorderRadius.circular(AppX.rSm),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppX.rSm),
          onTap: busy ? null : onTap,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppX.rSm),
              border: bordered ? Border.all(color: AppX.border) : null,
            ),
            alignment: Alignment.center,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: foreground, size: 22),
                const SizedBox(width: 10),
                Text(
                  label,
                  style: TextStyle(
                    color: foreground,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
