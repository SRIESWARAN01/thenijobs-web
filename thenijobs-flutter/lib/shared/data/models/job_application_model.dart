import 'package:cloud_firestore/cloud_firestore.dart';
import 'job_model.dart';
import 'seeker_profile_model.dart';

enum ApplicationStatus {
  applied,
  shortlisted,
  interviewScheduled,
  selected,
  rejected;

  static ApplicationStatus fromString(String value) {
    switch (value) {
      case 'applied':
        return ApplicationStatus.applied;
      case 'shortlisted':
        return ApplicationStatus.shortlisted;
      case 'interview_scheduled':
        return ApplicationStatus.interviewScheduled;
      case 'selected':
        return ApplicationStatus.selected;
      case 'rejected':
        return ApplicationStatus.rejected;
      default:
        throw ArgumentError('Unknown ApplicationStatus: $value');
    }
  }

  String toJson() {
    switch (this) {
      case ApplicationStatus.applied:
        return 'applied';
      case ApplicationStatus.shortlisted:
        return 'shortlisted';
      case ApplicationStatus.interviewScheduled:
        return 'interview_scheduled';
      case ApplicationStatus.selected:
        return 'selected';
      case ApplicationStatus.rejected:
        return 'rejected';
    }
  }
}

class JobApplication {
  final String id;
  final String jobId;
  final Job? job;
  final String seekerId;
  final JobSeekerProfile? seeker;
  final String? resumeUrl;
  final String? coverLetter;
  final ApplicationStatus status;
  final String? employerNote;
  final DateTime? interviewDate;
  final DateTime appliedAt;
  final DateTime updatedAt;

  JobApplication({
    required this.id,
    required this.jobId,
    this.job,
    required this.seekerId,
    this.seeker,
    this.resumeUrl,
    this.coverLetter,
    required this.status,
    this.employerNote,
    this.interviewDate,
    required this.appliedAt,
    required this.updatedAt,
  });

  factory JobApplication.fromFirestore(Map<String, dynamic> data, String id) {
    return JobApplication(
      id: id,
      jobId: data['jobId'] as String? ?? '',
      job: data['job'] != null
          ? Job.fromFirestore(
              data['job'] as Map<String, dynamic>,
              data['jobId'] as String? ?? '',
            )
          : null,
      seekerId: data['seekerId'] as String? ?? '',
      seeker: data['seeker'] != null
          ? JobSeekerProfile.fromFirestore(
              data['seeker'] as Map<String, dynamic>,
              data['seekerId'] as String? ?? '',
            )
          : null,
      // Consistency fallback for resumeUrl / resumeURL
      resumeUrl:
          (data['resumeUrl'] as String?) ?? (data['resumeURL'] as String?),
      coverLetter: data['coverLetter'] as String?,
      status: data['status'] != null
          ? ApplicationStatus.fromString(data['status'] as String)
          : ApplicationStatus.applied,
      employerNote: data['employerNote'] as String?,
      interviewDate: data['interviewDate'] != null
          ? (data['interviewDate'] as Timestamp).toDate()
          : null,
      appliedAt: data['appliedAt'] != null
          ? (data['appliedAt'] as Timestamp).toDate()
          : DateTime.now(),
      updatedAt: data['updatedAt'] != null
          ? (data['updatedAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'jobId': jobId,
      if (job != null) 'job': job!.toFirestore(),
      'seekerId': seekerId,
      if (seeker != null) 'seeker': seeker!.toFirestore(),
      if (resumeUrl != null) 'resumeUrl': resumeUrl, // Write canonical key
      if (coverLetter != null) 'coverLetter': coverLetter,
      'status': status.toJson(),
      if (employerNote != null) 'employerNote': employerNote,
      if (interviewDate != null)
        'interviewDate': Timestamp.fromDate(interviewDate!),
      'appliedAt': Timestamp.fromDate(appliedAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}
