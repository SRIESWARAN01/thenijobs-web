import 'dart:async';

import 'package:flutter/material.dart';

class PremiumSplash extends StatefulWidget {
  const PremiumSplash({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 3000),
  });

  final Widget child;
  final Duration duration;

  @override
  State<PremiumSplash> createState() => _PremiumSplashState();
}

class _PremiumSplashState extends State<PremiumSplash>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;
  late final Animation<double> _scale;
  late final Animation<double> _ripple;
  Timer? _timer;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..forward();
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
    _scale = Tween<double>(
      begin: 0.85,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));
    _ripple = CurvedAnimation(parent: _controller, curve: Curves.easeIn);

    _timer = Timer(widget.duration, () {
      if (mounted) {
        setState(() => _done = true);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        widget.child,
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 500),
          switchOutCurve: Curves.easeInOutCubic,
          child: _done
              ? const SizedBox.shrink()
              : _SplashSurface(fade: _fade, scale: _scale, ripple: _ripple, controller: _controller),
        ),
      ],
    );
  }
}

class RipplePainter extends CustomPainter {
  RipplePainter(this.animationValue);
  final double animationValue;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    
    // Pulse 1 (Vibrant Rose-Pink ripple)
    final paint1 = Paint()
      ..color = const Color(0xFFF43F5E).withValues(alpha: (1.0 - animationValue).clamp(0.0, 0.45))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    final radius1 = (size.width / 2) * (1.0 + animationValue * 0.9);
    canvas.drawCircle(center, radius1, paint1);

    // Pulse 2 (Deep Violet-Purple ripple)
    final paint2 = Paint()
      ..color = const Color(0xFF7C3AED).withValues(alpha: ((1.0 - animationValue) * 0.25).clamp(0.0, 0.25))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    final radius2 = (size.width / 2) * (1.0 + animationValue * 1.6);
    canvas.drawCircle(center, radius2, paint2);
  }

  @override
  bool shouldRepaint(covariant RipplePainter oldDelegate) {
    return oldDelegate.animationValue != animationValue;
  }
}

class _SplashSurface extends StatelessWidget {
  const _SplashSurface({
    required this.fade,
    required this.scale,
    required this.ripple,
    required this.controller,
  });

  final Animation<double> fade;
  final Animation<double> scale;
  final Animation<double> ripple;
  final AnimationController controller;

  @override
  Widget build(BuildContext context) {
    return Material(
      key: const ValueKey('premium-splash'),
      color: const Color(0xFF050816),
      child: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF050816),
              Color(0xFF111827),
              Color(0xFF052E2B),
            ],
          ),
        ),
        child: FadeTransition(
          opacity: fade,
          child: ScaleTransition(
            scale: scale,
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 320),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          AnimatedBuilder(
                            animation: ripple,
                            builder: (context, _) {
                              return CustomPaint(
                                painter: RipplePainter(ripple.value),
                                child: const SizedBox(width: 170, height: 170),
                              );
                            },
                          ),
                          RotationTransition(
                            turns: controller,
                            child: const SizedBox(
                              width: 148,
                              height: 148,
                              child: CircularProgressIndicator(
                                strokeWidth: 3,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Color(0xFF34D399),
                                ),
                                backgroundColor: Color(0x227C3AED),
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(2.5),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [
                                  Color(0xFFF43F5E), // Rose Orange-Pink
                                  Color(0xFFD946EF), // Fuchsia
                                  Color(0xFF7C3AED), // Purple
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(29),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x6634D399),
                                  blurRadius: 42,
                                  spreadRadius: 2,
                                ),
                                BoxShadow(
                                  color: Color(0x337C3AED),
                                  blurRadius: 80,
                                  spreadRadius: 8,
                                ),
                              ],
                            ),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 28,
                                vertical: 18,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFF07111F),
                                borderRadius: BorderRadius.circular(27),
                              ),
                              child: Stack(
                                children: [
                                  Image.asset(
                                    'assets/images/logo.png',
                                    height: 58,
                                    fit: BoxFit.contain,
                                  ),
                                  // Shimmer shine reflection sweep
                                  Positioned.fill(
                                    child: AnimatedBuilder(
                                      animation: controller,
                                      builder: (context, _) {
                                        final slideValue = (controller.value * 2.5) - 1.25;
                                        return ClipRRect(
                                          borderRadius: BorderRadius.circular(4),
                                          child: FractionalTranslation(
                                            translation: Offset(slideValue, 0.0),
                                            child: Container(
                                              decoration: const BoxDecoration(
                                                gradient: LinearGradient(
                                                  colors: [
                                                    Colors.transparent,
                                                    Colors.white70,
                                                    Colors.transparent,
                                                  ],
                                                  stops: [0.1, 0.5, 0.9],
                                                  begin: Alignment.topLeft,
                                                  end: Alignment.bottomRight,
                                                ),
                                              ),
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      const Text(
                        'THENIJOBS',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 25,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Jobs, businesses and services for Tamil Nadu',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFFA7F3D0),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 28),
                      const Text(
                        'Preparing your career ecosystem',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
