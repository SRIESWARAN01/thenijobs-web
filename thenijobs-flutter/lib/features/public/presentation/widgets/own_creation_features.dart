import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';

class OwnCreationFeatures extends StatelessWidget {
  const OwnCreationFeatures({super.key});

  static const _roles = <_PlatformRole>[
    _PlatformRole(
      title: 'Job seeker',
      subtitle: 'Search, build profile, apply, interview and track progress.',
      icon: Icons.person_search_outlined,
      color: AppX.primary,
      path: '/seeker/dashboard',
      cta: 'Open seeker',
      steps: [
        'Browse jobs',
        'Filter by district',
        'Resume builder',
        'Apply',
        'Pipeline',
        'Interviews',
      ],
    ),
    _PlatformRole(
      title: 'Employer / HR',
      subtitle: 'Verify company, post jobs, shortlist and schedule interviews.',
      icon: Icons.business_center_outlined,
      color: AppX.violet,
      path: '/employer/dashboard',
      cta: 'Open hiring',
      steps: [
        'Company setup',
        'Post job',
        'Applicants',
        'Shortlist',
        'Messages',
        'Reports',
      ],
    ),
    _PlatformRole(
      title: 'Business owner',
      subtitle: 'Create a public listing, collect leads and manage customers.',
      icon: Icons.storefront_outlined,
      color: AppX.accent,
      path: '/business/dashboard',
      cta: 'Open business',
      steps: [
        'Directory profile',
        'GST badge',
        'Customer leads',
        'Lead stages',
        'Reviews',
        'Visibility',
      ],
    ),
    _PlatformRole(
      title: 'B2B supplier',
      subtitle: 'Show products, receive buyer enquiries and quote orders.',
      icon: Icons.inventory_2_outlined,
      color: AppX.amber,
      path: '/supplier/dashboard',
      cta: 'Open supplier',
      steps: [
        'Supplier store',
        'Product catalog',
        'Buyer enquiries',
        'Quotes',
        'Orders',
        'Plans',
      ],
    ),
    _PlatformRole(
      title: 'Service provider',
      subtitle: 'Publish services, coordinate bookings and build ratings.',
      icon: Icons.handyman_outlined,
      color: AppX.emerald,
      path: '/service/dashboard',
      cta: 'Open services',
      steps: [
        'Service profile',
        'Areas served',
        'Requests',
        'Bookings',
        'Portfolio',
        'Ratings',
      ],
    ),
    _PlatformRole(
      title: 'Platform admin',
      subtitle: 'Control users, approvals, billing, broadcasts and security.',
      icon: Icons.admin_panel_settings_outlined,
      color: AppX.rose,
      path: '/admin/dashboard',
      cta: 'Open admin',
      steps: [
        'Users',
        'Verify GST',
        'Approve jobs',
        'Payments',
        'Broadcasts',
        'Security',
      ],
    ),
  ];

  static const _featureLinks = <_FeatureLink>[
    _FeatureLink(
      label: 'Search discovery',
      body: 'Jobs, candidates, businesses, suppliers and services.',
      icon: Icons.manage_search_outlined,
      color: AppX.primary,
      path: '/jobs',
    ),
    _FeatureLink(
      label: 'Messaging',
      body: 'Candidate, employer, customer and buyer conversations.',
      icon: Icons.chat_bubble_outline_rounded,
      color: AppX.accent,
      path: '/seeker/messages',
    ),
    _FeatureLink(
      label: 'Notifications',
      body: 'Push, email, SMS, WhatsApp and broadcast alerts.',
      icon: Icons.notifications_active_outlined,
      color: AppX.amber,
      path: '/seeker/notifications',
    ),
    _FeatureLink(
      label: 'Payments',
      body: 'Plans, premium boosts, billing and subscription records.',
      icon: Icons.payments_outlined,
      color: AppX.emerald,
      path: '/pricing',
    ),
    _FeatureLink(
      label: 'Trust badges',
      body: 'Email, GST, business and employer verification signals.',
      icon: Icons.verified_user_outlined,
      color: AppX.violet,
      path: '/company/register',
    ),
    _FeatureLink(
      label: 'Reviews',
      body: 'Ratings for employers, businesses, suppliers and services.',
      icon: Icons.star_rate_outlined,
      color: AppX.amber,
      path: '/employer/reviews',
    ),
    _FeatureLink(
      label: 'Safety',
      body: 'Moderation, fraud checks, reports and audit logs.',
      icon: Icons.security_outlined,
      color: AppX.rose,
      path: '/admin/security',
    ),
    _FeatureLink(
      label: 'Help center',
      body: 'FAQ, support tickets, guides and onboarding prompts.',
      icon: Icons.support_agent_outlined,
      color: AppX.primary,
      path: '/more',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppX.s16, AppX.s8, AppX.s16, AppX.s16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(context),
          const SizedBox(height: 14),
          SizedBox(
            height: 260,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              clipBehavior: Clip.none,
              itemCount: _roles.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) => _RoleJourneyCard(
                role: _roles[index],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _FeatureLinkGrid(links: _featureLinks),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppX.s16),
      decoration: BoxDecoration(
        gradient: AppX.heroGradient,
        borderRadius: BorderRadius.circular(AppX.rLg),
        boxShadow: AppX.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.auto_awesome_outlined,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Complete platform app',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontSize: 18,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'THENIJOBS brings jobs, hiring, business leads, B2B suppliers, service bookings, payments and admin control into one Tamil Nadu mobile workflow.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                  height: 1.45,
                ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: const [
              _HeaderPill(label: 'Mobile first'),
              _HeaderPill(label: 'Role based'),
              _HeaderPill(label: 'Firebase live'),
              _HeaderPill(label: 'Secure payments'),
            ],
          ),
        ],
      ),
    );
  }
}

class _RoleJourneyCard extends StatelessWidget {
  const _RoleJourneyCard({required this.role});

  final _PlatformRole role;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 286,
      padding: const EdgeInsets.all(AppX.s16),
      decoration: AppX.card(radius: AppX.rLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: role.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(role.icon, color: role.color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  role.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            role.subtitle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: role.steps
                  .map((step) => _StepChip(label: step, color: role.color))
                  .toList(growable: false),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 42,
            child: FilledButton.icon(
              onPressed: () => context.push(role.path),
              icon: const Icon(Icons.arrow_forward_rounded, size: 18),
              label: Text(
                role.cta,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureLinkGrid extends StatelessWidget {
  const _FeatureLinkGrid({required this.links});

  final List<_FeatureLink> links;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 720 ? 4 : 2;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: links.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            mainAxisExtent: 136,
          ),
          itemBuilder: (context, index) => _FeatureLinkCard(
            link: links[index],
          ),
        );
      },
    );
  }
}

class _FeatureLinkCard extends StatelessWidget {
  const _FeatureLinkCard({required this.link});

  final _FeatureLink link;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppX.rMd),
        onTap: () => context.push(link.path),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: AppX.card(radius: AppX.rMd),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(link.icon, color: link.color, size: 22),
              const Spacer(),
              Text(
                link.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppX.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                link.body,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppX.textSecondary,
                  fontSize: 11.5,
                  height: 1.25,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeaderPill extends StatelessWidget {
  const _HeaderPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11.5,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _StepChip extends StatelessWidget {
  const _StepChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _PlatformRole {
  const _PlatformRole({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.path,
    required this.cta,
    required this.steps,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final String path;
  final String cta;
  final List<String> steps;
}

class _FeatureLink {
  const _FeatureLink({
    required this.label,
    required this.body,
    required this.icon,
    required this.color,
    required this.path,
  });

  final String label;
  final String body;
  final IconData icon;
  final Color color;
  final String path;
}
