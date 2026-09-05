'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { collection, query, where, limit, addDoc, serverTimestamp, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { MessageSquare, Send, Search, Loader2, ArrowLeft, Building2, Briefcase, FileText } from 'lucide-react';
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
  applicationId?: string;
  jobId?: string;
  jobTitle?: string;
  companyId?: string;
  companyName?: string;
  seekerId?: string;
  seekerName?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  expiresAt?: any;
}

export default function SeekerMessagesPage() {
  const { user } = useAuth();
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // 1. Fetch conversations for current seeker
  const { data: rawConversations, loading: convsLoading } = useCollection<any>('conversations', [
    where('participants', 'array-contains', user?.uid || '')
  ], { skip: !user?.uid });

  const [conversations, setConversations] = useState<Conversation[]>([]);

  // 2. Filter out expired (>90 days) conversations
  useEffect(() => {
    if (!rawConversations || rawConversations.length === 0) {
      setConversations([]);
      return;
    }

    const now = new Date();
    const activeConvs = rawConversations.filter((conv: any) => {
      if (conv.expiresAt?.seconds) {
        const exp = new Date(conv.expiresAt.seconds * 1000);
        if (exp < now) return false; // Expired after 3 months
      }
      return true;
    }).map((conv: any) => ({
      id: conv.id,
      applicationId: conv.applicationId,
      jobId: conv.jobId,
      jobTitle: conv.jobTitle || 'Job Role',
      companyId: conv.companyId,
      companyName: conv.companyName || 'Employer',
      seekerId: conv.seekerId,
      seekerName: conv.seekerName,
      participants: conv.participants || [],
      lastMessage: conv.lastMessage || 'Conversation started',
      lastMessageAt: conv.lastMessageAt,
      expiresAt: conv.expiresAt,
    }));

    setConversations(activeConvs);

    // Auto select from URL parameter `?convId=...`
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get('convId');
      if (targetId) {
        const found = activeConvs.find((c: Conversation) => c.id === targetId);
        if (found) setActiveConv(found);
      } else if (activeConvs.length > 0 && !activeConv) {
        setActiveConv(activeConvs[0]);
      }
    }
  }, [rawConversations]);

  // 3. Listen to messages in active conversation
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
      console.error('Error fetching messages:', err);
      setLoadingMsgs(false);
    });

    return () => unsubscribe();
  }, [activeConv]);

  // Send message
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
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'conversations', activeConv.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) =>
    (c.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.jobTitle || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in-up max-w-6xl mx-auto font-outfit text-gray-900 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Employer Chat &amp; Messages <MessageSquare size={18} className="text-emerald-600" />
          </h1>
          <p className="text-xs text-gray-500">Direct real-time communication with hiring managers</p>
        </div>
        <Link
          href="/seeker/applications"
          className="px-3.5 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-all flex items-center gap-1.5"
        >
          <FileText size={14} /> My Applications
        </Link>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* Left Sidebar — Conversations List */}
        <div className={`lg:col-span-4 border-r border-gray-100 flex flex-col ${activeConv ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employer chats..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {convsLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Loader2 size={18} className="animate-spin text-emerald-600" /> Loading chats...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 space-y-1">
                <p className="font-bold">No active employer chats</p>
                <p className="text-[11px] text-slate-500">Chats are automatically created when you apply for a job.</p>
              </div>
            ) : (
              filtered.map((conv) => {
                const isActive = activeConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full text-left p-4 transition-all flex items-start gap-3 ${
                      isActive ? 'bg-emerald-50/60 border-l-4 border-emerald-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                      {conv.companyName?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{conv.companyName}</h4>
                      </div>
                      <p className="text-[11px] font-semibold text-emerald-700 truncate">{conv.jobTitle}</p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane — Chat Messages */}
        <div className={`lg:col-span-8 flex flex-col ${!activeConv ? 'hidden lg:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Chat Top Header */}
              <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConv(null)}
                    className="lg:hidden p-1.5 rounded-lg bg-gray-100 text-gray-600"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                    {activeConv.companyName?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-gray-900">{activeConv.companyName}</h3>
                    <p className="text-[11px] text-emerald-700 font-semibold">{activeConv.jobTitle}</p>
                  </div>
                </div>

                <Link
                  href="/seeker/applications"
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 hover:bg-emerald-100 transition-all"
                >
                  View Application
                </Link>
              </div>

              {/* Chat Thread Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                {loadingMsgs ? (
                  <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-emerald-600" /> Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No messages yet. Send a message to start conversing with the hiring manager!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isUser = m.senderId === user?.uid;
                    const isSystem = m.senderId === 'system';
                    if (isSystem) {
                      return (
                        <div key={m.id} className="text-center my-2">
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold">
                            {m.text}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isUser
                              ? 'bg-emerald-600 text-white rounded-tr-none font-medium'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none font-medium'
                          }`}
                        >
                          <p className="whitespace-pre-line">{m.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message to the employer..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 text-base sm:text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <MessageSquare size={36} className="text-slate-500" />
              <h3 className="text-sm font-bold text-gray-700">Select a Conversation</h3>
              <p className="text-xs text-gray-500 max-w-xs">
                Select an employer conversation from the list to start messaging in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
