import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thenijobs/core/services/firestore_service.dart';
import 'package:thenijobs/core/services/platform_actions_service.dart';
import 'package:thenijobs/core/theme/app_theme.dart';

const _districts = [
  'Theni',
  'Madurai',
  'Dindigul',
  'Coimbatore',
  'Salem',
  'Chennai',
  'Trichy',
  'Tirunelveli',
  'Erode',
  'Tiruppur',
];

const _jobTypeValues = {
  'Full time': 'full_time',
  'Part time': 'part_time',
  'Internship': 'internship',
  'Remote': 'remote',
  'Work from home': 'work_from_home',
  'Fresher': 'fresher',
  'Contract': 'contract',
};

String _currentUid() => fb.FirebaseAuth.instance.currentUser?.uid ?? '';

String _stringValue(Object? value, [String fallback = '']) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

List<String> _csv(String value) {
  return value
      .split(',')
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toList(growable: false);
}

String _safeName(String name, String fallback) {
  final cleaned = name.replaceAll(RegExp(r'[^A-Za-z0-9._-]'), '_');
  return cleaned.isEmpty ? fallback : cleaned;
}

String _dateLabel(Object? value) {
  if (value is Timestamp) {
    return DateFormat('d MMM yyyy').format(value.toDate());
  }
  if (value is DateTime) return DateFormat('d MMM yyyy').format(value);
  final text = _stringValue(value);
  if (text.isEmpty) return '';
  final parsed = DateTime.tryParse(text);
  return parsed == null ? text : DateFormat('d MMM yyyy').format(parsed);
}

Map<String, dynamic> _docData(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
  return {'id': doc.id, ...doc.data()};
}

class PortalScaffold extends StatelessWidget {
  const PortalScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.children,
    this.actions = const [],
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final List<Widget> children;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBg,
      appBar: AppBar(
        title: Text(title),
        actions: [
          ...actions,
          IconButton(
            tooltip: 'Home',
            onPressed: () => context.go('/'),
            icon: const Icon(Icons.home_outlined),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 820),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                children: [
                  _PortalHeader(
                    title: title,
                    subtitle: subtitle,
                    icon: icon,
                    color: color,
                  ),
                  const SizedBox(height: 16),
                  ...children,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PortalHeader extends StatelessWidget {
  const _PortalHeader({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return _PortalCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppTheme.lightTextPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: AppTheme.lightTextSecondary,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PortalCard extends StatelessWidget {
  const _PortalCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.premiumCard(borderRadius: 18),
      child: child,
    );
  }
}

class _PortalField extends StatelessWidget {
  const _PortalField({
    required this.controller,
    required this.label,
    required this.icon,
    this.maxLines = 1,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final int maxLines;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

class _PortalSelect extends StatelessWidget {
  const _PortalSelect({
    required this.label,
    required this.value,
    required this.values,
    required this.onChanged,
    required this.icon,
  });

  final String label;
  final String value;
  final List<String> values;
  final ValueChanged<String> onChanged;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      initialValue: values.contains(value) ? value : values.first,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
      items: values
          .map((item) => DropdownMenuItem(value: item, child: Text(item)))
          .toList(),
      onChanged: (value) {
        if (value != null) onChanged(value);
      },
    );
  }
}

class _EmptyPortalState extends StatelessWidget {
  const _EmptyPortalState({
    required this.title,
    required this.body,
    this.icon = Icons.inbox_outlined,
  });

  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return _PortalCard(
      child: Column(
        children: [
          Icon(icon, size: 38, color: AppTheme.lightTextSecondary),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              color: AppTheme.lightTextPrimary,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.lightTextSecondary),
          ),
        ],
      ),
    );
  }
}

class _TinyMetaChip extends StatelessWidget {
  const _TinyMetaChip({required this.label, this.color = AppTheme.brandCyan});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class SeekerProfileEditorScreen extends StatefulWidget {
  const SeekerProfileEditorScreen({super.key});

  @override
  State<SeekerProfileEditorScreen> createState() =>
      _SeekerProfileEditorScreenState();
}

class _SeekerProfileEditorScreenState extends State<SeekerProfileEditorScreen> {
  final _service = FirestoreService();
  final _name = TextEditingController();
  final _headline = TextEditingController();
  final _summary = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  final _skills = TextEditingController();

  var _district = 'Theni';
  var _openToWork = true;
  var _loading = true;
  var _saving = false;
  var _uploadingPhoto = false;
  String? _photoUrl;
  Map<String, dynamic> _profile = {};
  Map<String, dynamic> _user = {};
  final List<Map<String, dynamic>> _experience = [];
  final List<Map<String, dynamic>> _education = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _headline.dispose();
    _summary.dispose();
    _email.dispose();
    _phone.dispose();
    _address.dispose();
    _skills.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final uid = _currentUid();
    if (uid.isEmpty) {
      setState(() => _loading = false);
      return;
    }

    final user = await _service.fetchDocument('users', uid);
    final profile = await _service.fetchDocument('seekerProfiles', uid);
    if (!mounted) return;

    _user = user ?? {};
    _profile = profile ?? {};
    _name.text = _stringValue(
      _profile['name'],
      _stringValue(_user['displayName']),
    );
    _headline.text = _stringValue(
      _profile['headline'],
      _stringValue(_profile['currentRole']),
    );
    _summary.text = _stringValue(_profile['summary']);
    _email.text = _stringValue(_profile['email'], _stringValue(_user['email']));
    _phone.text = _stringValue(_profile['phone'], _stringValue(_user['phone']));
    _address.text = _stringValue(_profile['address']);
    _district = _districts.contains(_stringValue(_profile['district']))
        ? _stringValue(_profile['district'])
        : 'Theni';
    _skills.text = (_profile['skills'] as List<dynamic>? ?? const [])
        .map((item) => item.toString())
        .join(', ');
    _openToWork = _profile['isOpenToWork'] != false;
    _photoUrl = _stringValue(
      _profile['profilePhotoUrl'],
      _stringValue(_profile['photoUrl'], _stringValue(_user['photoURL'])),
    );
    _experience
      ..clear()
      ..addAll(
        (_profile['experience'] as List<dynamic>? ?? const [])
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item)),
      );
    _education
      ..clear()
      ..addAll(
        (_profile['education'] as List<dynamic>? ?? const [])
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item)),
      );
    setState(() => _loading = false);
  }

  Future<void> _pickPhoto() async {
    final uid = _currentUid();
    if (uid.isEmpty) return;
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['jpg', 'jpeg', 'png', 'webp'],
      withData: true,
    );
    if (picked == null || picked.files.isEmpty) return;

    final file = picked.files.single;
    final bytes = file.bytes;
    if (bytes == null) {
      _snack('Could not read the selected image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      _snack('Profile photo must be smaller than 5 MB.');
      return;
    }

    setState(() => _uploadingPhoto = true);
    try {
      final ext = file.extension?.toLowerCase() == 'jpg'
          ? 'jpeg'
          : (file.extension?.toLowerCase() ?? 'png');
      final storagePath =
          'seekers/$uid/${DateTime.now().millisecondsSinceEpoch}_${_safeName(file.name, 'profile.$ext')}';
      final task = await FirebaseStorage.instance
          .ref(storagePath)
          .putData(bytes, SettableMetadata(contentType: 'image/$ext'));
      final url = await task.ref.getDownloadURL();
      if (!mounted) return;
      setState(() {
        _photoUrl = url;
        _uploadingPhoto = false;
      });
      _snack('Profile photo uploaded.');
    } catch (err) {
      if (!mounted) return;
      setState(() => _uploadingPhoto = false);
      _snack('Photo upload failed: $err');
    }
  }

  Future<void> _save() async {
    final uid = _currentUid();
    if (uid.isEmpty) {
      context.go('/login');
      return;
    }
    if (_name.text.trim().isEmpty || _phone.text.trim().isEmpty) {
      _snack('Name and phone are required.');
      return;
    }

    setState(() => _saving = true);
    try {
      await _service.saveSeekerProfile(uid, {
        ..._profile,
        'uid': uid,
        'name': _name.text.trim(),
        'displayName': _name.text.trim(),
        'headline': _headline.text.trim(),
        'currentRole': _headline.text.trim(),
        'summary': _summary.text.trim(),
        'email': _email.text.trim(),
        'phone': _phone.text.trim(),
        'address': _address.text.trim(),
        'district': _district,
        'state': 'Tamil Nadu',
        if (_photoUrl != null && _photoUrl!.isNotEmpty) 'photoUrl': _photoUrl,
        if (_photoUrl != null && _photoUrl!.isNotEmpty)
          'profilePhotoUrl': _photoUrl,
        'skills': _csv(_skills.text),
        'experience': _experience,
        'education': _education,
        'isOpenToWork': _openToWork,
      }, userData: _user);
      if (!mounted) return;
      setState(() => _saving = false);
      _snack('Profile saved with web-compatible fields.');
      await _load();
    } catch (err) {
      if (!mounted) return;
      setState(() => _saving = false);
      _snack('Profile save failed: $err');
    }
  }

  Future<void> _editExperience([int? index]) async {
    final existing = index == null ? <String, dynamic>{} : _experience[index];
    final role = TextEditingController(text: _stringValue(existing['role']));
    final company = TextEditingController(
      text: _stringValue(existing['company']),
    );
    final start = TextEditingController(
      text: _stringValue(existing['startDate']),
    );
    final end = TextEditingController(text: _stringValue(existing['endDate']));
    final description = TextEditingController(
      text: _stringValue(existing['description']),
    );
    var current = existing['isCurrent'] == true;

    final saved = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(index == null ? 'Add Experience' : 'Edit Experience'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: role,
                      decoration: const InputDecoration(labelText: 'Role'),
                    ),
                    TextField(
                      controller: company,
                      decoration: const InputDecoration(labelText: 'Company'),
                    ),
                    TextField(
                      controller: start,
                      decoration: const InputDecoration(
                        labelText: 'Start date',
                        hintText: 'Jan 2024',
                      ),
                    ),
                    TextField(
                      controller: end,
                      decoration: const InputDecoration(
                        labelText: 'End date',
                        hintText: 'Present',
                      ),
                    ),
                    SwitchListTile(
                      value: current,
                      onChanged: (value) => setDialogState(() {
                        current = value;
                      }),
                      title: const Text('Current role'),
                    ),
                    TextField(
                      controller: description,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () {
                    Navigator.pop(dialogContext, {
                      'id': _stringValue(
                        existing['id'],
                        DateTime.now().microsecondsSinceEpoch.toString(),
                      ),
                      'role': role.text.trim(),
                      'company': company.text.trim(),
                      'startDate': start.text.trim(),
                      if (end.text.trim().isNotEmpty)
                        'endDate': end.text.trim(),
                      'isCurrent': current,
                      if (description.text.trim().isNotEmpty)
                        'description': description.text.trim(),
                    });
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );

    role.dispose();
    company.dispose();
    start.dispose();
    end.dispose();
    description.dispose();
    if (saved == null) return;
    setState(() {
      if (index == null) {
        _experience.add(saved);
      } else {
        _experience[index] = saved;
      }
    });
  }

  Future<void> _editEducation([int? index]) async {
    final existing = index == null ? <String, dynamic>{} : _education[index];
    final degree = TextEditingController(
      text: _stringValue(existing['degree']),
    );
    final field = TextEditingController(text: _stringValue(existing['field']));
    final institution = TextEditingController(
      text: _stringValue(existing['institution']),
    );
    final startYear = TextEditingController(
      text: _stringValue(existing['startYear']),
    );
    final endYear = TextEditingController(
      text: _stringValue(existing['endYear']),
    );
    var current = existing['isCurrent'] == true;

    final saved = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(index == null ? 'Add Education' : 'Edit Education'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: degree,
                      decoration: const InputDecoration(labelText: 'Degree'),
                    ),
                    TextField(
                      controller: field,
                      decoration: const InputDecoration(labelText: 'Field'),
                    ),
                    TextField(
                      controller: institution,
                      decoration: const InputDecoration(
                        labelText: 'Institution',
                      ),
                    ),
                    TextField(
                      controller: startYear,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Start year',
                      ),
                    ),
                    TextField(
                      controller: endYear,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'End year'),
                    ),
                    SwitchListTile(
                      value: current,
                      onChanged: (value) => setDialogState(() {
                        current = value;
                      }),
                      title: const Text('Currently studying'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () {
                    Navigator.pop(dialogContext, {
                      'id': _stringValue(
                        existing['id'],
                        DateTime.now().microsecondsSinceEpoch.toString(),
                      ),
                      'degree': degree.text.trim(),
                      'field': field.text.trim(),
                      'institution': institution.text.trim(),
                      'startYear': int.tryParse(startYear.text.trim()) ?? 0,
                      if (endYear.text.trim().isNotEmpty)
                        'endYear': int.tryParse(endYear.text.trim()),
                      'isCurrent': current,
                    });
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );

    degree.dispose();
    field.dispose();
    institution.dispose();
    startYear.dispose();
    endYear.dispose();
    if (saved == null) return;
    setState(() {
      if (index == null) {
        _education.add(saved);
      } else {
        _education[index] = saved;
      }
    });
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const PortalScaffold(
        title: 'Seeker Profile',
        subtitle: 'Loading your profile editor.',
        icon: Icons.person_outline,
        color: AppTheme.brandEmerald,
        children: [
          Center(
            child: Padding(
              padding: EdgeInsets.all(48),
              child: CircularProgressIndicator(),
            ),
          ),
        ],
      );
    }

    return PortalScaffold(
      title: 'Seeker Profile',
      subtitle:
          'Edit the fields employers and the web portal use: profileStrength, skills, education, experience and contact details.',
      icon: Icons.person_outline,
      color: AppTheme.brandEmerald,
      actions: [
        IconButton(
          tooltip: 'Resume',
          onPressed: () => context.push('/seeker/resume'),
          icon: const Icon(Icons.description_outlined),
        ),
      ],
      children: [
        _PortalCard(
          child: Column(
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 34,
                    backgroundColor: AppTheme.brandEmerald.withValues(
                      alpha: 0.12,
                    ),
                    backgroundImage: _photoUrl == null || _photoUrl!.isEmpty
                        ? null
                        : NetworkImage(_photoUrl!),
                    child: _photoUrl == null || _photoUrl!.isEmpty
                        ? const Icon(Icons.person, size: 34)
                        : null,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _uploadingPhoto ? null : _pickPhoto,
                      icon: _uploadingPhoto
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.photo_camera_outlined),
                      label: Text(
                        _uploadingPhoto
                            ? 'Uploading...'
                            : 'Upload profile photo',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _PortalField(
                controller: _name,
                label: 'Name *',
                icon: Icons.badge_outlined,
              ),
              const SizedBox(height: 12),
              _PortalField(
                controller: _headline,
                label: 'Headline / current role',
                icon: Icons.work_outline,
              ),
              const SizedBox(height: 12),
              _PortalField(
                controller: _summary,
                label: 'Summary',
                icon: Icons.notes_outlined,
                maxLines: 4,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _PortalField(
                      controller: _phone,
                      label: 'Phone *',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _PortalField(
                      controller: _email,
                      label: 'Email',
                      icon: Icons.mail_outline,
                      keyboardType: TextInputType.emailAddress,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _PortalSelect(
                label: 'District',
                value: _district,
                values: _districts,
                icon: Icons.place_outlined,
                onChanged: (value) => setState(() => _district = value),
              ),
              const SizedBox(height: 12),
              _PortalField(
                controller: _address,
                label: 'Address',
                icon: Icons.location_city_outlined,
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              _PortalField(
                controller: _skills,
                label: 'Skills (comma separated)',
                icon: Icons.school_outlined,
              ),
              const SizedBox(height: 6),
              SwitchListTile(
                value: _openToWork,
                onChanged: (value) => setState(() => _openToWork = value),
                title: const Text('Open to work'),
                contentPadding: EdgeInsets.zero,
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        _EditableRecordSection(
          title: 'Experience',
          emptyText: 'Add your work history so employers can assess fit.',
          records: _experience,
          titleBuilder: (item) => _stringValue(item['role'], 'Role'),
          subtitleBuilder: (item) => _stringValue(item['company']),
          onAdd: () => _editExperience(),
          onEdit: _editExperience,
          onDelete: (index) => setState(() => _experience.removeAt(index)),
        ),
        const SizedBox(height: 14),
        _EditableRecordSection(
          title: 'Education',
          emptyText: 'Add education rows used by profile matching.',
          records: _education,
          titleBuilder: (item) => _stringValue(item['degree'], 'Degree'),
          subtitleBuilder: (item) => _stringValue(item['institution']),
          onAdd: () => _editEducation(),
          onEdit: _editEducation,
          onDelete: (index) => setState(() => _education.removeAt(index)),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 50,
          child: FilledButton.icon(
            onPressed: _saving ? null : _save,
            icon: _saving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.save_outlined),
            label: Text(_saving ? 'Saving...' : 'Save Profile'),
          ),
        ),
      ],
    );
  }
}

class _EditableRecordSection extends StatelessWidget {
  const _EditableRecordSection({
    required this.title,
    required this.emptyText,
    required this.records,
    required this.titleBuilder,
    required this.subtitleBuilder,
    required this.onAdd,
    required this.onEdit,
    required this.onDelete,
  });

  final String title;
  final String emptyText;
  final List<Map<String, dynamic>> records;
  final String Function(Map<String, dynamic>) titleBuilder;
  final String Function(Map<String, dynamic>) subtitleBuilder;
  final VoidCallback onAdd;
  final ValueChanged<int> onEdit;
  final ValueChanged<int> onDelete;

  @override
  Widget build(BuildContext context) {
    return _PortalCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              IconButton(
                tooltip: 'Add',
                onPressed: onAdd,
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
          if (records.isEmpty)
            Text(
              emptyText,
              style: const TextStyle(color: AppTheme.lightTextSecondary),
            )
          else
            ...records.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(titleBuilder(item)),
                subtitle: Text(subtitleBuilder(item)),
                trailing: Wrap(
                  children: [
                    IconButton(
                      tooltip: 'Edit',
                      onPressed: () => onEdit(index),
                      icon: const Icon(Icons.edit_outlined),
                    ),
                    IconButton(
                      tooltip: 'Remove',
                      onPressed: () => onDelete(index),
                      icon: const Icon(Icons.delete_outline),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

class SeekerResumeManagerScreen extends StatefulWidget {
  const SeekerResumeManagerScreen({super.key});

  @override
  State<SeekerResumeManagerScreen> createState() =>
      _SeekerResumeManagerScreenState();
}

class _SeekerResumeManagerScreenState extends State<SeekerResumeManagerScreen> {
  final _service = FirestoreService();
  var _uploading = false;
  var _publishingPack = false;

  Stream<DocumentSnapshot<Map<String, dynamic>>> _profileStream() {
    return FirebaseFirestore.instance
        .collection('seekerProfiles')
        .doc(_currentUid())
        .snapshots();
  }

  Future<void> _uploadResume() async {
    final uid = _currentUid();
    if (uid.isEmpty) {
      context.go('/login');
      return;
    }
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf'],
      withData: true,
    );
    if (picked == null || picked.files.isEmpty) return;

    final file = picked.files.single;
    final bytes = file.bytes;
    if (bytes == null) {
      _snack('Could not read the selected PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      _snack('Resume must be smaller than 5 MB.');
      return;
    }

    setState(() => _uploading = true);
    try {
      final storagePath =
          'resumes/$uid/${DateTime.now().millisecondsSinceEpoch}_${_safeName(file.name, 'resume.pdf')}';
      final task = await FirebaseStorage.instance
          .ref(storagePath)
          .putData(bytes, SettableMetadata(contentType: 'application/pdf'));
      final url = await task.ref.getDownloadURL();
      await _service.addSeekerResume(uid, {
        'id': DateTime.now().microsecondsSinceEpoch.toString(),
        'name': file.name,
        'url': url,
        'storagePath': storagePath,
        'uploadDate': DateFormat('d MMM yyyy').format(DateTime.now()),
        'size': _formatSize(file.size),
        'format': 'PDF',
        'isDefault': true,
      });
      if (!mounted) return;
      setState(() => _uploading = false);
      _snack('Resume uploaded and added to your profile.');
    } catch (err) {
      if (!mounted) return;
      setState(() => _uploading = false);
      _snack('Resume upload failed: $err');
    }
  }

  Future<void> _setDefault(Map<String, dynamic> resume) async {
    final uid = _currentUid();
    final profile = await _service.fetchDocument('seekerProfiles', uid);
    final resumes = (profile?['resumes'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .map((item) => {...item, 'isDefault': item['id'] == resume['id']})
        .toList();
    await _service.saveSeekerProfile(uid, {
      ...?profile,
      'resumes': resumes,
      'resumeUrl': FieldValue.delete(),
      'resumeURL': FieldValue.delete(),
      'resumeTitle': FieldValue.delete(),
    });
    _snack('Default resume updated.');
  }

  Future<void> _deleteResume(Map<String, dynamic> resume) async {
    final uid = _currentUid();
    final profile = await _service.fetchDocument('seekerProfiles', uid);
    final resumes = (profile?['resumes'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .where((item) => item['id'] != resume['id'])
        .toList();
    if (resumes.isNotEmpty &&
        !resumes.any((item) => item['isDefault'] == true)) {
      resumes[0]['isDefault'] = true;
    }
    await _service.saveSeekerProfile(uid, {
      ...?profile,
      'resumes': resumes,
      'resumeUrl': FieldValue.delete(),
      'resumeURL': FieldValue.delete(),
      'resumeTitle': FieldValue.delete(),
    });
    final path = _stringValue(resume['storagePath']);
    if (path.isNotEmpty) {
      try {
        await FirebaseStorage.instance.ref(path).delete();
      } catch (_) {
        // The profile array is the source of truth; missing storage files are harmless.
      }
    }
    _snack('Resume deleted.');
  }

  Future<void> _openResume(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      _snack('Could not open resume.');
    }
  }

  Future<void> _publishCareerPack(Map<String, dynamic> profile) async {
    final uid = _currentUid();
    if (uid.isEmpty) {
      context.go('/login');
      return;
    }

    setState(() => _publishingPack = true);
    try {
      final theniJobsId = _stringValue(
        profile['theniJobsId'],
        'TJ-SEEK-${uid.substring(0, uid.length < 7 ? uid.length : 7).toUpperCase()}',
      );
      final portfolioUrl = 'https://thenijobs.com/p/$theniJobsId';
      final existingLinks =
          (profile['portfolioLinks'] as List<dynamic>? ??
                  profile['portfolio'] as List<dynamic>? ??
                  const [])
              .map((item) => item.toString().trim())
              .where((item) => item.isNotEmpty)
              .toList();
      final links = existingLinks.contains(portfolioUrl)
          ? existingLinks
          : [portfolioUrl, ...existingLinks];

      await _service.saveSeekerProfile(uid, {
        ...profile,
        'theniJobsId': theniJobsId,
        'portfolioUrl': portfolioUrl,
        'portfolioLinks': links,
        'portfolio': links,
        'portfolioTemplate': profile['portfolioTemplate'] ?? 'professional',
        'portfolioTemplatesEnabled': const [
          'corporate',
          'modern',
          'creative',
          'dark_premium',
          'minimal',
          'freelancer',
          'startup',
          'executive',
          'luxury',
          'professional',
        ],
        'digitalIdEnabled': true,
        'qrPortfolioEnabled': true,
        'careerPack': {
          'portfolioUrl': portfolioUrl,
          'resumeReady':
              (profile['resumes'] as List<dynamic>? ?? const []).isNotEmpty,
          'identityCardReady': true,
          'qrCodeUrl': Uri.https('api.qrserver.com', '/v1/create-qr-code/', {
            'size': '240x240',
            'data': portfolioUrl,
          }).toString(),
          'updatedAt': DateTime.now().toIso8601String(),
        },
      });

      await Clipboard.setData(ClipboardData(text: portfolioUrl));
      if (!mounted) return;
      setState(() => _publishingPack = false);
      _snack('Career pack published. Portfolio link copied.');
    } catch (err) {
      if (!mounted) return;
      setState(() => _publishingPack = false);
      _snack('Career pack publish failed: $err');
    }
  }

  Future<void> _openPortfolio(Map<String, dynamic> profile) async {
    final theniJobsId = _stringValue(profile['theniJobsId']);
    final portfolioUrl = _stringValue(profile['portfolioUrl']).isNotEmpty
        ? _stringValue(profile['portfolioUrl'])
        : 'https://thenijobs.com/p/${theniJobsId.isEmpty ? _currentUid() : theniJobsId}';
    final uri = Uri.tryParse(portfolioUrl);
    if (uri == null) return;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      _snack('Could not open portfolio.');
    }
  }

  String _formatSize(int bytes) {
    if (bytes >= 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / 1024).ceil()} KB';
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return PortalScaffold(
      title: 'Seeker Resume',
      subtitle:
          'Upload PDFs, publish your portfolio QR and keep seekerProfiles synced for applications.',
      icon: Icons.description_outlined,
      color: AppTheme.brandCyan,
      actions: [
        IconButton(
          tooltip: 'Profile',
          onPressed: () => context.push('/seeker/profile'),
          icon: const Icon(Icons.person_outline),
        ),
      ],
      children: [
        SizedBox(
          height: 50,
          child: FilledButton.icon(
            onPressed: _uploading ? null : _uploadResume,
            icon: _uploading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.upload_file_outlined),
            label: Text(_uploading ? 'Uploading...' : 'Upload PDF Resume'),
          ),
        ),
        const SizedBox(height: 14),
        StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: _profileStream(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            final data = snapshot.data?.data() ?? {};
            final resumes = (data['resumes'] as List<dynamic>? ?? const [])
                .whereType<Map>()
                .map((item) => Map<String, dynamic>.from(item))
                .toList();
            final idForCard = _stringValue(data['theniJobsId'], _currentUid());
            final careerPackCard = _PortalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppTheme.brandEmerald.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.auto_awesome_outlined,
                          color: AppTheme.brandEmerald,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Auto Career Pack',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 16,
                              ),
                            ),
                            SizedBox(height: 5),
                            Text(
                              'Sync resume status, portfolio URL, QR code, digital ID card and template metadata to the public profile.',
                              style: TextStyle(
                                color: AppTheme.lightTextSecondary,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton.icon(
                        onPressed: _publishingPack
                            ? null
                            : () => _publishCareerPack(data),
                        icon: _publishingPack
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.cloud_sync_outlined),
                        label: Text(
                          _publishingPack ? 'Publishing...' : 'Publish Pack',
                        ),
                      ),
                      OutlinedButton.icon(
                        onPressed: () => _openPortfolio(data),
                        icon: const Icon(Icons.open_in_new_outlined),
                        label: const Text('Portfolio'),
                      ),
                      OutlinedButton.icon(
                        onPressed: () => context.push('/id/$idForCard'),
                        icon: const Icon(Icons.qr_code_2_outlined),
                        label: const Text('ID Card'),
                      ),
                    ],
                  ),
                ],
              ),
            );
            if (resumes.isEmpty) {
              return Column(
                children: [
                  careerPackCard,
                  const SizedBox(height: 12),
                  const _EmptyPortalState(
                    title: 'No resumes yet',
                    body:
                        'Upload a PDF resume here so mobile applications are unblocked.',
                    icon: Icons.description_outlined,
                  ),
                ],
              );
            }
            return Column(
              children: [
                careerPackCard,
                const SizedBox(height: 12),
                ...resumes.map((resume) {
                  final url = _stringValue(resume['url']);
                  final isDefault = resume['isDefault'] == true;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _PortalCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.picture_as_pdf_outlined),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _stringValue(
                                        resume['name'],
                                        'Resume PDF',
                                      ),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w900,
                                        fontSize: 15,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: [
                                        if (isDefault)
                                          const _TinyMetaChip(
                                            label: 'default',
                                            color: AppTheme.brandEmerald,
                                          ),
                                        _TinyMetaChip(
                                          label: _stringValue(
                                            resume['size'],
                                            'PDF',
                                          ),
                                        ),
                                        if (_stringValue(
                                          resume['uploadDate'],
                                        ).isNotEmpty)
                                          _TinyMetaChip(
                                            label: _stringValue(
                                              resume['uploadDate'],
                                            ),
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              OutlinedButton.icon(
                                onPressed: url.isEmpty
                                    ? null
                                    : () => _openResume(url),
                                icon: const Icon(Icons.open_in_new_outlined),
                                label: const Text('Open'),
                              ),
                              OutlinedButton.icon(
                                onPressed: isDefault
                                    ? null
                                    : () => _setDefault(resume),
                                icon: const Icon(Icons.check_circle_outline),
                                label: const Text('Make Default'),
                              ),
                              OutlinedButton.icon(
                                onPressed: () => _deleteResume(resume),
                                icon: const Icon(Icons.delete_outline),
                                label: const Text('Delete'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            );
          },
        ),
      ],
    );
  }
}

class SeekerJobAlertsEditorScreen extends StatefulWidget {
  const SeekerJobAlertsEditorScreen({super.key});

  @override
  State<SeekerJobAlertsEditorScreen> createState() =>
      _SeekerJobAlertsEditorScreenState();
}

class _SeekerJobAlertsEditorScreenState
    extends State<SeekerJobAlertsEditorScreen> {
  final _service = FirestoreService();
  final _keyword = TextEditingController();
  var _district = 'Theni';
  var _jobTypeLabel = 'Full time';
  var _pushEnabled = true;
  var _saving = false;

  @override
  void dispose() {
    _keyword.dispose();
    super.dispose();
  }

  Future<void> _createAlert() async {
    final uid = _currentUid();
    if (uid.isEmpty) {
      context.go('/login');
      return;
    }
    if (_keyword.text.trim().isEmpty) {
      _snack('Enter a keyword for this alert.');
      return;
    }

    setState(() => _saving = true);
    try {
      await _service.createJobAlert({
        'userId': uid,
        'title': '${_keyword.text.trim()} jobs in $_district',
        'keyword': _keyword.text.trim(),
        'district': _district,
        'jobType': _jobTypeValues[_jobTypeLabel],
        'pushEnabled': _pushEnabled,
        'status': 'active',
      });
      if (!mounted) return;
      setState(() {
        _saving = false;
        _keyword.clear();
      });
      _snack('Job alert created.');
    } catch (err) {
      if (!mounted) return;
      setState(() => _saving = false);
      _snack('Could not create alert: $err');
    }
  }

  Future<void> _updateAlert(String id, Map<String, dynamic> data) async {
    await _service.updateJobAlert(id, data);
    _snack('Alert updated.');
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final uid = _currentUid();
    return PortalScaffold(
      title: 'Job Alerts',
      subtitle:
          'Create keyword, district and job-type alerts that can drive push notifications.',
      icon: Icons.notifications_active_outlined,
      color: AppTheme.brandCyan,
      children: [
        _PortalCard(
          child: Column(
            children: [
              _PortalField(
                controller: _keyword,
                label: 'Keyword',
                icon: Icons.search_outlined,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _PortalSelect(
                      label: 'District',
                      value: _district,
                      values: _districts,
                      icon: Icons.place_outlined,
                      onChanged: (value) => setState(() => _district = value),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _PortalSelect(
                      label: 'Job type',
                      value: _jobTypeLabel,
                      values: _jobTypeValues.keys.toList(),
                      icon: Icons.work_outline,
                      onChanged: (value) =>
                          setState(() => _jobTypeLabel = value),
                    ),
                  ),
                ],
              ),
              SwitchListTile(
                value: _pushEnabled,
                onChanged: (value) => setState(() => _pushEnabled = value),
                title: const Text('Push notifications'),
                contentPadding: EdgeInsets.zero,
              ),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: FilledButton.icon(
                  onPressed: _saving ? null : _createAlert,
                  icon: const Icon(Icons.add_alert_outlined),
                  label: Text(_saving ? 'Creating...' : 'Create Alert'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: uid.isEmpty
              ? const Stream.empty()
              : FirebaseFirestore.instance
                    .collection('jobAlerts')
                    .where('userId', isEqualTo: uid)
                    .orderBy('createdAt', descending: true)
                    .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            final docs = snapshot.data?.docs ?? const [];
            if (docs.isEmpty) {
              return const _EmptyPortalState(
                title: 'No alerts yet',
                body: 'Create your first alert to watch for matching jobs.',
                icon: Icons.notifications_none_outlined,
              );
            }
            return Column(
              children: docs.map((doc) {
                final data = doc.data();
                final active = data['status'] != 'paused';
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _PortalCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _stringValue(
                            data['title'],
                            _stringValue(data['keyword'], 'Job alert'),
                          ),
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _TinyMetaChip(
                              label: _stringValue(
                                data['district'],
                                'Any district',
                              ),
                            ),
                            _TinyMetaChip(
                              label: _stringValue(data['jobType'], 'any type'),
                            ),
                            _TinyMetaChip(
                              label: active ? 'active' : 'paused',
                              color: active
                                  ? AppTheme.brandEmerald
                                  : AppTheme.brandAmber,
                            ),
                            if (data['pushEnabled'] == true)
                              const _TinyMetaChip(label: 'push on'),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          children: [
                            OutlinedButton.icon(
                              onPressed: () => _updateAlert(doc.id, {
                                'status': active ? 'paused' : 'active',
                              }),
                              icon: Icon(
                                active
                                    ? Icons.pause_rounded
                                    : Icons.play_arrow_rounded,
                              ),
                              label: Text(active ? 'Pause' : 'Activate'),
                            ),
                            OutlinedButton.icon(
                              onPressed: () => _updateAlert(doc.id, {
                                'pushEnabled': data['pushEnabled'] != true,
                              }),
                              icon: const Icon(Icons.notifications_outlined),
                              label: Text(
                                data['pushEnabled'] == true
                                    ? 'Push Off'
                                    : 'Push On',
                              ),
                            ),
                            OutlinedButton.icon(
                              onPressed: () async {
                                await _service.deleteJobAlert(doc.id);
                                _snack('Alert deleted.');
                              },
                              icon: const Icon(Icons.delete_outline),
                              label: const Text('Delete'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}

class PortalMessagesScreen extends StatelessWidget {
  const PortalMessagesScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final uid = _currentUid();
    return PortalScaffold(
      title: title,
      subtitle: 'Open a conversation thread and send replies.',
      icon: Icons.chat_bubble_outline,
      color: AppTheme.brandCyan,
      children: [
        StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: uid.isEmpty
              ? const Stream.empty()
              : FirebaseFirestore.instance
                    .collection('conversations')
                    .where('participants', arrayContains: uid)
                    .orderBy('lastMessageAt', descending: true)
                    .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            final docs = snapshot.data?.docs ?? const [];
            if (docs.isEmpty) {
              return const _EmptyPortalState(
                title: 'No conversations yet',
                body:
                    'Threads started from applications or employer actions will appear here.',
                icon: Icons.forum_outlined,
              );
            }
            return Column(
              children: docs.map((doc) {
                final data = doc.data();
                final names = data['participantNames'] is Map
                    ? Map<String, dynamic>.from(data['participantNames'] as Map)
                    : <String, dynamic>{};
                final otherName = names.entries
                    .where((entry) => entry.key != uid)
                    .map((entry) => entry.value.toString())
                    .firstOrNull;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _PortalCard(
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const CircleAvatar(
                        child: Icon(Icons.person_outline),
                      ),
                      title: Text(
                        otherName ??
                            _stringValue(data['jobTitle'], 'Conversation'),
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                      subtitle: Text(
                        _stringValue(data['lastMessage'], 'No messages yet'),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => _ConversationThreadPage(
                              conversationId: doc.id,
                              conversation: data,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}

class _ConversationThreadPage extends StatefulWidget {
  const _ConversationThreadPage({
    required this.conversationId,
    required this.conversation,
  });

  final String conversationId;
  final Map<String, dynamic> conversation;

  @override
  State<_ConversationThreadPage> createState() =>
      _ConversationThreadPageState();
}

class _ConversationThreadPageState extends State<_ConversationThreadPage> {
  final _message = TextEditingController();
  final _service = FirestoreService();
  Map<String, dynamic> _user = {};
  var _sending = false;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _service.markMessagesRead(widget.conversationId, _currentUid());
  }

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _loadUser() async {
    final uid = _currentUid();
    if (uid.isEmpty) return;
    final user = await _service.fetchDocument('users', uid);
    if (!mounted) return;
    setState(() => _user = user ?? {});
  }

  Future<void> _send() async {
    final text = _message.text.trim();
    final uid = _currentUid();
    if (text.isEmpty || uid.isEmpty) return;
    setState(() => _sending = true);
    try {
      await _service.sendChatMessage(
        widget.conversationId,
        ChatMessageData(
          senderId: uid,
          senderName: _stringValue(
            _user['displayName'],
            _stringValue(_user['name'], 'THENIJOBS User'),
          ),
          senderRole: _stringValue(_user['role'], 'user'),
          text: text,
        ),
      );
      if (!mounted) return;
      _message.clear();
      setState(() => _sending = false);
    } catch (err) {
      if (!mounted) return;
      setState(() => _sending = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Message failed: $err')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final jobTitle = _stringValue(widget.conversation['jobTitle'], 'Thread');
    return Scaffold(
      appBar: AppBar(title: Text(jobTitle)),
      backgroundColor: AppTheme.lightBg,
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder<List<FirestoreDocument>>(
              stream: _service.streamChatMessages(widget.conversationId),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final messages = snapshot.data ?? const [];
                if (messages.isEmpty) {
                  return const Center(child: Text('No messages yet.'));
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    final mine = message['senderId'] == _currentUid();
                    return Align(
                      alignment: mine
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                      child: Container(
                        constraints: const BoxConstraints(maxWidth: 620),
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: mine ? AppTheme.brandCyan : Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.lightBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _stringValue(
                                message['text'],
                                _stringValue(message['message']),
                              ),
                              style: TextStyle(
                                color: mine
                                    ? Colors.white
                                    : AppTheme.lightTextPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 5),
                            Text(
                              _dateLabel(message['createdAt']),
                              style: TextStyle(
                                color: mine
                                    ? Colors.white70
                                    : AppTheme.lightTextSecondary,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _message,
                      minLines: 1,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: 'Write a reply',
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  IconButton.filled(
                    tooltip: 'Send',
                    onPressed: _sending ? null : _send,
                    icon: _sending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PortalNotificationsScreen extends StatelessWidget {
  const PortalNotificationsScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final uid = _currentUid();
    final service = FirestoreService();
    return PortalScaffold(
      title: title,
      subtitle: 'Read alerts and clear unread state.',
      icon: Icons.notifications_outlined,
      color: AppTheme.primaryPurple,
      actions: [
        IconButton(
          tooltip: 'Mark all read',
          onPressed: uid.isEmpty
              ? null
              : () async {
                  await service.markAllNotificationsRead(uid);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('All notifications marked read.'),
                      ),
                    );
                  }
                },
          icon: const Icon(Icons.done_all_rounded),
        ),
      ],
      children: [
        StreamBuilder<List<FirestoreDocument>>(
          stream: uid.isEmpty
              ? Stream.value(const [])
              : service.streamNotifications(uid),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            final docs = snapshot.data ?? const [];
            if (docs.isEmpty) {
              return const _EmptyPortalState(
                title: 'No notifications',
                body:
                    'Application updates, interviews and broadcasts will appear here.',
                icon: Icons.notifications_none_outlined,
              );
            }
            return Column(
              children: docs.map((item) {
                final read = item['read'] == true;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _PortalCard(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          read
                              ? Icons.notifications_none
                              : Icons.notifications_active,
                          color: read
                              ? AppTheme.lightTextSecondary
                              : AppTheme.primaryPurple,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _stringValue(item['title'], 'Notification'),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 5),
                              Text(_stringValue(item['message'])),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                children: [
                                  _TinyMetaChip(
                                    label: _stringValue(item['type'], 'system'),
                                  ),
                                  if (_dateLabel(item['createdAt']).isNotEmpty)
                                    _TinyMetaChip(
                                      label: _dateLabel(item['createdAt']),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Mark read',
                          onPressed: read
                              ? null
                              : () => service.markNotificationRead(
                                  item['id'] as String,
                                ),
                          icon: const Icon(Icons.check_circle_outline),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}

class EmployerPostJobWizardScreen extends StatefulWidget {
  const EmployerPostJobWizardScreen({super.key});

  @override
  State<EmployerPostJobWizardScreen> createState() =>
      _EmployerPostJobWizardScreenState();
}

class _EmployerPostJobWizardScreenState
    extends State<EmployerPostJobWizardScreen> {
  final _actions = PlatformActionsService();
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _location = TextEditingController();
  final _experience = TextEditingController();
  final _education = TextEditingController();
  final _skills = TextEditingController();
  final _benefits = TextEditingController();
  final _salaryMin = TextEditingController();
  final _salaryMax = TextEditingController();
  final _deadline = TextEditingController();
  var _district = 'Theni';
  var _jobTypeLabel = 'Full time';
  var _salaryType = 'monthly';
  var _openings = 1;
  var _isNegotiable = true;
  var _isUrgent = false;
  var _isFeatured = false;
  var _isPremium = false;
  var _submitting = false;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _location.dispose();
    _experience.dispose();
    _education.dispose();
    _skills.dispose();
    _benefits.dispose();
    _salaryMin.dispose();
    _salaryMax.dispose();
    _deadline.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>?> _loadCompany() async {
    final uid = _currentUid();
    if (uid.isEmpty) return null;
    final snap = await FirebaseFirestore.instance
        .collection('companies')
        .where('ownerId', isEqualTo: uid)
        .limit(1)
        .get();
    if (snap.docs.isEmpty) return null;
    return _docData(snap.docs.first);
  }

  Future<void> _pickDeadline() async {
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked == null) return;
    _deadline.text = DateFormat('yyyy-MM-dd').format(picked);
  }

  Future<void> _submit(String companyId) async {
    if (_title.text.trim().isEmpty || _description.text.trim().isEmpty) {
      _snack('Job title and description are required.');
      return;
    }
    setState(() => _submitting = true);
    try {
      final result = await _actions.createJobPosting(
        CreateJobPostingInput(
          companyId: companyId,
          title: _title.text.trim(),
          description: _description.text.trim(),
          jobType: _jobTypeValues[_jobTypeLabel] ?? 'full_time',
          location: _location.text.trim(),
          district: _district,
          openings: _openings,
          experience: _experience.text.trim(),
          education: _education.text.trim(),
          skills: _csv(_skills.text),
          salaryMin: num.tryParse(_salaryMin.text.trim()),
          salaryMax: num.tryParse(_salaryMax.text.trim()),
          salaryType: _salaryType,
          isNegotiable: _isNegotiable,
          benefits: _csv(_benefits.text),
          deadline: _deadline.text.trim(),
          isPremium: _isPremium,
          isUrgent: _isUrgent,
          isFeatured: _isFeatured,
        ),
      );
      if (!mounted) return;
      setState(() => _submitting = false);
      _snack('Job submitted for admin approval. ID: ${result.jobId}');
      context.push('/employer/jobs');
    } catch (err) {
      if (!mounted) return;
      setState(() => _submitting = false);
      _snack('Job posting failed: $err');
    }
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return PortalScaffold(
      title: 'Post Job',
      subtitle:
          'Create a pending job through the same Cloud Function approval gate as the web app.',
      icon: Icons.post_add_outlined,
      color: AppTheme.brandEmerald,
      children: [
        FutureBuilder<Map<String, dynamic>?>(
          future: _loadCompany(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            final company = snapshot.data;
            if (company == null) {
              return const _EmptyPortalState(
                title: 'Company profile required',
                body: 'Create a company before posting jobs.',
                icon: Icons.business_outlined,
              );
            }
            return _PortalCard(
              child: Column(
                children: [
                  _PortalField(
                    controller: _title,
                    label: 'Job title *',
                    icon: Icons.work_outline,
                  ),
                  const SizedBox(height: 12),
                  _PortalField(
                    controller: _description,
                    label: 'Description *',
                    icon: Icons.notes_outlined,
                    maxLines: 5,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _PortalSelect(
                          label: 'Job type',
                          value: _jobTypeLabel,
                          values: _jobTypeValues.keys.toList(),
                          icon: Icons.schedule_outlined,
                          onChanged: (value) =>
                              setState(() => _jobTypeLabel = value),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _PortalSelect(
                          label: 'District',
                          value: _district,
                          values: _districts,
                          icon: Icons.place_outlined,
                          onChanged: (value) =>
                              setState(() => _district = value),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _PortalField(
                    controller: _location,
                    label: 'Location / area',
                    icon: Icons.location_on_outlined,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _PortalField(
                          controller: _experience,
                          label: 'Experience',
                          icon: Icons.timeline_outlined,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _PortalField(
                          controller: _education,
                          label: 'Education',
                          icon: Icons.school_outlined,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _PortalField(
                    controller: _skills,
                    label: 'Skills (comma separated)',
                    icon: Icons.psychology_outlined,
                  ),
                  const SizedBox(height: 12),
                  _PortalField(
                    controller: _benefits,
                    label: 'Benefits (comma separated)',
                    icon: Icons.card_giftcard_outlined,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _PortalField(
                          controller: _salaryMin,
                          label: 'Salary min',
                          icon: Icons.currency_rupee_outlined,
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _PortalField(
                          controller: _salaryMax,
                          label: 'Salary max',
                          icon: Icons.currency_rupee_outlined,
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _PortalSelect(
                          label: 'Salary type',
                          value: _salaryType,
                          values: const [
                            'monthly',
                            'yearly',
                            'daily',
                            'hourly',
                          ],
                          icon: Icons.payments_outlined,
                          onChanged: (value) =>
                              setState(() => _salaryType = value),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _deadline,
                          readOnly: true,
                          onTap: _pickDeadline,
                          decoration: InputDecoration(
                            labelText: 'Deadline',
                            prefixIcon: const Icon(Icons.event_outlined),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Stepper(
                    margin: EdgeInsets.zero,
                    physics: const NeverScrollableScrollPhysics(),
                    controlsBuilder: (context, details) =>
                        const SizedBox.shrink(),
                    steps: [
                      Step(
                        title: const Text('Details'),
                        content: Text(
                          _title.text.trim().isEmpty
                              ? 'Complete the title and description above.'
                              : _title.text.trim(),
                        ),
                        isActive: true,
                      ),
                      Step(
                        title: const Text('Requirements'),
                        content: Text(
                          _skills.text.trim().isEmpty
                              ? 'Add skills and education.'
                              : _skills.text.trim(),
                        ),
                        isActive: true,
                      ),
                      Step(
                        title: const Text('Compensation'),
                        content: Text(
                          _isNegotiable ? 'Negotiable' : 'Fixed range entered',
                        ),
                        isActive: true,
                      ),
                      const Step(
                        title: Text('Approval'),
                        content: Text(
                          'New jobs are saved as pending and inactive.',
                        ),
                        isActive: true,
                      ),
                    ],
                  ),
                  SwitchListTile(
                    value: _isNegotiable,
                    onChanged: (value) => setState(() => _isNegotiable = value),
                    title: const Text('Salary negotiable'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  SwitchListTile(
                    value: _isUrgent,
                    onChanged: (value) => setState(() => _isUrgent = value),
                    title: const Text('Urgent badge'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  SwitchListTile(
                    value: _isFeatured,
                    onChanged: (value) => setState(() => _isFeatured = value),
                    title: const Text('Featured listing'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  SwitchListTile(
                    value: _isPremium,
                    onChanged: (value) => setState(() => _isPremium = value),
                    title: const Text('Premium badge'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  Row(
                    children: [
                      const Text('Openings'),
                      const Spacer(),
                      IconButton(
                        onPressed: _openings <= 1
                            ? null
                            : () => setState(() => _openings--),
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text('$_openings'),
                      IconButton(
                        onPressed: () => setState(() => _openings++),
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: FilledButton.icon(
                      onPressed: _submitting
                          ? null
                          : () => _submit(company['id'] as String),
                      icon: _submitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.send_outlined),
                      label: Text(
                        _submitting ? 'Submitting...' : 'Submit for Approval',
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

class EmployerCandidatesPipelineScreen extends StatefulWidget {
  const EmployerCandidatesPipelineScreen({super.key});

  @override
  State<EmployerCandidatesPipelineScreen> createState() =>
      _EmployerCandidatesPipelineScreenState();
}

class _EmployerCandidatesPipelineScreenState
    extends State<EmployerCandidatesPipelineScreen> {
  final _service = FirestoreService();
  var _status = 'all';

  Future<Map<String, dynamic>?> _loadCompany() async {
    final uid = _currentUid();
    if (uid.isEmpty) return null;
    final snap = await FirebaseFirestore.instance
        .collection('companies')
        .where('ownerId', isEqualTo: uid)
        .limit(1)
        .get();
    if (snap.docs.isEmpty) return null;
    return _docData(snap.docs.first);
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> _applications(String companyId) {
    var query = FirebaseFirestore.instance
        .collection('applications')
        .where('companyId', isEqualTo: companyId);
    if (_status != 'all') query = query.where('status', isEqualTo: _status);
    return query.orderBy('createdAt', descending: true).snapshots();
  }

  Future<void> _changeStatus(String applicationId, String status) async {
    try {
      await _service.updateApplicationStatus(applicationId, status);
      _snack('Candidate moved to ${status.replaceAll('_', ' ')}.');
    } catch (err) {
      _snack('Status update failed: $err');
    }
  }

  Future<void> _scheduleInterview(Map<String, dynamic> application) async {
    final date = TextEditingController();
    final time = TextEditingController();
    final location = TextEditingController();
    final notes = TextEditingController();
    var mode = 'phone';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Schedule Interview'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: date,
                      readOnly: true,
                      decoration: const InputDecoration(labelText: 'Date'),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(
                            const Duration(days: 365),
                          ),
                          initialDate: DateTime.now().add(
                            const Duration(days: 2),
                          ),
                        );
                        if (picked != null) {
                          date.text = DateFormat('yyyy-MM-dd').format(picked);
                        }
                      },
                    ),
                    TextField(
                      controller: time,
                      decoration: const InputDecoration(
                        labelText: 'Time',
                        hintText: '10:30 AM',
                      ),
                    ),
                    DropdownButtonFormField<String>(
                      initialValue: mode,
                      decoration: const InputDecoration(labelText: 'Mode'),
                      items: const [
                        DropdownMenuItem(value: 'phone', child: Text('Phone')),
                        DropdownMenuItem(value: 'video', child: Text('Video')),
                        DropdownMenuItem(
                          value: 'in_person',
                          child: Text('In person'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value != null) setDialogState(() => mode = value);
                      },
                    ),
                    TextField(
                      controller: location,
                      decoration: const InputDecoration(
                        labelText: 'Location / link',
                      ),
                    ),
                    TextField(
                      controller: notes,
                      maxLines: 3,
                      decoration: const InputDecoration(labelText: 'Notes'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext, false),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(dialogContext, true),
                  child: const Text('Schedule'),
                ),
              ],
            );
          },
        );
      },
    );

    if (confirmed != true) {
      date.dispose();
      time.dispose();
      location.dispose();
      notes.dispose();
      return;
    }
    if (date.text.trim().isEmpty || time.text.trim().isEmpty) {
      _snack('Date and time are required.');
      return;
    }

    try {
      await _service.scheduleInterview(
        applicationId: application['id'] as String,
        date: date.text.trim(),
        time: time.text.trim(),
        mode: mode,
        location: location.text.trim(),
        notes: notes.text.trim(),
      );
      _snack('Interview scheduled and candidate notified.');
    } catch (err) {
      _snack('Interview scheduling failed: $err');
    } finally {
      date.dispose();
      time.dispose();
      location.dispose();
      notes.dispose();
    }
  }

  Future<void> _openResume(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      _snack('Could not open resume.');
    }
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    const statuses = [
      'all',
      'applied',
      'shortlisted',
      'interview_scheduled',
      'selected',
      'rejected',
    ];
    return PortalScaffold(
      title: 'Candidates',
      subtitle:
          'Manage candidate pipeline with Cloud Function status updates and interview scheduling.',
      icon: Icons.groups_outlined,
      color: AppTheme.primaryPurple,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: statuses.map((status) {
            final selected = status == _status;
            return ChoiceChip(
              selected: selected,
              label: Text(status.replaceAll('_', ' ')),
              onSelected: (_) => setState(() => _status = status),
            );
          }).toList(),
        ),
        const SizedBox(height: 14),
        FutureBuilder<Map<String, dynamic>?>(
          future: _loadCompany(),
          builder: (context, companySnap) {
            if (companySnap.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            final company = companySnap.data;
            if (company == null) {
              return const _EmptyPortalState(
                title: 'Company required',
                body: 'Create a company before reviewing candidates.',
                icon: Icons.business_outlined,
              );
            }
            return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: _applications(company['id'] as String),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }
                final docs = snapshot.data?.docs ?? const [];
                if (docs.isEmpty) {
                  return const _EmptyPortalState(
                    title: 'No candidates',
                    body: 'Applications will appear here once seekers apply.',
                    icon: Icons.group_outlined,
                  );
                }
                return Column(
                  children: docs.map((doc) {
                    final data = _docData(doc);
                    final resumeUrl = _stringValue(data['resumeUrl']);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _PortalCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const CircleAvatar(
                                  child: Icon(Icons.person_outline),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _stringValue(
                                          data['seekerName'],
                                          'Candidate',
                                        ),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 16,
                                        ),
                                      ),
                                      Text(
                                        _stringValue(
                                          data['jobTitle'],
                                          'Applied role',
                                        ),
                                        style: const TextStyle(
                                          color: AppTheme.lightTextSecondary,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        children: [
                                          _TinyMetaChip(
                                            label: _stringValue(
                                              data['status'],
                                              'applied',
                                            ).replaceAll('_', ' '),
                                            color: AppTheme.primaryPurple,
                                          ),
                                          if (_stringValue(
                                            data['seekerEmail'],
                                          ).isNotEmpty)
                                            _TinyMetaChip(
                                              label: _stringValue(
                                                data['seekerEmail'],
                                              ),
                                            ),
                                          if (_stringValue(
                                            data['seekerPhone'],
                                          ).isNotEmpty)
                                            _TinyMetaChip(
                                              label: _stringValue(
                                                data['seekerPhone'],
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (_stringValue(
                              data['coverLetter'],
                            ).isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Text(_stringValue(data['coverLetter'])),
                            ],
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: () => _changeStatus(
                                    data['id'] as String,
                                    'shortlisted',
                                  ),
                                  icon: const Icon(Icons.star_border_rounded),
                                  label: const Text('Shortlist'),
                                ),
                                OutlinedButton.icon(
                                  onPressed: () => _changeStatus(
                                    data['id'] as String,
                                    'selected',
                                  ),
                                  icon: const Icon(Icons.check_circle_outline),
                                  label: const Text('Select'),
                                ),
                                OutlinedButton.icon(
                                  onPressed: () => _changeStatus(
                                    data['id'] as String,
                                    'rejected',
                                  ),
                                  icon: const Icon(Icons.cancel_outlined),
                                  label: const Text('Reject'),
                                ),
                                OutlinedButton.icon(
                                  onPressed: () => _scheduleInterview(data),
                                  icon: const Icon(
                                    Icons.event_available_outlined,
                                  ),
                                  label: const Text('Schedule'),
                                ),
                                OutlinedButton.icon(
                                  onPressed: resumeUrl.isEmpty
                                      ? null
                                      : () => _openResume(resumeUrl),
                                  icon: const Icon(Icons.open_in_new_outlined),
                                  label: const Text('Resume'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
            );
          },
        ),
      ],
    );
  }
}

class EmployerTalentSearchConcreteScreen extends StatefulWidget {
  const EmployerTalentSearchConcreteScreen({super.key});

  @override
  State<EmployerTalentSearchConcreteScreen> createState() =>
      _EmployerTalentSearchConcreteScreenState();
}

class _EmployerTalentSearchConcreteScreenState
    extends State<EmployerTalentSearchConcreteScreen> {
  final _actions = PlatformActionsService();
  final _search = TextEditingController();
  var _district = 'All Districts';
  var _experience = 'All Experience';
  Future<TalentSearchResult>? _future;

  @override
  void initState() {
    super.initState();
    _future = _runSearch();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<TalentSearchResult> _runSearch() {
    return _actions.searchTalent(
      TalentSearchInput(
        search: _search.text,
        district: _district,
        experience: _experience,
      ),
    );
  }

  void _refresh() {
    setState(() => _future = _runSearch());
  }

  @override
  Widget build(BuildContext context) {
    return PortalScaffold(
      title: 'Talent Search',
      subtitle:
          'Rules-safe candidate discovery through the searchTalent Cloud Function with redacted contact data.',
      icon: Icons.manage_search_outlined,
      color: AppTheme.brandEmerald,
      children: [
        _PortalCard(
          child: Column(
            children: [
              _PortalField(
                controller: _search,
                label: 'Skill, role or name',
                icon: Icons.search_outlined,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _PortalSelect(
                      label: 'District',
                      value: _district,
                      values: const ['All Districts', ..._districts],
                      icon: Icons.place_outlined,
                      onChanged: (value) => setState(() => _district = value),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _PortalSelect(
                      label: 'Experience',
                      value: _experience,
                      values: const [
                        'All Experience',
                        'Fresher',
                        '1-3 Years',
                        '3+ Years',
                      ],
                      icon: Icons.timeline_outlined,
                      onChanged: (value) => setState(() => _experience = value),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _refresh,
                  icon: const Icon(Icons.search),
                  label: const Text('Search Talent'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        FutureBuilder<TalentSearchResult>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            if (snapshot.hasError) {
              return _EmptyPortalState(
                title: 'Search unavailable',
                body: snapshot.error.toString(),
                icon: Icons.lock_outline,
              );
            }
            final result = snapshot.data;
            final candidates = result?.candidates ?? const [];
            if (candidates.isEmpty) {
              return const _EmptyPortalState(
                title: 'No candidates found',
                body: 'Try a broader search or district.',
                icon: Icons.person_search_outlined,
              );
            }
            return Column(
              children: [
                _PortalCard(
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Plan: ${result?.plan ?? 'free'}',
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      _TinyMetaChip(
                        label: result?.contactAccess == true
                            ? 'contact access'
                            : 'contacts redacted',
                        color: result?.contactAccess == true
                            ? AppTheme.brandEmerald
                            : AppTheme.brandAmber,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                ...candidates.map((candidate) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _PortalCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundImage: candidate.photoUrl.isEmpty
                                    ? null
                                    : NetworkImage(candidate.photoUrl),
                                child: candidate.photoUrl.isEmpty
                                    ? const Icon(Icons.person_outline)
                                    : null,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      candidate.name,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w900,
                                        fontSize: 16,
                                      ),
                                    ),
                                    Text(candidate.currentRole),
                                  ],
                                ),
                              ),
                              _TinyMetaChip(
                                label: '${candidate.profileStrength}%',
                                color: AppTheme.brandEmerald,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _TinyMetaChip(label: candidate.district),
                              _TinyMetaChip(
                                label: '${candidate.experienceYears} yrs',
                              ),
                              if (!candidate.canViewContact)
                                _TinyMetaChip(
                                  label: candidate.contactGateReason.replaceAll(
                                    '_',
                                    ' ',
                                  ),
                                  color: AppTheme.brandAmber,
                                ),
                              if (candidate.canViewContact &&
                                  candidate.email.isNotEmpty)
                                _TinyMetaChip(label: candidate.email),
                              if (candidate.canViewContact &&
                                  candidate.phone.isNotEmpty)
                                _TinyMetaChip(label: candidate.phone),
                            ],
                          ),
                          if (candidate.skills.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: candidate.skills
                                  .take(10)
                                  .map((skill) => Chip(label: Text(skill)))
                                  .toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                }),
              ],
            );
          },
        ),
      ],
    );
  }
}
