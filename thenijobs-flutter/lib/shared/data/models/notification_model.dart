import 'package:cloud_firestore/cloud_firestore.dart';

enum NotificationType {
  jobAlert,
  applicationUpdate,
  interview,
  lead,
  system,
  promotion;

  static NotificationType fromString(String value) {
    switch (value) {
      case 'job_alert':
        return NotificationType.jobAlert;
      case 'application_update':
        return NotificationType.applicationUpdate;
      case 'interview':
        return NotificationType.interview;
      case 'lead':
        return NotificationType.lead;
      case 'system':
        return NotificationType.system;
      case 'promotion':
        return NotificationType.promotion;
      default:
        throw ArgumentError('Unknown NotificationType: $value');
    }
  }

  String toJson() {
    switch (this) {
      case NotificationType.jobAlert:
        return 'job_alert';
      case NotificationType.applicationUpdate:
        return 'application_update';
      case NotificationType.interview:
        return 'interview';
      case NotificationType.lead:
        return 'lead';
      case NotificationType.system:
        return 'system';
      case NotificationType.promotion:
        return 'promotion';
    }
  }
}

class Notification {
  final String id;
  final String userId;
  final NotificationType type;
  final String title;
  final String message;
  final bool read;
  final String? actionUrl;
  final DateTime createdAt;

  Notification({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    required this.read,
    this.actionUrl,
    required this.createdAt,
  });

  factory Notification.fromFirestore(Map<String, dynamic> data, String id) {
    return Notification(
      id: id,
      userId: data['userId'] as String? ?? '',
      type: data['type'] != null
          ? NotificationType.fromString(data['type'] as String)
          : NotificationType.system,
      title: data['title'] as String? ?? '',
      message: data['message'] as String? ?? '',
      read: data['read'] as bool? ?? false,
      actionUrl: data['actionUrl'] as String?,
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'type': type.toJson(),
      'title': title,
      'message': message,
      'read': read,
      if (actionUrl != null) 'actionUrl': actionUrl,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}
