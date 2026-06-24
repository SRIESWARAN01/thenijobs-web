// ============================================================
// THENIJOBS — App Color Tokens (Material 3)
// ============================================================

import 'package:flutter/material.dart';

/// Centralized color palette for TheNiJobs mobile app.
/// Designed for a premium, modern, native mobile experience.
class AppColors {
  AppColors._();

  // ===== PRIMARY BRAND =====
  static const Color primary = Color(0xFF6C3CE9);
  static const Color primaryLight = Color(0xFF9B7AFF);
  static const Color primaryDark = Color(0xFF4A1DB8);
  static const Color primarySurface = Color(0xFFF3EEFF);

  // ===== SECONDARY =====
  static const Color secondary = Color(0xFF06B6D4);
  static const Color secondaryLight = Color(0xFF67E8F9);
  static const Color secondarySurface = Color(0xFFECFEFF);

  // ===== ACCENT =====
  static const Color emerald = Color(0xFF10B981);
  static const Color emeraldSurface = Color(0xFFECFDF5);
  static const Color amber = Color(0xFFF59E0B);
  static const Color amberSurface = Color(0xFFFFFBEB);
  static const Color rose = Color(0xFFF43F5E);
  static const Color roseSurface = Color(0xFFFFF1F2);
  static const Color orange = Color(0xFFF97316);

  // ===== LIGHT THEME =====
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightSurface = Colors.white;
  static const Color lightCard = Colors.white;
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF64748B);
  static const Color lightTextTertiary = Color(0xFF94A3B8);
  static const Color lightDivider = Color(0xFFE2E8F0);
  static const Color lightBorder = Color(0xFFF1F5F9);
  static const Color lightInputFill = Color(0xFFF8FAFC);

  // ===== DARK THEME =====
  static const Color darkBg = Color(0xFF0F172A);
  static const Color darkSurface = Color(0xFF1E293B);
  static const Color darkCard = Color(0xFF1E293B);
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkTextTertiary = Color(0xFF64748B);
  static const Color darkDivider = Color(0xFF334155);
  static const Color darkBorder = Color(0xFF334155);
  static const Color darkInputFill = Color(0xFF1E293B);

  // ===== STATUS =====
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // ===== JOB TYPE BADGES =====
  static const Color fullTime = Color(0xFF10B981);
  static const Color partTime = Color(0xFF8B5CF6);
  static const Color contract = Color(0xFFF59E0B);
  static const Color internship = Color(0xFF3B82F6);
  static const Color remote = Color(0xFF06B6D4);

  // ===== GRADIENTS =====
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF6C3CE9), Color(0xFF4F46E5)],
  );

  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF6C3CE9), Color(0xFF4F46E5), Color(0xFF06B6D4)],
  );

  static const LinearGradient successGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF10B981), Color(0xFF06B6D4)],
  );

  static Color jobTypeBadgeColor(String type) {
    switch (type.toLowerCase()) {
      case 'full-time':
      case 'full_time':
        return fullTime;
      case 'part-time':
      case 'part_time':
        return partTime;
      case 'contract':
        return contract;
      case 'internship':
        return internship;
      case 'remote':
        return remote;
      default:
        return primary;
    }
  }
}
