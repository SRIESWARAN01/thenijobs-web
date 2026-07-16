import 'package:thenijobs/utils/helpers.dart';

enum MessageType {
  text('text'),
  image('image'),
  file('file');

  final String value;
  const MessageType(this.value);

  static MessageType fromString(String? value) {
    return MessageType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => MessageType.text,
    );
  }
}

class ChatMessage {
  final String id;
  final String senderId;
  final String receiverId;
  final String conversationId;
  final String message;
  final MessageType type;
  final bool read;
  final DateTime createdAt;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.conversationId,
    required this.message,
    required this.type,
    this.read = false,
    required this.createdAt,
  });

  factory ChatMessage.fromMap(Map<String, dynamic> map, String id) {
    return ChatMessage(
      id: id,
      senderId: map['senderId'] ?? '',
      receiverId: map['receiverId'] ?? '',
      conversationId: map['conversationId'] ?? '',
      message: map['message'] ?? '',
      type: MessageType.fromString(map['type']),
      read: map['read'] ?? false,
      createdAt: toDateTimeRequired(map['createdAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'senderId': senderId,
      'receiverId': receiverId,
      'conversationId': conversationId,
      'message': message,
      'type': type.value,
      'read': read,
      'createdAt': createdAt,
    };
  }
}

class Conversation {
  final String id;
  final List<String> participants;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final String? lastMessageSenderId;
  final Map<String, int> unreadCounts; // Map participant ID to their unread count

  const Conversation({
    required this.id,
    required this.participants,
    this.lastMessage,
    this.lastMessageAt,
    this.lastMessageSenderId,
    this.unreadCounts = const {},
  });

  factory Conversation.fromMap(Map<String, dynamic> map, String id) {
    return Conversation(
      id: id,
      participants: toStringList(map['participants']),
      lastMessage: map['lastMessage'],
      lastMessageAt: toDateTime(map['lastMessageAt']),
      lastMessageSenderId: map['lastMessageSenderId'],
      unreadCounts: Map<String, int>.from(map['unreadCounts'] ?? {}),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'participants': participants,
      'lastMessage': lastMessage,
      'lastMessageAt': lastMessageAt,
      'lastMessageSenderId': lastMessageSenderId,
      'unreadCounts': unreadCounts,
    };
  }
}
