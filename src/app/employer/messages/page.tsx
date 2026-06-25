'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { MessageSquare, Send, Search, Loader2, Phone, Mail, User } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
  // Resolved info
  otherUserName?: string;
  otherUserRole?: string;
}

export default function EmployerMessagesPage() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedConversationId(params.get('conversation'));
  }, []);

  // 1. Fetch conversations
  const { data: rawConversations, loading: convsLoading } = useCollection<any>('conversations', [
    where('participants', 'array-contains', user?.uid || '')
  ], { skip: !user?.uid });

  const [conversations, setConversations] = useState<Conversation[]>([]);

  // 2. Resolve other participant details
  useEffect(() => {
    if (!rawConversations || rawConversations.length === 0) {
      setConversations([]);
      return;
    }

    let cancelled = false;
    async function resolve() {
      const resolved = await Promise.all(rawConversations.map(async (conv: any) => {
        const participants = conv.participants || conv.participantIds || [];
        const otherId = participants.find((p: string) => p !== user?.uid) || '';
        const storedName = conv.participantNames?.[otherId] || conv.otherUserName;
        let otherUserName = storedName || '';
        let otherUserRole = conv.otherUserRole || 'Candidate';

        if (!otherUserName && otherId) {
          const userSnap = await getDoc(doc(db, 'users', otherId)).catch(() => null);
          const userData = userSnap?.data();
          otherUserName = userData?.displayName || userData?.email || `User (${otherId.slice(0, 4)})`;
          otherUserRole = userData?.role || otherUserRole;
        }

        return {
          id: conv.id,
          participants,
          lastMessage: conv.lastMessage || 'No messages yet',
          lastMessageAt: conv.lastMessageAt,
          otherUserName: otherUserName || `User (${otherId.slice(0, 4)})`,
          otherUserRole,
        };
      }));

      if (!cancelled) setConversations(resolved);
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [rawConversations, user?.uid]);

  useEffect(() => {
    if (!selectedConversationId || conversations.length === 0) return;
    const found = conversations.find((conv) => conv.id === selectedConversationId);
    if (found) setActiveConv(found);
  }, [selectedConversationId, conversations]);

  // 3. Listen to messages for the active conversation
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }

    setLoadingMsgs(true);
    const msgsRef = collection(db, 'conversations', activeConv.id, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as Message[];
      setMessages(msgs);
      setLoadingMsgs(false);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error(err);
      setLoadingMsgs(false);
    });

    return () => unsubscribe();
  }, [activeConv]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv || !user?.uid) return;

    setSending(true);
    try {
      const text = inputText.trim();
      setInputText('');

      const msgsRef = collection(db, 'conversations', activeConv.id, 'messages');
      await addDoc(msgsRef, {
        senderId: user.uid,
        text,
        timestamp: serverTimestamp(),
      });

      // Update last message in conversation
      await updateDoc(doc(db, 'conversations', activeConv.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) =>
    (c.otherUserName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col font-outfit text-white">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-sm text-gray-400 mt-1">Direct messaging with job candidates</p>
      </div>

      <div className="flex-1 flex glass-card rounded-2xl overflow-hidden border border-white/[0.06]">
        {/* Left Column — Conversation List */}
        <div className="w-full md:w-80 border-r border-white/[0.06] flex flex-col bg-[#08081a]/50">
          {/* Search bar */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.02] no-scrollbar">
            {convsLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="animate-spin text-cyan-400" size={20} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No chats found.
              </div>
            ) : (
              filtered.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`p-4 cursor-pointer hover:bg-white/[0.02] transition-all flex items-center gap-3 ${
                    activeConv?.id === conv.id ? 'bg-white/[0.04] border-l-2 border-cyan-500' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">
                      {(conv.otherUserName || 'C').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white truncate">{conv.otherUserName}</p>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column — Chat Thread */}
        <div className="flex-1 flex flex-col bg-[#070718]/30">
          {activeConv ? (
            <>
              {/* Active Header */}
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-[#08081a]/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {(activeConv.otherUserName || 'C').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{activeConv.otherUserName}</h3>
                    <p className="text-[10px] text-cyan-400 font-medium">{activeConv.otherUserRole}</p>
                  </div>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-cyan-400" size={24} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <MessageSquare size={28} className="opacity-30 mb-2" />
                    <p className="text-xs">No messages yet. Send a message to start the conversation.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.senderId === user?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                            isSelf
                              ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-tr-none'
                              : 'bg-white/[0.06] text-gray-200 border border-white/[0.04] rounded-tl-none'
                          }`}
                        >
                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.06] bg-[#08081a]/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputText.trim()}
                    className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-30"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-8">
              <MessageSquare size={36} className="opacity-20 mb-3" />
              <h3 className="text-sm font-semibold text-white">No Active Chat</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">Select a candidate conversation from the list to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
