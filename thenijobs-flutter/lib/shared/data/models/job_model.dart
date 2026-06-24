import 'package:cloud_firestore/cloud_firestore.dart';
import 'company_model.dart';

enum JobType {
  fullTime,
  partTime,
  internship,
  remote,
  workFromHome,
  fresher,
  contract;

  static JobType fromString(String value) {
    switch (value) {
      case 'full_time':
        return JobType.fullTime;
      case 'part_time':
        return JobType.partTime;
      case 'internship':
        return JobType.internship;
      case 'remote':
        return JobType.remote;
      case 'work_from_home':
        return JobType.workFromHome;
      case 'fresher':
        return JobType.fresher;
      case 'contract':
        return JobType.contract;
      default:
        throw ArgumentError('Unknown JobType: $value');
    }
  }

  String toJson() {
    switch (this) {
      case JobType.fullTime:
        return 'full_time';
      case JobType.partTime:
        return 'part_time';
      case JobType.internship:
        return 'internship';
      case JobType.remote:
        return 'remote';
      case JobType.workFromHome:
        return 'work_from_home';
      case JobType.fresher:
        return 'fresher';
      case JobType.contract:
        return 'contract';
    }
  }
}

class Job {
  final String id;
  final String slug;
  final String companyId;
  final Company? company;
  final String companyName;
  final String title;
  final String category;
  final String description;
  final List<String> requirements;
  final List<String> skills;
  final String location;
  final String district;
  final JobType jobType;
  final double? salaryMin;
  final double? salaryMax;
  final String experience;
  final String? education;
  final int openings;
  final DateTime? deadline;
  final bool isActive;
  final bool isPremium;
  final bool isFeatured;
  final bool isUrgent;
  final int applicationsCount;
  final int viewCount;
  final String postedBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  Job({
    required this.id,
    required this.slug,
    required this.companyId,
    this.company,
    required this.companyName,
    required this.title,
    required this.category,
    required this.description,
    required this.requirements,
    required this.skills,
    required this.location,
    required this.district,
    required this.jobType,
    this.salaryMin,
    this.salaryMax,
    required this.experience,
    this.education,
    required this.openings,
    this.deadline,
    required this.isActive,
    required this.isPremium,
    required this.isFeatured,
    required this.isUrgent,
    required this.applicationsCount,
    required this.viewCount,
    required this.postedBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Job.fromFirestore(Map<String, dynamic> data, String id) {
    return Job(
      id: id,
      slug: data['slug'] as String? ?? '',
      companyId: data['companyId'] as String? ?? '',
      company: data['company'] != null
          ? Company.fromFirestore(
              data['company'] as Map<String, dynamic>,
              data['companyId'] as String? ?? '',
            )
          : null,
      companyName: data['companyName'] as String? ?? '',
      title: data['title'] as String? ?? '',
      category: data['category'] as String? ?? '',
      description: data['description'] as String? ?? '',
      requirements:
          (data['requirements'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      skills:
          (data['skills'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      location: data['location'] as String? ?? '',
      district: data['district'] as String? ?? '',
      jobType: data['jobType'] != null
          ? JobType.fromString(data['jobType'] as String)
          : JobType.fullTime,
      salaryMin: (data['salaryMin'] as num?)?.toDouble(),
      salaryMax: (data['salaryMax'] as num?)?.toDouble(),
      experience: data['experience'] as String? ?? '',
      education: data['education'] as String?,
      openings: (data['openings'] as num? ?? 1).toInt(),
      deadline: data['deadline'] != null
          ? (data['deadline'] as Timestamp).toDate()
          : null,
      isActive: data['isActive'] as bool? ?? false,
      isPremium: data['isPremium'] as bool? ?? false,
      isFeatured: data['isFeatured'] as bool? ?? false,
      isUrgent: data['isUrgent'] as bool? ?? false,
      applicationsCount: (data['applicationsCount'] as num? ?? 0).toInt(),
      viewCount: (data['viewCount'] as num? ?? 0).toInt(),
      postedBy: data['postedBy'] as String? ?? '',
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
      'slug': slug,
      'companyId': companyId,
      'companyName': companyName,
      'title': title,
      'category': category,
      if (company != null) 'company': company!.toFirestore(),
      'description': description,
      'requirements': requirements,
      'skills': skills,
      'location': location,
      'district': district,
      'jobType': jobType.toJson(),
      if (salaryMin != null) 'salaryMin': salaryMin,
      if (salaryMax != null) 'salaryMax': salaryMax,
      'experience': experience,
      if (education != null) 'education': education,
      'openings': openings,
      if (deadline != null) 'deadline': Timestamp.fromDate(deadline!),
      'isActive': isActive,
      'isPremium': isPremium,
      'isFeatured': isFeatured,
      'isUrgent': isUrgent,
      'applicationsCount': applicationsCount,
      'viewCount': viewCount,
      'postedBy': postedBy,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}
