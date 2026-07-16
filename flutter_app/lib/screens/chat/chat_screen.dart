import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String chatId;
  const ChatScreen({super.key, required this.chatId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  final _mockMessages = <_MockMessage>[
    _MockMessage('Hi, I saw your application for the Flutter Developer role. Your profile looks great!', false, '10:30 AM'),
    _MockMessage('Thank you! Yes, I\'m very interested in the position. I have 2 years of Flutter experience.', true, '10:32 AM'),
    _MockMessage('Great! Can you share your portfolio or any apps you\'ve built?', false, '10:33 AM'),
    _MockMessage('Sure, here\'s my GitHub link. I\'ve also published 3 apps on the Play Store.', true, '10:35 AM'),
    _MockMessage('Impressive! We\'d like to schedule an interview. Are you available this Thursday at 3 PM?', false, '10:38 AM'),
    _MockMessage('Yes, Thursday 3 PM works perfectly for me! Should I join via Google Meet?', true, '10:40 AM'),
    _MockMessage('Yes, I\'ll send the meeting link shortly. Looking forward to speaking with you!', false, '10:41 AM'),
  ];

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Chat Header
            Container(
              padding: const EdgeInsets.fromLTRB(8, 8, 16, 12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                  ),
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.business_rounded, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'HR Manager',
                          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                        Row(
                          children: [
                            Container(
                              width: 8, height: 8,
                              decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              'ABC Industries • Online',
                              style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 38, height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.call_outlined, size: 18, color: AppColors.primary),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 38, height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.more_vert, size: 18, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),

            // Messages Area
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
                reverse: false,
                itemCount: _mockMessages.length,
                itemBuilder: (_, i) => _buildMessageBubble(_mockMessages[i]),
              ),
            ),

            // Message Input
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, -4)),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    Container(
                      width: 38, height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.attach_file_rounded, size: 18, color: AppColors.textSecondary),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: TextField(
                          controller: _messageController,
                          decoration: InputDecoration(
                            hintText: 'Type a message...',
                            hintStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textTertiary),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          style: GoogleFonts.inter(fontSize: 14),
                          onChanged: (_) => setState(() {}),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.accentDark, AppColors.accent],
                        ),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.accent.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(_MockMessage msg) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: msg.isSent ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!msg.isSent) ...[
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(
                color: AppColors.primarySurface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.person, size: 14, color: AppColors.primary),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: msg.isSent ? AppColors.primary : AppColors.surface,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(msg.isSent ? 18 : 4),
                  bottomRight: Radius.circular(msg.isSent ? 4 : 18),
                ),
                border: msg.isSent ? null : Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: msg.isSent
                        ? AppColors.primary.withValues(alpha: 0.2)
                        : Colors.black.withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    msg.text,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: msg.isSent ? Colors.white : AppColors.textPrimary,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        msg.time,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          color: msg.isSent ? Colors.white60 : AppColors.textTertiary,
                        ),
                      ),
                      if (msg.isSent) ...[
                        const SizedBox(width: 4),
                        Icon(Icons.done_all_rounded, size: 14, color: Colors.white.withValues(alpha: 0.7)),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MockMessage {
  final String text, time;
  final bool isSent;
  _MockMessage(this.text, this.isSent, this.time);
}
