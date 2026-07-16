import 'package:thenijobs/models/company.dart';
import 'package:thenijobs/utils/helpers.dart';

// ===== ENUMS =====

enum JobType {
  fullTime('full_time', 'Full Time'),
  partTime('part_time', 'Part Time'),
  internship('internship', 'Internship'),
  remote('remote', 'Remote'),
  workFromHome('work_from_home', 'Work From Home'),
  fresher('fresher', 'Fresher'),
  contract('contract', 'Contract');

  final String value;
  final String label;
  const JobType(this.value, this.label);

  static JobType fromString(String? value) {
    return JobType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => JobType.fullTime,
    );
  }
}

enum ApplicationStatus {
  applied('applied', 'Applied'),
  pendingReview('pending_review', 'Pending Review'),
  underReview('under_review', 'Under Review'),
  shortlisted('shortlisted', 'Shortlisted'),
  approved('approved', 'Approved'),
  interviewScheduled('interview_scheduled', 'Interview Scheduled'),
  interviewAttended('interview_attended', 'Interview Attended'),
  walkInAttended('walk_in_attended', 'Walk-In Attended'),
  selected('selected', 'Selected'),
  rejected('rejected', 'Rejected');

  final String value;
  final String label;
  const ApplicationStatus(this.value, this.label);

  static ApplicationStatus fromString(String? value) {
    return ApplicationStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => ApplicationStatus.applied,
    );
  }
}

// ===== WALK-IN DETAILS =====

class WalkInDetails {
  final String date;
  final String time;
  final String venue;
  final String contactPerson;
  final String contactMobile;

  const WalkInDetails({
    required this.date,
    required this.time,
    required this.venue,
    required this.contactPerson,
    required this.contactMobile,
  });

  factory WalkInDetails.fromMap(Map<String, dynamic>? map) {
    if (map == null) {
      return const WalkInDetails(
        date: '', time: '', venue: '', contactPerson: '', contactMobile: '',
      );
    }
    return WalkInDetails(
      date: map['date'] ?? '',
      time: map['time'] ?? '',
      venue: map['venue'] ?? '',
      contactPerson: map['contactPerson'] ?? '',
      contactMobile: map['contactMobile'] ?? '',
    );
  }

  Map<String, dynamic> toMap() => {
    'date': date, 'time': time, 'venue': venue,
    'contactPerson': contactPerson, 'contactMobile': contactMobile,
  };
}

// ===== JOB =====

class Job {
  final String id;
  final String slug;
  final String companyId;
  final Company? company;
  final String title;
  final String? category;
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
  final String? status;
  final String? planType;
  final bool? isWalkIn;
  final WalkInDetails? walkIn;
  final int applicationsCount;
  final int viewCount;
  final String postedBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Job({
    required this.id,
    required this.slug,
    required this.companyId,
    this.company,
    required this.title,
    this.category,
    required this.description,
    this.requirements = const [],
    this.skills = const [],
    required this.location,
    required this.district,
    required this.jobType,
    this.salaryMin,
    this.salaryMax,
    required this.experience,
    this.education,
    this.openings = 1,
    this.deadline,
    this.isActive = true,
    this.isPremium = false,
    this.isFeatured = false,
    this.isUrgent = false,
    this.status,
    this.planType,
    this.isWalkIn,
    this.walkIn,
    this.applicationsCount = 0,
    this.viewCount = 0,
    required this.postedBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Job.fromMap(Map<String, dynamic> map, String id) {
    return Job(
      id: id,
      slug: map['slug'] ?? '',
      companyId: map['companyId'] ?? '',
      title: map['title'] ?? '',
      category: map['category'],
      description: map['description'] ?? '',
      requirements: toStringList(map['requirements']),
      skills: toStringList(map['skills']),
      location: map['location'] ?? '',
      district: map['district'] ?? '',
      jobType: JobType.fromString(map['jobType']),
      salaryMin: (map['salaryMin'] as num?)?.toDouble(),
      salaryMax: (map['salaryMax'] as num?)?.toDouble(),
      experience: map['experience'] ?? 'Fresher',
      education: map['education'],
      openings: map['openings'] ?? 1,
      deadline: toDateTime(map['deadline']),
      isActive: map['isActive'] ?? true,
      isPremium: map['isPremium'] ?? false,
      isFeatured: map['isFeatured'] ?? false,
      isUrgent: map['isUrgent'] ?? false,
      status: map['status'],
      planType: map['planType'],
      isWalkIn: map['isWalkIn'],
      walkIn: map['walkIn'] != null
          ? WalkInDetails.fromMap(map['walkIn'] as Map<String, dynamic>)
          : null,
      applicationsCount: map['applicationsCount'] ?? 0,
      viewCount: map['viewCount'] ?? 0,
      postedBy: map['postedBy'] ?? '',
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'slug': slug,
      'companyId': companyId,
      'title': title,
      'category': category,
      'description': description,
      'requirements': requirements,
      'skills': skills,
      'location': location,
      'district': district,
      'jobType': jobType.value,
      'salaryMin': salaryMin,
      'salaryMax': salaryMax,
      'experience': experience,
      'education': education,
      'openings': openings,
      'deadline': deadline,
      'isActive': isActive,
      'isPremium': isPremium,
      'isFeatured': isFeatured,
      'isUrgent': isUrgent,
      'status': status,
      'planType': planType,
      'isWalkIn': isWalkIn,
      'walkIn': walkIn?.toMap(),
      'applicationsCount': applicationsCount,
      'viewCount': viewCount,
      'postedBy': postedBy,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  /// Formatted salary string for display
  String get salaryDisplay {
    if (salaryMin == null && salaryMax == null) return 'Not disclosed';
    if (salaryMin != null && salaryMax != null) {
      return '₹${_formatNumber(salaryMin!)} - ₹${_formatNumber(salaryMax!)}';
    }
    if (salaryMin != null) return '₹${_formatNumber(salaryMin!)}+';
    return 'Up to ₹${_formatNumber(salaryMax!)}';
  }

  String _formatNumber(double n) {
    if (n >= 100000) return '${(n / 100000).toStringAsFixed(1)}L';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}K';
    return n.toStringAsFixed(0);
  }
}

// ===== JOB APPLICATION =====

class JobApplication {
  final String id;
  final String jobId;
  final Job? job;
  final String? companyId;
  final String? companyName;
  final String seekerId;
  final String? applicationType;
  final WalkInDetails? walkIn;
  final String? resumeUrl;
  final String? coverLetter;
  final ApplicationStatus status;
  final String? employerNote;
  final DateTime? interviewDate;
  final DateTime appliedAt;
  final DateTime updatedAt;

  const JobApplication({
    required this.id,
    required this.jobId,
    this.job,
    this.companyId,
    this.companyName,
    required this.seekerId,
    this.applicationType,
    this.walkIn,
    this.resumeUrl,
    this.coverLetter,
    required this.status,
    this.employerNote,
    this.interviewDate,
    required this.appliedAt,
    required this.updatedAt,
  });

  factory JobApplication.fromMap(Map<String, dynamic> map, String id) {
    return JobApplication(
      id: id,
      jobId: map['jobId'] ?? '',
      companyId: map['companyId'],
      companyName: map['companyName'],
      seekerId: map['seekerId'] ?? '',
      applicationType: map['applicationType'],
      walkIn: map['walkIn'] != null
          ? WalkInDetails.fromMap(map['walkIn'] as Map<String, dynamic>)
          : null,
      resumeUrl: map['resumeUrl'],
      coverLetter: map['coverLetter'],
      status: ApplicationStatus.fromString(map['status']),
      employerNote: map['employerNote'],
      interviewDate: toDateTime(map['interviewDate']),
      appliedAt: toDateTimeRequired(map['appliedAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'jobId': jobId,
      'companyId': companyId,
      'companyName': companyName,
      'seekerId': seekerId,
      'applicationType': applicationType,
      'walkIn': walkIn?.toMap(),
      'resumeUrl': resumeUrl,
      'coverLetter': coverLetter,
      'status': status.value,
      'employerNote': employerNote,
      'interviewDate': interviewDate,
      'appliedAt': appliedAt,
      'updatedAt': updatedAt,
    };
  }
}
