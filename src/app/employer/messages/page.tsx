'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import {
  collection, query, where, limit, addDoc, serverTimestamp,
  onSnapshot, doc, updateDoc
} from 'firebase/firestore';
import {
  MessageSquare, Send, Search, Loader2, Phone, MessageCircle,
  Calendar, FileText, MapPin, Briefcase, ArrowLeft, Check, CheckCheck,
  Sparkles, User
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt?: any;
  timestamp?: any;
}

/**
 * Chat messages exist with two different time fields: `createdAt` (written by the seeker
 * page and by the system message applyToJob creates) and `timestamp` (written by the
 * employer page). A Firestore `orderBy` silently drops every document that lacks the
 * field it sorts on, so ordering server-side hid each side of the conversation from the
 * other. Read unordered and sort here over whichever field the document actually carries,
 * so existing threads of either shape stay readable without a data migration.
 */
function messageMillis(m: any): number {
  const v = m?.createdAt ?? m?.timestamp;
  if (!v) return 0;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  const parsed = new Date(v).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}


interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
  otherUserId?: string;
  otherUserName?: string;
  otherUserRole?: string;
  jobTitle?: string;
  phone?: string;
  whatsapp?: string;
  district?: string;
}

const QUICK_TEMPLATES = [
  { label: '📅 Schedule Interview', text: 'Hi! We reviewed your profile and would like to invite you for an interview. Please let us know your available timings.' },
  { label: '📄 Request Resume', text: 'Hello, could you please share your updated resume and portfolio for further evaluation?' },
  { label: '📍 Office Location', text: 'Our office is located at Theni. Could you let us know if an in-person discussion works for you?' },
  { label: '💼 Offer Discussion', text: 'Congratulations! We are pleased with your interview and would like to discuss the offer details with you.' },
];

export default function EmployerMessagesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Resolve the employer's company, then read that company's conversations.
  // Threads are looked up by companyId, not by `participants`: every conversation carries
  // companyId, including threads written before participants held the owner's uid, so this
  // finds existing conversations without a data migration. The rules allow the read via
  // isCompanyOwner(resource.data.companyId).
  const { data: companies } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const companyId = companies?.[0]?.id;

  const { data: rawConversations, loading: convsLoading } = useCollection<any>('conversations', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!rawConversations || rawConversations.length === 0) {
      setConversations([]);
      return;
    }

    const resolved = rawConversations.map((conv: any) => {
      // The other party is always the applicant, and the conversation names them
      // explicitly — don't infer it from `participants`, which holds a company document
      // id on older threads.
      const otherId = conv.seekerId || (conv.participants || []).find((p: string) => p !== user?.uid) || '';
      return {
        id: conv.id,
        participants: conv.participants || [],
        lastMessage: conv.lastMessage || 'No messages yet',
        lastMessageAt: conv.lastMessageAt,
        otherUserId: otherId,
        otherUserName: conv.seekerName || conv.otherUserName || `Candidate (${otherId.slice(0, 4)})`,
        otherUserRole: conv.otherUserRole || 'Job Applicant',
        jobTitle: conv.jobTitle || 'Job Opening',
        phone: conv.seekerPhone || conv.phone || '',
        whatsapp: conv.seekerPhone || conv.whatsapp || conv.phone || '',
        district: conv.district || 'Theni',
      };
    });

    setConversations(resolved);
  }, [rawConversations, user?.uid]);

  // 2. Listen to active conversation messages
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }

    setLoadingMsgs(true);
    const msgsRef = collection(db, 'conversations', activeConv.id, 'messages');
    const q = query(msgsRef, limit(200));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = (snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as Message[]).sort((a, b) => messageMillis(a) - messageMillis(b));
      setMessages(msgs);
      setLoadingMsgs(false);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error(err);
      setLoadingMsgs(false);
    });

    return () => unsubscribe();
  }, [activeConv]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConv || !user?.uid) return;

    setSending(true);
    try {
      if (!textToSend) setInputText('');

      const msgsRef = collection(db, 'conversations', activeConv.id, 'messages');
      await addDoc(msgsRef, {
        senderId: user.uid,
        text,
        // `createdAt` is the field the rest of the app writes and reads.
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'conversations', activeConv.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setActiveConv(conv);
    setMobileChatOpen(true);
  };

  const filtered = conversations.filter((c) =>
    (c.otherUserName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.jobTitle || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">Communication &amp; Messages</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Real-time chat, interview invites, and hiring communications with applicants</p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden h-[calc(100vh-210px)] min-h-[520px] flex">
        {/* Left Side: Conversation List (Hidden on mobile when chat is open) */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-gray-50/50 ${mobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          {/* Search box */}
          <div className="p-3.5 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                aria-label="Search chats & applicants" placeholder="Search chats & applicants..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100/80 border border-gray-200 rounded-2xl text-base sm:text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {convsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 size={24} className="text-blue-600 animate-spin" />
                <span className="text-xs text-slate-500">Loading inbox...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <MessageSquare size={32} className="mx-auto text-slate-500" />
                <p className="text-xs font-bold text-gray-600">No active conversations</p>
                <p className="text-[11px]">When candidates apply or message, chats will appear here.</p>
              </div>
            ) : (
              filtered.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-3.5 sm:p-4 cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-gray-100/70 bg-white'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-200">
                      {conv.otherUserName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {conv.otherUserName}
                        </h4>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt?.toMillis?.() || conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-700 font-bold truncate">
                        {conv.jobTitle}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat Window (Hidden on mobile when chat is closed) */}
        <div className={`flex-1 flex flex-col bg-white ${!mobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Active Header & Candidate Context Bar */}
              <div className="p-3.5 sm:p-4 border-b border-gray-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setMobileChatOpen(false)}
                    className="md:hidden p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-200">
                    {activeConv.otherUserName?.[0]?.toUpperCase() || 'U'}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                      {activeConv.otherUserName}
                    </h3>
                    <p className="text-[11px] text-gray-500 truncate font-medium">
                      Applied for <span className="font-bold text-blue-700">{activeConv.jobTitle}</span> · {activeConv.district}
                    </p>
                  </div>
                </div>

                {/* Quick Call & WhatsApp Triggers */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeConv.phone && (
                    <a
                      href={`tel:${activeConv.phone}`}
                      className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200 cursor-pointer"
                      title="Direct Call"
                    >
                      <Phone size={14} /> <span className="hidden sm:inline">Call</span>
                    </a>
                  )}

                  {activeConv.whatsapp && (
                    <a
                      href={`https://wa.me/${activeConv.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${activeConv.otherUserName}, this is regarding your application for "${activeConv.jobTitle}" on THENIJOBS.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                      style={{ background: '#25D366' }}
                      title="Open WhatsApp Chat"
                    >
                      <MessageCircle size={14} /> <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-gray-50/50">
                {loadingMsgs ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={24} className="text-blue-600 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <Sparkles size={28} className="mx-auto text-blue-600" />
                    <p className="text-xs font-bold text-gray-700">Start the conversation with {activeConv.otherUserName}</p>
                    <p className="text-[11px]">Use quick response templates below or type a custom message.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.uid;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-md p-3.5 rounded-3xl text-xs sm:text-sm font-medium shadow-xs leading-relaxed ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-xs'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                            <span>{messageMillis(m) ? new Date(messageMillis(m)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}</span>
                            {isMe && <CheckCheck size={11} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Template Replies (Scrollable) */}
              <div className="p-2.5 bg-white border-t border-gray-100 overflow-x-auto no-scrollbar flex items-center gap-1.5">
                {QUICK_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(tmpl.text)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-800 text-[11px] font-bold whitespace-nowrap transition-colors border border-blue-200 shrink-0 cursor-pointer"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="p-3 sm:p-4 bg-white border-t border-gray-200 flex items-center gap-2">
                <input
                  type="text"
                  aria-label="Type your message to candidate" placeholder="Type your message to candidate..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-2xl text-base sm:text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/20 disabled:opacity-40 cursor-pointer"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs">
                <MessageSquare size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Select a Conversation</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">Choose an applicant from the left panel to begin chatting, scheduling interviews, or discussing job offers.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
