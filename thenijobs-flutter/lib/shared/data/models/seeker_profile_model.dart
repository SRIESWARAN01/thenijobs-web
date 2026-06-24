import 'package:cloud_firestore/cloud_firestore.dart';
import 'job_model.dart';

class Experience {
  final String id;
  final String company;
  final String role;
  final String startDate;
  final String? endDate;
  final bool isCurrent;
  final String? description;

  Experience({
    required this.id,
    required this.company,
    required this.role,
    required this.startDate,
    this.endDate,
    required this.isCurrent,
    this.description,
  });

  factory Experience.fromMap(Map<String, dynamic> data) {
    return Experience(
      id: data['id'] as String? ?? '',
      company: data['company'] as String? ?? '',
      role: data['role'] as String? ?? '',
      startDate: data['startDate'] as String? ?? '',
      endDate: data['endDate'] as String?,
      isCurrent: data['isCurrent'] as bool? ?? false,
      description: data['description'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'company': company,
      'role': role,
      'startDate': startDate,
      if (endDate != null) 'endDate': endDate,
      'isCurrent': isCurrent,
      if (description != null) 'description': description,
    };
  }
}

class Education {
  final String id;
  final String institution;
  final String degree;
  final String field;
  final int startYear;
  final int? endYear;
  final bool isCurrent;

  Education({
    required this.id,
    required this.institution,
    required this.degree,
    required this.field,
    required this.startYear,
    this.endYear,
    required this.isCurrent,
  });

  factory Education.fromMap(Map<String, dynamic> data) {
    return Education(
      id: data['id'] as String? ?? '',
      institution: data['institution'] as String? ?? '',
      degree: data['degree'] as String? ?? '',
      field: data['field'] as String? ?? '',
      startYear: (data['startYear'] as num? ?? 0).toInt(),
      endYear: (data['endYear'] as num?)?.toInt(),
      isCurrent: data['isCurrent'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'institution': institution,
      'degree': degree,
      'field': field,
      'startYear': startYear,
      if (endYear != null) 'endYear': endYear,
      'isCurrent': isCurrent,
    };
  }
}

class ResumeFile {
  final String id;
  final String name;
  final String uploadDate;
  final String size;
  final bool isDefault;
  final String format;
  final String? url;
  final String? storagePath;

  ResumeFile({
    required this.id,
    required this.name,
    required this.uploadDate,
    required this.size,
    required this.isDefault,
    required this.format,
    this.url,
    this.storagePath,
  });

  factory ResumeFile.fromMap(Map<String, dynamic> data) {
    return ResumeFile(
      id: data['id'] as String? ?? '',
      name: data['name'] as String? ?? '',
      uploadDate: data['uploadDate'] as String? ?? '',
      size: data['size'] as String? ?? '',
      isDefault: data['isDefault'] as bool? ?? false,
      format: data['format'] as String? ?? 'PDF',
      url: data['url'] as String?,
      storagePath: data['storagePath'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'uploadDate': uploadDate,
      'size': size,
      'isDefault': isDefault,
      'format': format,
      if (url != null) 'url': url,
      if (storagePath != null) 'storagePath': storagePath,
    };
  }
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
  final List<ResumeFile> resumes;
  final double? expectedSalary;
  final List<JobType> jobTypePreference;
  final bool isOpenToWork;
  final double profileStrength;
  final DateTime createdAt;
  final DateTime updatedAt;

  JobSeekerProfile({
    required this.uid,
    required this.name,
    required this.phone,
    required this.email,
    required this.address,
    required this.district,
    required this.state,
    this.profilePhotoUrl,
    required this.skills,
    required this.experience,
    required this.education,
    required this.resumes,
    this.expectedSalary,
    required this.jobTypePreference,
    required this.isOpenToWork,
    required this.profileStrength,
    required this.createdAt,
    required this.updatedAt,
  });

  factory JobSeekerProfile.fromFirestore(Map<String, dynamic> data, String id) {
    return JobSeekerProfile(
      uid: id,
      name: data['name'] as String? ?? '',
      phone: data['phone'] as String? ?? '',
      email: data['email'] as String? ?? '',
      address: data['address'] as String? ?? '',
      district: data['district'] as String? ?? '',
      state: data['state'] as String? ?? '',
      profilePhotoUrl: data['profilePhotoUrl'] as String?,
      skills:
          (data['skills'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      experience:
          (data['experience'] as List<dynamic>?)
              ?.map((e) => Experience.fromMap(e as Map<String, dynamic>))
              .toList() ??
          [],
      education:
          (data['education'] as List<dynamic>?)
              ?.map((e) => Education.fromMap(e as Map<String, dynamic>))
              .toList() ??
          [],
      resumes:
          (data['resumes'] as List<dynamic>?)
              ?.map((e) => ResumeFile.fromMap(e as Map<String, dynamic>))
              .toList() ??
          [],
      expectedSalary: (data['expectedSalary'] as num?)?.toDouble(),
      jobTypePreference:
          (data['jobTypePreference'] as List<dynamic>?)
              ?.map((e) => JobType.fromString(e as String))
              .toList() ??
          [],
      isOpenToWork: data['isOpenToWork'] as bool? ?? false,
      profileStrength: (data['profileStrength'] as num? ?? 0.0).toDouble(),
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      updatedAt: data['updatedAt'] != null
          ? (data['updatedAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'phone': phone,
      'email': email,
      'address': address,
      'district': district,
      'state': state,
      if (profilePhotoUrl != null) 'profilePhotoUrl': profilePhotoUrl,
      'skills': skills,
      'experience': experience.map((e) => e.toMap()).toList(),
      'education': education.map((e) => e.toMap()).toList(),
      'resumes': resumes.map((e) => e.toMap()).toList(),
      if (expectedSalary != null) 'expectedSalary': expectedSalary,
      'jobTypePreference': jobTypePreference.map((e) => e.toJson()).toList(),
      'isOpenToWork': isOpenToWork,
      'profileStrength': profileStrength,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}
