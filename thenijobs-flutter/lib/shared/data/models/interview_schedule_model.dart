import 'package:cloud_firestore/cloud_firestore.dart';

enum InterviewMode {
  inPerson,
  phone,
  video;

  static InterviewMode fromString(String value) {
    switch (value) {
      case 'in_person':
        return InterviewMode.inPerson;
      case 'phone':
        return InterviewMode.phone;
      case 'video':
        return InterviewMode.video;
      default:
        throw ArgumentError('Unknown InterviewMode: $value');
    }
  }

  String toJson() {
    switch (this) {
      case InterviewMode.inPerson:
        return 'in_person';
      case InterviewMode.phone:
        return 'phone';
      case InterviewMode.video:
        return 'video';
    }
  }
}

enum InterviewStatus {
  scheduled,
  completed,
  cancelled,
  noShow;

  static InterviewStatus fromString(String value) {
    switch (value) {
      case 'scheduled':
        return InterviewStatus.scheduled;
      case 'completed':
        return InterviewStatus.completed;
      case 'cancelled':
        return InterviewStatus.cancelled;
      case 'no_show':
        return InterviewStatus.noShow;
      default:
        throw ArgumentError('Unknown InterviewStatus: $value');
    }
  }

  String toJson() {
    switch (this) {
      case InterviewStatus.scheduled:
        return 'scheduled';
      case InterviewStatus.completed:
        return 'completed';
      case InterviewStatus.cancelled:
        return 'cancelled';
      case InterviewStatus.noShow:
        return 'no_show';
    }
  }
}

class InterviewSchedule {
  final String id;
  final String applicationId;
  final String jobId;
  final String employerId;
  final String seekerId;
  final String date;
  final String time;
  final InterviewMode mode;
  final String? location;
  final String? meetingLink;
  final InterviewStatus status;
  final String? notes;
  final DateTime createdAt;

  InterviewSchedule({
    required this.id,
    required this.applicationId,
    required this.jobId,
    required this.employerId,
    required this.seekerId,
    required this.date,
    required this.time,
    required this.mode,
    this.location,
    this.meetingLink,
    required this.status,
    this.notes,
    required this.createdAt,
  });

  factory InterviewSchedule.fromFirestore(
    Map<String, dynamic> data,
    String id,
  ) {
    return InterviewSchedule(
      id: id,
      applicationId: data['applicationId'] as String? ?? '',
      jobId: data['jobId'] as String? ?? '',
      employerId: data['employerId'] as String? ?? '',
      seekerId: data['seekerId'] as String? ?? '',
      date: data['date'] as String? ?? '',
      time: data['time'] as String? ?? '',
      mode: data['mode'] != null
          ? InterviewMode.fromString(data['mode'] as String)
          : InterviewMode.inPerson,
      location: data['location'] as String?,
      meetingLink: data['meetingLink'] as String?,
      status: data['status'] != null
          ? InterviewStatus.fromString(data['status'] as String)
          : InterviewStatus.scheduled,
      notes: data['notes'] as String?,
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'applicationId': applicationId,
      'jobId': jobId,
      'employerId': employerId,
      'seekerId': seekerId,
      'date': date,
      'time': time,
      'mode': mode.toJson(),
      if (location != null) 'location': location,
      if (meetingLink != null) 'meetingLink': meetingLink,
      'status': status.toJson(),
      if (notes != null) 'notes': notes,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}
