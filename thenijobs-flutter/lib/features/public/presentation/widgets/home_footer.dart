// ============================================================
// THENIJOBS — HomeFooter Widget (Dart Port)
// ============================================================

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_theme.dart';

class HomeFooter extends StatelessWidget {
  const HomeFooter({super.key});

  Widget _buildLinkItem(BuildContext context, String label, String path) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: InkWell(
        onTap: () => context.push(path),
        child: Text(
          label,
          style: TextStyle(
            color: TailwindColors.slate.shade500,
            fontSize: 13,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 768;

    final logoWidget = Row(
      children: [
        const Icon(Icons.work, size: 24, color: AppTheme.primaryPurple),
        const SizedBox(width: 8),
        Text(
          'THE',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF0F172A).withValues(alpha: 0.7),
          ),
        ),
        const Text(
          'NIJOBS',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: AppTheme.brandCyan,
          ),
        ),
      ],
    );

    final descriptionWidget = Text(
      'Search, connect, hire and grow. Theni jobs and business discovery platform.',
      style: TextStyle(
        color: TailwindColors.slate.shade500,
        fontSize: 13,
        fontWeight: FontWeight.bold,
        height: 1.4,
      ),
    );

    final socialLinks = Row(
      children: ['F', 'IG', 'IN', 'YT'].map((short) {
        return Container(
          margin: const EdgeInsets.only(right: 8),
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: TailwindColors.slate.shade50,
            border: Border.all(color: TailwindColors.slate.shade200),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              short,
              style: TextStyle(
                color: TailwindColors.slate.shade600,
                fontSize: 10,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        );
      }).toList(),
    );

    final seekerLinks = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'For Job Seekers',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 8),
        _buildLinkItem(context, 'Browse Jobs', '/jobs'),
        _buildLinkItem(context, 'Create Profile', '/register'),
        _buildLinkItem(context, 'Upload Resume', '/seeker/resume'),
        _buildLinkItem(context, 'Job Alerts', '/seeker/job-alerts'),
        _buildLinkItem(context, 'Companies', '/businesses'),
      ],
    );

    final employerLinks = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'For Employers',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 8),
        _buildLinkItem(context, 'Post a Job', '/employer/post-job'),
        _buildLinkItem(context, 'Register Company', '/company/register'),
        _buildLinkItem(context, 'Browse Candidates', '/employer/candidates'),
        _buildLinkItem(context, 'Pricing Plans', '/pricing'),
        _buildLinkItem(context, 'Dashboard', '/employer/dashboard'),
      ],
    );

    final contactInfo = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Contact',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.location_on, size: 14, color: Colors.teal),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Theni, Tamil Nadu, India',
                style: TextStyle(
                  color: TailwindColors.slate.shade500,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(Icons.phone, size: 14, color: Colors.teal),
            const SizedBox(width: 8),
            Text(
              '+91 98765 43210',
              style: TextStyle(
                color: TailwindColors.slate.shade500,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(Icons.mail, size: 14, color: Colors.teal),
            const SizedBox(width: 8),
            Text(
              'hello@thenijobs.com',
              style: TextStyle(
                color: TailwindColors.slate.shade500,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: TailwindColors.slate.shade200),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Columns Grid
              if (isWide)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          logoWidget,
                          const SizedBox(height: 12),
                          descriptionWidget,
                          const SizedBox(height: 16),
                          socialLinks,
                        ],
                      ),
                    ),
                    const SizedBox(width: 32),
                    Expanded(child: seekerLinks),
                    const SizedBox(width: 32),
                    Expanded(child: employerLinks),
                    const SizedBox(width: 32),
                    Expanded(child: contactInfo),
                  ],
                )
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    logoWidget,
                    const SizedBox(height: 12),
                    descriptionWidget,
                    const SizedBox(height: 16),
                    socialLinks,
                    const SizedBox(height: 32),
                    seekerLinks,
                    const SizedBox(height: 32),
                    employerLinks,
                    const SizedBox(height: 32),
                    contactInfo,
                  ],
                ),

              const SizedBox(height: 32),
              const Divider(color: Color(0xFFE2E8F0)),
              const SizedBox(height: 20),

              // Bottom footer row
              if (isWide)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: _buildCopyrightText()),
                    _buildPolicyLinks(context),
                  ],
                )
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildCopyrightText(),
                    const SizedBox(height: 12),
                    _buildPolicyLinks(context),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCopyrightText() {
    return Text(
      'Copyright 2026 THENIJOBS. All rights reserved.',
      style: TextStyle(
        color: TailwindColors.slate.shade500,
        fontSize: 11,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildPolicyLinks(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        InkWell(
          onTap: () => context.push('/privacy'),
          child: Text(
            'Privacy',
            style: TextStyle(
              color: TailwindColors.slate.shade500,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(width: 12),
        InkWell(
          onTap: () => context.push('/terms'),
          child: Text(
            'Terms',
            style: TextStyle(
              color: TailwindColors.slate.shade500,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}
