import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const String _functionsRegion = 'asia-south1';

class CreateJobPostingInput {
  const CreateJobPostingInput({
    required this.companyId,
    required this.title,
    required this.description,
    required this.jobType,
    required this.district,
    required this.openings,
    required this.salaryType,
    required this.isNegotiable,
    required this.benefits,
    required this.skills,
    required this.isPremium,
    required this.isUrgent,
    required this.isFeatured,
    this.location,
    this.experience,
    this.education,
    this.salaryMin,
    this.salaryMax,
    this.deadline,
  });

  final String companyId;
  final String title;
  final String description;
  final String jobType;
  final String? location;
  final String district;
  final int openings;
  final String? experience;
  final String? education;
  final List<String> skills;
  final num? salaryMin;
  final num? salaryMax;
  final String salaryType;
  final bool isNegotiable;
  final List<String> benefits;
  final String? deadline;
  final bool isPremium;
  final bool isUrgent;
  final bool isFeatured;

  Map<String, Object?> toCallableData() {
    return {
      'companyId': companyId,
      'title': title,
      'description': description,
      'jobType': jobType,
      if (location != null && location!.isNotEmpty) 'location': location,
      'district': district,
      'openings': openings,
      if (experience != null && experience!.isNotEmpty)
        'experience': experience,
      if (education != null && education!.isNotEmpty) 'education': education,
      'skills': skills,
      'salaryMin': salaryMin,
      'salaryMax': salaryMax,
      'salaryType': salaryType,
      'isNegotiable': isNegotiable,
      'benefits': benefits,
      'deadline': deadline,
      'isPremium': isPremium,
      'isUrgent': isUrgent,
      'isFeatured': isFeatured,
    };
  }
}

class CreateJobPostingResult {
  const CreateJobPostingResult({
    required this.jobId,
    required this.plan,
    required this.remainingJobSlots,
  });

  final String jobId;
  final String plan;
  final int? remainingJobSlots;

  factory CreateJobPostingResult.fromMap(Map<Object?, Object?> data) {
    return CreateJobPostingResult(
      jobId: data['jobId']?.toString() ?? '',
      plan: data['plan']?.toString() ?? 'free',
      remainingJobSlots: data['remainingJobSlots'] is num
          ? (data['remainingJobSlots'] as num).toInt()
          : null,
    );
  }
}

class SyncMobileVerificationResult {
  const SyncMobileVerificationResult({
    required this.phone,
    required this.mobileVerified,
  });

  final String phone;
  final bool mobileVerified;

  factory SyncMobileVerificationResult.fromMap(Map<Object?, Object?> data) {
    return SyncMobileVerificationResult(
      phone: data['phone']?.toString() ?? '',
      mobileVerified: data['mobileVerified'] == true,
    );
  }
}

class TalentSearchInput {
  const TalentSearchInput({
    this.search = '',
    this.district = 'All Districts',
    this.experience = 'All Experience',
    this.limit = 30,
  });

  final String search;
  final String district;
  final String experience;
  final int limit;

  Map<String, Object?> toCallableData() {
    return {
      'search': search.trim(),
      'district': district,
      'experience': experience,
      'limit': limit,
    };
  }
}

class TalentEducationRecord {
  const TalentEducationRecord({
    required this.degree,
    required this.field,
    required this.institution,
    required this.year,
  });

  final String degree;
  final String field;
  final String institution;
  final String year;

  factory TalentEducationRecord.fromMap(Map<Object?, Object?> data) {
    return TalentEducationRecord(
      degree: _stringValue(data['degree']),
      field: _stringValue(data['field']),
      institution: _stringValue(data['institution']),
      year: _stringValue(data['year']),
    );
  }
}

class TalentExperienceRecord {
  const TalentExperienceRecord({
    required this.role,
    required this.company,
    required this.startDate,
    required this.endDate,
    required this.description,
  });

  final String role;
  final String company;
  final String startDate;
  final String endDate;
  final String description;

  factory TalentExperienceRecord.fromMap(Map<Object?, Object?> data) {
    return TalentExperienceRecord(
      role: _stringValue(data['role']),
      company: _stringValue(data['company']),
      startDate: _stringValue(data['startDate']),
      endDate: _stringValue(data['endDate']),
      description: _stringValue(data['description']),
    );
  }
}

class TalentSearchCandidate {
  const TalentSearchCandidate({
    required this.id,
    required this.name,
    required this.currentRole,
    required this.district,
    required this.photoUrl,
    required this.skills,
    required this.education,
    required this.experience,
    required this.portfolioLinks,
    required this.experienceYears,
    required this.profileStrength,
    required this.isOpenToWork,
    required this.canViewContact,
    required this.contactGateReason,
    required this.email,
    required this.phone,
  });

  final String id;
  final String name;
  final String currentRole;
  final String district;
  final String photoUrl;
  final List<String> skills;
  final List<TalentEducationRecord> education;
  final List<TalentExperienceRecord> experience;
  final List<String> portfolioLinks;
  final int experienceYears;
  final int profileStrength;
  final bool isOpenToWork;
  final bool canViewContact;
  final String contactGateReason;
  final String email;
  final String phone;

  factory TalentSearchCandidate.fromMap(Map<Object?, Object?> data) {
    return TalentSearchCandidate(
      id: _stringValue(data['id']),
      name: _stringValue(data['name'], 'Candidate'),
      currentRole: _stringValue(data['currentRole'], 'Job Seeker'),
      district: _stringValue(data['district'], 'Theni'),
      photoUrl: _stringValue(data['photoUrl']),
      skills: _stringList(data['skills']),
      education: _recordList(
        data['education'],
        TalentEducationRecord.fromMap,
      ),
      experience: _recordList(
        data['experience'],
        TalentExperienceRecord.fromMap,
      ),
      portfolioLinks: _stringList(data['portfolioLinks']),
      experienceYears: _intValue(data['experienceYears']),
      profileStrength: _intValue(data['profileStrength']),
      isOpenToWork: _boolValue(data['isOpenToWork'], fallback: true),
      canViewContact: _boolValue(data['canViewContact']),
      contactGateReason: _stringValue(
        data['contactGateReason'],
        'premium_required',
      ),
      email: _stringValue(data['email']),
      phone: _stringValue(data['phone']),
    );
  }
}

class TalentSearchResult {
  const TalentSearchResult({
    required this.candidates,
    required this.districts,
    required this.plan,
    required this.contactAccess,
  });

  final List<TalentSearchCandidate> candidates;
  final List<String> districts;
  final String plan;
  final bool contactAccess;

  factory TalentSearchResult.fromMap(Map<Object?, Object?> data) {
    final candidates = data['candidates'] is Iterable
        ? (data['candidates'] as Iterable)
              .map(_objectMap)
              .where((item) => item.isNotEmpty)
              .map(TalentSearchCandidate.fromMap)
              .toList(growable: false)
        : <TalentSearchCandidate>[];

    return TalentSearchResult(
      candidates: candidates,
      districts: _stringList(data['districts']),
      plan: _stringValue(data['plan'], 'free'),
      contactAccess: _boolValue(data['contactAccess']),
    );
  }
}

final platformActionsServiceProvider = Provider<PlatformActionsService>((ref) {
  return PlatformActionsService();
});

class PlatformActionsService {
  PlatformActionsService({FirebaseFunctions? functions})
    : _functions =
          functions ?? FirebaseFunctions.instanceFor(region: _functionsRegion);

  final FirebaseFunctions _functions;

  Future<CreateJobPostingResult> createJobPosting(
    CreateJobPostingInput input,
  ) async {
    final callable = _functions.httpsCallable('createJobPosting');
    final result = await callable.call<Map<Object?, Object?>>(
      input.toCallableData(),
    );
    return CreateJobPostingResult.fromMap(result.data);
  }

  Future<SyncMobileVerificationResult> syncMobileVerification() async {
    final callable = _functions.httpsCallable('syncMobileVerification');
    final result = await callable.call<Map<Object?, Object?>>(
      const <String, Object?>{},
    );
    return SyncMobileVerificationResult.fromMap(result.data);
  }

  Future<TalentSearchResult> searchTalent(TalentSearchInput input) async {
    final callable = _functions.httpsCallable('searchTalent');
    final result = await callable.call<Map<Object?, Object?>>(
      input.toCallableData(),
    );
    return TalentSearchResult.fromMap(result.data);
  }
}

String _stringValue(Object? value, [String fallback = '']) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

int _intValue(Object? value, [int fallback = 0]) {
  if (value is num) return value.toInt();
  return int.tryParse(_stringValue(value)) ?? fallback;
}

bool _boolValue(Object? value, {bool fallback = false}) {
  if (value is bool) return value;
  final text = _stringValue(value).toLowerCase();
  if (text == 'true') return true;
  if (text == 'false') return false;
  return fallback;
}

List<String> _stringList(Object? value) {
  if (value is! Iterable) return const <String>[];
  return value
      .map((item) => _stringValue(item))
      .where((item) => item.isNotEmpty)
      .toList(growable: false);
}

Map<Object?, Object?> _objectMap(Object? value) {
  if (value is Map<Object?, Object?>) return value;
  if (value is Map) {
    return Map<Object?, Object?>.fromEntries(
      value.entries.map((entry) => MapEntry(entry.key, entry.value)),
    );
  }
  return <Object?, Object?>{};
}

List<T> _recordList<T>(
  Object? value,
  T Function(Map<Object?, Object?> data) convert,
) {
  if (value is! Iterable) return <T>[];
  return value
      .map(_objectMap)
      .where((item) => item.isNotEmpty)
      .map(convert)
      .toList(growable: false);
}
