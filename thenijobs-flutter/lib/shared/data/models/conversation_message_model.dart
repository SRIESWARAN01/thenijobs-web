import 'package:cloud_firestore/cloud_firestore.dart';

enum MessageType {
  text,
  image,
  file,
  system;

  static MessageType fromString(String value) {
    switch (value) {
      case 'text':
        return MessageType.text;
      case 'image':
        return MessageType.image;
      case 'file':
        return MessageType.file;
      case 'system':
        return MessageType.system;
      default:
        throw ArgumentError('Unknown MessageType: $value');
    }
  }

  String toJson() {
    switch (this) {
      case MessageType.text:
        return 'text';
      case MessageType.image:
        return 'image';
      case MessageType.file:
        return 'file';
      case MessageType.system:
        return 'system';
    }
  }
}

enum AttachmentType {
  image,
  file,
  resume;

  static AttachmentType fromString(String value) {
    switch (value) {
      case 'image':
        return AttachmentType.image;
      case 'file':
        return AttachmentType.file;
      case 'resume':
        return AttachmentType.resume;
      default:
        throw ArgumentError('Unknown AttachmentType: $value');
    }
  }

  String toJson() {
    switch (this) {
      case AttachmentType.image:
        return 'image';
      case AttachmentType.file:
        return 'file';
      case AttachmentType.resume:
        return 'resume';
    }
  }
}

class ChatAttachment {
  final AttachmentType type;
  final String url;
  final String name;
  final int? size;

  ChatAttachment({
    required this.type,
    required this.url,
    required this.name,
    this.size,
  });

  factory ChatAttachment.fromMap(Map<String, dynamic> data) {
    return ChatAttachment(
      type: data['type'] != null
          ? AttachmentType.fromString(data['type'] as String)
          : AttachmentType.file,
      url: data['url'] as String? ?? '',
      name: data['name'] as String? ?? '',
      size: (data['size'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'type': type.toJson(),
      'url': url,
      'name': name,
      if (size != null) 'size': size,
    };
  }
}

class ConversationMessage {
  final String id;
  final String conversationId;
  final String senderId;
  final String senderName;
  final String senderRole;
  final String text;
  final MessageType type;
  final List<ChatAttachment>? attachments;
  final bool read;
  final DateTime? readAt;
  final DateTime createdAt;

  ConversationMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderName,
    required this.senderRole,
    required this.text,
    required this.type,
    this.attachments,
    required this.read,
    this.readAt,
    required this.createdAt,
  });

  factory ConversationMessage.fromFirestore(
    Map<String, dynamic> data,
    String id,
  ) {
    return ConversationMessage(
      id: id,
      conversationId: data['conversationId'] as String? ?? '',
      senderId: data['senderId'] as String? ?? '',
      senderName: data['senderName'] as String? ?? '',
      senderRole: data['senderRole'] as String? ?? '',
      text: data['text'] as String? ?? '',
      type: data['type'] != null
          ? MessageType.fromString(data['type'] as String)
          : MessageType.text,
      attachments: (data['attachments'] as List<dynamic>?)
          ?.map((e) => ChatAttachment.fromMap(e as Map<String, dynamic>))
          .toList(),
      read: data['read'] as bool? ?? false,
      readAt: data['readAt'] != null
          ? (data['readAt'] as Timestamp).toDate()
          : null,
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'conversationId': conversationId,
      'senderId': senderId,
      'senderName': senderName,
      'senderRole': senderRole,
      'text': text,
      'type': type.toJson(),
      if (attachments != null)
        'attachments': attachments!.map((e) => e.toMap()).toList(),
      'read': read,
      if (readAt != null) 'readAt': Timestamp.fromDate(readAt!),
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}
