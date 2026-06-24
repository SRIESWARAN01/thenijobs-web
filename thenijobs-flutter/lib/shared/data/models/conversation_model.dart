import 'package:cloud_firestore/cloud_firestore.dart';

enum ConversationStatus {
  active,
  archived,
  blocked;

  static ConversationStatus fromString(String value) {
    switch (value) {
      case 'active':
        return ConversationStatus.active;
      case 'archived':
        return ConversationStatus.archived;
      case 'blocked':
        return ConversationStatus.blocked;
      default:
        throw ArgumentError('Unknown ConversationStatus: $value');
    }
  }

  String toJson() {
    switch (this) {
      case ConversationStatus.active:
        return 'active';
      case ConversationStatus.archived:
        return 'archived';
      case ConversationStatus.blocked:
        return 'blocked';
    }
  }
}

class Conversation {
  final String id;
  final List<String> participants;
  final Map<String, String> participantNames;
  final Map<String, String> participantRoles;
  final Map<String, String>? participantPhotos;
  final String? jobId;
  final String? jobTitle;
  final String? companyId;
  final String lastMessage;
  final DateTime lastMessageAt;
  final String? lastMessageSenderId;
  final List<String> typingUsers;
  final Map<String, int> unreadCounts;
  final ConversationStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  Conversation({
    required this.id,
    required this.participants,
    required this.participantNames,
    required this.participantRoles,
    this.participantPhotos,
    this.jobId,
    this.jobTitle,
    this.companyId,
    required this.lastMessage,
    required this.lastMessageAt,
    this.lastMessageSenderId,
    required this.typingUsers,
    required this.unreadCounts,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Conversation.fromFirestore(Map<String, dynamic> data, String id) {
    return Conversation(
      id: id,
      participants:
          (data['participants'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      participantNames:
          (data['participantNames'] as Map<dynamic, dynamic>?)?.map(
            (k, v) => MapEntry(k as String, v as String),
          ) ??
          {},
      participantRoles:
          (data['participantRoles'] as Map<dynamic, dynamic>?)?.map(
            (k, v) => MapEntry(k as String, v as String),
          ) ??
          {},
      participantPhotos: (data['participantPhotos'] as Map<dynamic, dynamic>?)
          ?.map((k, v) => MapEntry(k as String, v as String)),
      jobId: data['jobId'] as String?,
      jobTitle: data['jobTitle'] as String?,
      companyId: data['companyId'] as String?,
      lastMessage: data['lastMessage'] as String? ?? '',
      lastMessageAt: data['lastMessageAt'] != null
          ? (data['lastMessageAt'] as Timestamp).toDate()
          : DateTime.now(),
      lastMessageSenderId: data['lastMessageSenderId'] as String?,
      typingUsers:
          (data['typingUsers'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      unreadCounts:
          (data['unreadCounts'] as Map<dynamic, dynamic>?)?.map(
            (k, v) => MapEntry(k as String, (v as num).toInt()),
          ) ??
          {},
      status: data['status'] != null
          ? ConversationStatus.fromString(data['status'] as String)
          : ConversationStatus.active,
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
      'participants': participants,
      'participantNames': participantNames,
      'participantRoles': participantRoles,
      if (participantPhotos != null) 'participantPhotos': participantPhotos,
      if (jobId != null) 'jobId': jobId,
      if (jobTitle != null) 'jobTitle': jobTitle,
      if (companyId != null) 'companyId': companyId,
      'lastMessage': lastMessage,
      'lastMessageAt': Timestamp.fromDate(lastMessageAt),
      if (lastMessageSenderId != null)
        'lastMessageSenderId': lastMessageSenderId,
      'typingUsers': typingUsers,
      'unreadCounts': unreadCounts,
      'status': status.toJson(),
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}
