import 'package:thenijobs/utils/helpers.dart';

class Experience {
  final String id;
  final String company;
  final String role;
  final String startDate;
  final String? endDate;
  final bool isCurrent;
  final String? description;

  const Experience({
    required this.id,
    required this.company,
    required this.role,
    required this.startDate,
    this.endDate,
    this.isCurrent = false,
    this.description,
  });

  factory Experience.fromMap(Map<String, dynamic> map) {
    return Experience(
      id: map['id'] ?? '',
      company: map['company'] ?? '',
      role: map['role'] ?? '',
      startDate: map['startDate'] ?? '',
      endDate: map['endDate'],
      isCurrent: map['isCurrent'] ?? false,
      description: map['description'],
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'company': company,
        'role': role,
        'startDate': startDate,
        'endDate': endDate,
        'isCurrent': isCurrent,
        'description': description,
      };
}

class Education {
  final String id;
  final String institution;
  final String degree;
  final String field;
  final int startYear;
  final int? endYear;
  final bool isCurrent;

  const Education({
    required this.id,
    required this.institution,
    required this.degree,
    required this.field,
    required this.startYear,
    this.endYear,
    this.isCurrent = false,
  });

  factory Education.fromMap(Map<String, dynamic> map) {
    return Education(
      id: map['id'] ?? '',
      institution: map['institution'] ?? '',
      degree: map['degree'] ?? '',
      field: map['field'] ?? '',
      startYear: map['startYear'] ?? 2020,
      endYear: map['endYear'],
      isCurrent: map['isCurrent'] ?? false,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'institution': institution,
        'degree': degree,
        'field': field,
        'startYear': startYear,
        'endYear': endYear,
        'isCurrent': isCurrent,
      };
}

class JobSeekerProfile {
  final String uid;
  final String name;
  final String phone;
  final String email;
  final String address;
  final String district;
  final String state;
  final String? profilePhotoUrl;
  final List<String> skills;
  final List<Experience> experience;
  final List<Education> education;
  final String? resumeUrl;
  final double? expectedSalary;
  final List<String> jobTypePreference; // Store values as strings
  final bool isOpenToWork;
  final int profileStrength;
  final DateTime createdAt;
  final DateTime updatedAt;

  const JobSeekerProfile({
    required this.uid,
    required this.name,
    required this.phone,
    required this.email,
    required this.address,
    required this.district,
    this.state = 'Tamil Nadu',
    this.profilePhotoUrl,
    this.skills = const [],
    this.experience = const [],
    this.education = const [],
    this.resumeUrl,
    this.expectedSalary,
    this.jobTypePreference = const [],
    this.isOpenToWork = true,
    this.profileStrength = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory JobSeekerProfile.fromMap(Map<String, dynamic> map, String id) {
    return JobSeekerProfile(
      uid: id,
      name: map['name'] ?? '',
      phone: map['phone'] ?? '',
      email: map['email'] ?? '',
      address: map['address'] ?? '',
      district: map['district'] ?? '',
      state: map['state'] ?? 'Tamil Nadu',
      profilePhotoUrl: map['profilePhotoUrl'],
      skills: toStringList(map['skills']),
      experience: (map['experience'] as List? ?? [])
          .map((x) => Experience.fromMap(Map<String, dynamic>.from(x)))
          .toList(),
      education: (map['education'] as List? ?? [])
          .map((x) => Education.fromMap(Map<String, dynamic>.from(x)))
          .toList(),
      resumeUrl: map['resumeUrl'],
      expectedSalary: (map['expectedSalary'] as num?)?.toDouble(),
      jobTypePreference: toStringList(map['jobTypePreference']),
      isOpenToWork: map['isOpenToWork'] ?? true,
      profileStrength: map['profileStrength'] ?? 0,
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'phone': phone,
      'email': email,
      'address': address,
      'district': district,
      'state': state,
      'profilePhotoUrl': profilePhotoUrl,
      'skills': skills,
      'experience': experience.map((x) => x.toMap()).toList(),
      'education': education.map((x) => x.toMap()).toList(),
      'resumeUrl': resumeUrl,
      'expectedSalary': expectedSalary,
      'jobTypePreference': jobTypePreference,
      'isOpenToWork': isOpenToWork,
      'profileStrength': profileStrength,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}
