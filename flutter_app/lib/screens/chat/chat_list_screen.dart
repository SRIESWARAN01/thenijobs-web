import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class ChatListScreen extends ConsumerWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mockChats = [
      _MockChat('HR Manager - ABC Industries', 'Impressive! We\'d like to schedule an interview.', '10:41 AM', 2, true),
      _MockChat('Theni Tech Labs', 'Your application has been received. We\'ll review it shortly.', 'Yesterday', 0, false),
      _MockChat('Quick Logistics', 'Hi, can you share your availability for next week?', 'Mon', 1, true),
      _MockChat('PQR Finance', 'Thank you for your interest in the Tally Accountant position.', 'Jul 10', 0, false),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded, size: 16),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text('Messages', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.edit_outlined, size: 18, color: AppColors.primary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Search
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded, size: 20, color: AppColors.textTertiary),
                    const SizedBox(width: 10),
                    Text('Search conversations...', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textTertiary)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Chat List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: mockChats.length,
                separatorBuilder: (_, __) => Padding(
                  padding: const EdgeInsets.only(left: 68),
                  child: Container(height: 1, color: AppColors.border.withValues(alpha: 0.5)),
                ),
                itemBuilder: (_, i) {
                  final chat = mockChats[i];
                  return GestureDetector(
                    onTap: () => context.push('/chat/$i'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      child: Row(
                        children: [
                          // Avatar
                          Container(
                            width: 50, height: 50,
                            decoration: BoxDecoration(
                              color: AppColors.primarySurface,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Center(
                              child: Text(
                                chat.name[0],
                                style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primary),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        chat.name,
                                        style: GoogleFonts.outfit(
                                          fontSize: 15,
                                          fontWeight: chat.unreadCount > 0 ? FontWeight.w700 : FontWeight.w600,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Text(
                                      chat.time,
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: chat.unreadCount > 0 ? AppColors.primary : AppColors.textTertiary,
                                        fontWeight: chat.unreadCount > 0 ? FontWeight.w600 : FontWeight.w400,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        chat.lastMessage,
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          color: chat.unreadCount > 0 ? AppColors.textPrimary : AppColors.textSecondary,
                                          fontWeight: chat.unreadCount > 0 ? FontWeight.w500 : FontWeight.w400,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (chat.unreadCount > 0) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        width: 22, height: 22,
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryLight]),
                                          borderRadius: BorderRadius.circular(11),
                                        ),
                                        child: Center(
                                          child: Text(
                                            '${chat.unreadCount}',
                                            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MockChat {
  final String name, lastMessage, time;
  final int unreadCount;
  final bool isOnline;
  _MockChat(this.name, this.lastMessage, this.time, this.unreadCount, this.isOnline);
}
