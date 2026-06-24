// ============================================================
// THENIJOBS — SearchHub Widget
// ============================================================

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_theme.dart';

class SearchHub extends StatefulWidget {
  const SearchHub({super.key});

  @override
  State<SearchHub> createState() => _SearchHubState();
}

class _SearchHubState extends State<SearchHub> {
  String _activeTabId = 'jobs';
  final _searchController = TextEditingController();
  String _selectedArea = 'All Areas';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Definition of tabs matching Next.js
  final List<Map<String, dynamic>> _tabs = [
    {
      'id': 'jobs',
      'label': 'Jobs',
      'tamil': 'வேலை',
      'icon': Icons.work_outline,
      'placeholder': 'Job title, skill, company...',
      'tags': ['Full Time', 'Part Time', 'Fresher', 'Remote', 'Field Work'],
      'color': Colors.teal,
      'bgColor': const Color(0xFFF0FDFA), // teal-50
      'textColor': const Color(0xFF115E59), // teal-800
    },
    {
      'id': 'businesses',
      'label': 'Business',
      'tamil': 'நிறுவனம்',
      'icon': Icons.business_outlined,
      'placeholder': 'Agro, textiles, school, hospital...',
      'tags': [
        'Agriculture',
        'Construction',
        'Textiles',
        'Healthcare',
        'Education',
      ],
      'color': Colors.blue,
      'bgColor': const Color(0xFFEFF6FF), // blue-50
      'textColor': const Color(0xFF1E40AF), // blue-800
    },
    {
      'id': 'services',
      'label': 'Services',
      'tamil': 'சேவை',
      'icon': Icons.construction_outlined,
      'placeholder': 'Plumbing, web design, accounting...',
      'tags': ['Web Design', 'Legal', 'Accounting', 'Photography', 'Repair'],
      'color': Colors.amber,
      'bgColor': const Color(0xFFFFFBEB), // amber-50
      'textColor': const Color(0xFF92400E), // amber-800
    },
  ];

  Map<String, dynamic> get _activeTab =>
      _tabs.firstWhere((t) => t['id'] == _activeTabId);

  void _handleSearch() {
    final query = _searchController.text.trim();
    final params = <String, String>{};
    if (query.isNotEmpty) {
      params['search'] = query;
    }
    if (_selectedArea != 'All Areas') {
      params['area'] = _selectedArea;
    }

    // Redirect based on active search type
    String targetPath = '/jobs';
    if (_activeTabId == 'businesses') {
      targetPath = '/businesses';
    } else if (_activeTabId == 'services') {
      targetPath = '/services';
    }

    final uri = Uri(path: targetPath, queryParameters: params);
    context.push(uri.toString());
  }

  void _searchTag(String tag) {
    setState(() {
      _searchController.text = tag;
    });
    _handleSearch();
  }

  @override
  Widget build(BuildContext context) {
    final active = _activeTab;
    final isWide = MediaQuery.of(context).size.width > 768;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1100),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: TailwindColors.slate.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const Text(
                'SMART SEARCH',
                style: TextStyle(
                  color: Colors.teal,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'நீங்கள் என்ன தேடுகிறீர்கள்?',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Job, company, service, supplier எல்லாத்தையும் ஒரே search flow-ல் கண்டுபிடிக்கலாம்.',
                style: TextStyle(
                  color: TailwindColors.slate.shade500,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 20),

              // Tabs Row
              isWide
                  ? Row(children: _buildTabButtons())
                  : Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _buildTabButtons(),
                    ),
              const SizedBox(height: 16),

              // Inputs Row (Search box, location select, button)
              isWide
                  ? Row(
                      children: [
                        Expanded(flex: 5, child: _buildSearchTextField(active)),
                        const SizedBox(width: 8),
                        Expanded(flex: 3, child: _buildAreaDropdown()),
                        const SizedBox(width: 8),
                        _buildSearchButton(),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildSearchTextField(active),
                        const SizedBox(height: 8),
                        _buildAreaDropdown(),
                        const SizedBox(height: 8),
                        SizedBox(height: 48, child: _buildSearchButton()),
                      ],
                    ),
              const SizedBox(height: 16),

              // Popular tags & footer notes
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  const Text(
                    'Popular:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ),
                  ...(active['tags'] as List<String>).map((tag) {
                    return InkWell(
                      onTap: () => _searchTag(tag),
                      borderRadius: BorderRadius.circular(100),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(
                            color: TailwindColors.slate.shade200,
                          ),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          tag,
                          style: TextStyle(
                            color: TailwindColors.slate.shade600,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Builder functions for cleaner layout
  List<Widget> _buildTabButtons() {
    return _tabs.map((tab) {
      final isSelected = _activeTabId == tab['id'];
      final color = tab['color'] as Color;

      Widget tabContent = Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : TailwindColors.slate.shade100,
          borderRadius: BorderRadius.circular(10),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Icon(
          tab['icon'] as IconData,
          size: 16,
          color: isSelected ? color : Colors.grey,
        ),
      );

      return InkWell(
        onTap: () => setState(() => _activeTabId = tab['id']),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? tab['bgColor'] as Color
                : TailwindColors.slate.shade50,
            border: Border.all(
              color: isSelected ? color : TailwindColors.slate.shade200,
              width: 1.5,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              tabContent,
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    tab['label'] as String,
                    style: TextStyle(
                      color: isSelected
                          ? tab['textColor'] as Color
                          : TailwindColors.slate.shade700,
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    tab['tamil'] as String,
                    style: TextStyle(
                      color: isSelected
                          ? (tab['textColor'] as Color).withValues(alpha: 0.7)
                          : Colors.grey,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }).toList();
  }

  Widget _buildSearchTextField(Map<String, dynamic> active) {
    return TextFormField(
      controller: _searchController,
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
      decoration: InputDecoration(
        hintText: active['placeholder'] as String,
        hintStyle: TextStyle(
          color: TailwindColors.slate.shade400,
          fontSize: 13,
          fontWeight: FontWeight.normal,
        ),
        prefixIcon: const Icon(Icons.search, size: 18, color: Colors.grey),
        filled: true,
        fillColor: TailwindColors.slate.shade50,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: TailwindColors.slate.shade200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: TailwindColors.slate.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: active['color'] as Color, width: 1.5),
        ),
      ),
    );
  }

  Widget _buildAreaDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: TailwindColors.slate.shade50,
        border: Border.all(color: TailwindColors.slate.shade200),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_on, size: 16, color: Colors.teal),
          const SizedBox(width: 8),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedArea,
                isExpanded: true,
                style: TextStyle(
                  color: TailwindColors.slate.shade700,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
                items:
                    [
                          'All Areas',
                          'Theni',
                          'Bodinayakanur',
                          'Periyakulam',
                          'Cumbum',
                        ]
                        .map(
                          (area) =>
                              DropdownMenuItem(value: area, child: Text(area)),
                        )
                        .toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedArea = val);
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchButton() {
    return ElevatedButton(
      onPressed: _handleSearch,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.teal.shade700,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        elevation: 0,
      ),
      child: const Text(
        'தேடு',
        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
      ),
    );
  }
}
