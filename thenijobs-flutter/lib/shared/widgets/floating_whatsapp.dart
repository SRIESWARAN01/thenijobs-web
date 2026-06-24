// ============================================================
// THENIJOBS — FloatingWhatsApp FAB Widget (Dart Port)
// ============================================================

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class FloatingWhatsApp extends StatelessWidget {
  const FloatingWhatsApp({super.key});

  Future<void> _launchWhatsApp() async {
    // Platform support WhatsApp number
    final Uri uri = Uri.parse('https://wa.me/919876543210');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: _launchWhatsApp,
      backgroundColor: const Color(0xFF25D366), // WhatsApp brand green
      foregroundColor: Colors.white,
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: const Icon(Icons.chat_bubble_outline_rounded, size: 24),
    );
  }
}
