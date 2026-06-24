// ============================================================
// THENIJOBS — Theme & Design Tokens (Dart Port)
// ============================================================

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
export 'tailwind_colors.dart';

class AppTheme {
  // ===== BRAND COLORS =====
  static const Color primaryPurple = Color(0xFF7C3AED);
  static const Color brandViolet = Color(0xFF6D28D9);
  static const Color brandIndigo = Color(0xFF4F46E5);
  static const Color brandCyan = Color(0xFF06B6D4);
  static const Color brandEmerald = Color(0xFF10B981);
  static const Color brandAmber = Color(0xFFF59E0B);
  static const Color brandRose = Color(0xFFF43F5E);
  static const Color brandOrange = Color(0xFFF97316);

  // ===== LIGHT THEME COLORS (Option 2 Cozy Workspace) =====
  static const Color lightBg = Color(0xFFFFFBF8); // Cozy warm cream white
  static const Color lightCardBg = Colors.white;
  static const Color lightTextPrimary = Color(0xFF1E1B24); // Cozy charcoal-eggplant
  static const Color lightTextSecondary = Color(0xFF6B625E); // Earthy warm slate
  static const Color lightBorder = Color(0xFFF3EAE3); // Warm sandstone border

  // ===== DARK THEME COLORS (Portal Screens fallback) =====
  static const Color darkBg = Color(0xFF0E0B16); // Ultra deep violet-black
  static const Color darkCardBg = Color(0xFF181326);
  static const Color darkTextPrimary = Color(0xFFF9F7FC);
  static const Color darkTextSecondary = Color(0xFFB3A9C2);
  static const Color darkBorder = Color(0x1FFFFFFF);

  // ===== GRADIENTS (Vibrant Sunset) =====
  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF43F5E), Color(0xFFF97316), Color(0xFF7C3AED)], // Sunset Rose-Orange to Purple
  );

  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFF9F5), Color(0xFFFDF2EC), Color(0xFFFBEBE1)], // Warm light gradient background
  );

  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x0FF43F5E), Color(0x057C3AED)], // Soft sunset overlay
  );

  static const LinearGradient glowGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x22F43F5E), Color(0x227C3AED)],
  );

  static const LinearGradient purpleCyanGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF7C3AED), Color(0xFF06B6D4)],
  );

  static const LinearGradient emeraldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF10B981), Color(0xFF06B6D4)],
  );

  static const LinearGradient amberGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF59E0B), Color(0xFFF43F5E)],
  );

  // ===== GLASSMORPHISM & CARD DECORATIONS =====
  static BoxDecoration glassCard({
    double borderRadius = 18,
    Color? borderColor,
    bool isDark = false,
  }) {
    return BoxDecoration(
      color: isDark ? const Color(0x0AFFFFFF) : const Color(0xE0FFFFFF),
      border: Border.all(
        color: borderColor ?? (isDark ? const Color(0x14FFFFFF) : const Color(0x1FFFFFFF)),
        width: 1.2,
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: [
        BoxShadow(
          color: isDark ? const Color(0x55000000) : const Color(0x0DF43F5E),
          blurRadius: 28,
          offset: const Offset(0, 8),
        ),
      ],
    );
  }

  static BoxDecoration premiumCard({
    double borderRadius = 18,
    bool isDark = false,
  }) {
    return BoxDecoration(
      color: isDark ? const Color(0x0AFFFFFF) : Colors.white,
      border: Border.all(
        color: isDark ? const Color(0x14FFFFFF) : const Color(0xFFF3EAE3),
        width: 1,
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: [
        BoxShadow(
          color: isDark ? const Color(0x40000000) : const Color(0x08F43F5E),
          blurRadius: 28,
          offset: const Offset(0, 8),
        ),
      ],
    );
  }

  static BoxDecoration statCard({
    double borderRadius = 18,
    bool isDark = false,
  }) {
    return BoxDecoration(
      gradient: isDark
          ? const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0x147C3AED), Color(0x0A4F46E5)],
            )
          : const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0x0AF43F5E), Color(0x037C3AED)],
            ),
      border: Border.all(
        color: isDark ? const Color(0x267C3AED) : const Color(0x1AF43F5E),
        width: 1,
      ),
      borderRadius: BorderRadius.circular(borderRadius),
    );
  }

  // ===== LIGHT THEME CONFIG =====
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: brandRose,
      scaffoldBackgroundColor: lightBg,
      cardColor: lightCardBg,
      dividerColor: lightBorder,
      colorScheme: const ColorScheme.light(
        primary: brandRose,
        secondary: brandOrange,
        surface: lightCardBg,
        error: brandRose,
        outline: lightBorder,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme)
          .copyWith(
            displayLarge: GoogleFonts.outfit(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: lightTextPrimary,
            ),
            displayMedium: GoogleFonts.outfit(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: lightTextPrimary,
            ),
            titleLarge: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: lightTextPrimary,
            ),
            bodyLarge: GoogleFonts.inter(fontSize: 16, color: lightTextPrimary),
            bodyMedium: GoogleFonts.inter(
              fontSize: 14,
              color: lightTextSecondary,
            ),
          ),
      appBarTheme: AppBarTheme(
        backgroundColor: lightBg,
        elevation: 0,
        iconTheme: const IconThemeData(color: lightTextPrimary),
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: lightTextPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: lightCardBg,
        elevation: 0,
        shadowColor: const Color(0x08F43F5E),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: lightBorder),
        ),
      ),
    );
  }

  // ===== DARK THEME CONFIG =====
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryPurple,
      scaffoldBackgroundColor: darkBg,
      cardColor: darkCardBg,
      dividerColor: darkBorder,
      colorScheme: const ColorScheme.dark(
        primary: primaryPurple,
        secondary: brandCyan,
        surface: darkCardBg,
        error: brandRose,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme)
          .copyWith(
            displayLarge: GoogleFonts.outfit(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: darkTextPrimary,
            ),
            displayMedium: GoogleFonts.outfit(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: darkTextPrimary,
            ),
            titleLarge: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: darkTextPrimary,
            ),
            bodyLarge: GoogleFonts.inter(fontSize: 16, color: darkTextPrimary),
            bodyMedium: GoogleFonts.inter(
              fontSize: 14,
              color: darkTextSecondary,
            ),
          ),
      appBarTheme: AppBarTheme(
        backgroundColor: darkBg,
        elevation: 0,
        iconTheme: const IconThemeData(color: darkTextPrimary),
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: darkTextPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: darkCardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: darkBorder),
        ),
      ),
    );
  }
}

