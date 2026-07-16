import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/models/chat.dart';
import 'package:thenijobs/providers/auth_provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:uuid/uuid.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final String otherUserName;
  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.otherUserName,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _messageController = TextEditingController();
  final _firestore = FirebaseFirestore.instance;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  void _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final currentUser = ref.read(authProvider).user;
    if (currentUser == null) return;

    final id = const Uuid().v4();
    final message = ChatMessage(
      id: id,
      senderId: currentUser.uid,
      receiverId: 'recipient_uid_placeholder', // Stub: recipient uid
      conversationId: widget.conversationId,
      message: text,
      type: MessageType.text,
      createdAt: DateTime.now(),
    );

    _messageController.clear();

    // Write to Firestore messages collection
    await _firestore.collection('messages').doc(id).set(message.toMap());

    // Update conversation metadata
    await _firestore.collection('conversations').doc(widget.conversationId).set({
      'lastMessage': text,
      'lastMessageAt': FieldValue.serverTimestamp(),
      'lastMessageSenderId': currentUser.uid,
    }, SetOptions(merge: true));
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.otherUserName),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Messages Stream
            Expanded(
              child: StreamBuilder<QuerySnapshot>(
                stream: _firestore
                    .collection('messages')
                    .where('conversationId', isEqualTo: widget.conversationId)
                    .orderBy('createdAt', descending: true)
                    .snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                    return Center(
                      child: Text(
                        'No messages yet. Say hello!',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                    );
                  }

                  final docs = snapshot.data!.docs;

                  return ListView.builder(
                    reverse: true,
                    padding: const EdgeInsets.all(AppSpacing.base),
                    itemCount: docs.length,
                    itemBuilder: (context, index) {
                      final message = ChatMessage.fromMap(
                        docs[index].data() as Map<String, dynamic>,
                        docs[index].id,
                      );
                      final isMe = message.senderId == currentUser?.uid;

                      return Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isMe
                                ? AppColors.primary
                                : Theme.of(context).colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(16).copyWith(
                              bottomRight: isMe ? Radius.zero : const Radius.circular(16),
                              bottomLeft: isMe ? const Radius.circular(16) : Radius.zero,
                            ),
                          ),
                          child: Text(
                            message.message,
                            style: GoogleFonts.inter(
                              color: isMe ? Colors.white : Theme.of(context).colorScheme.onSurface,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),

            // Message Composer input
            Padding(
              padding: const EdgeInsets.all(AppSpacing.sm),
              child: Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _messageController,
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  FloatingActionButton.small(
                    onPressed: _sendMessage,
                    child: const Icon(Icons.send, size: 18),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
