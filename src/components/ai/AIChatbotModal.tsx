'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, Loader2, User, Building2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { requestAIService } from '@/lib/ai/aiClient';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AIChatbotModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine user role (seeker, company, admin, or guest)
  const rawRole = (user as any)?.role || (user as any)?.userType || 'SEEKER';
  const role: 'SEEKER' | 'COMPANY' | 'ADMIN' | 'GUEST' =
    rawRole === 'admin' || rawRole === 'ADMIN'
      ? 'ADMIN'
      : rawRole === 'employer' || rawRole === 'company' || rawRole === 'COMPANY'
      ? 'COMPANY'
      : user?.uid
      ? 'SEEKER'
      : 'GUEST';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let welcomeText = 'Vanakkam! 👋 I am your THENIJOBS AI Assistant.';
      if (role === 'SEEKER') {
        welcomeText += ' Ask me about accounting or software jobs in Theni, resume improvements, or interview preparation!';
      } else if (role === 'COMPANY') {
        welcomeText += ' How can I help with candidate search, drafting job postings, or company profile text?';
      } else if (role === 'ADMIN') {
        welcomeText += ' Ready to assist with platform stats, AI analytics, and operational tools.';
      } else {
        welcomeText += ' Explore jobs and companies across Theni and Tamil Nadu with my assistance!';
      }

      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, role, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await requestAIService({
        feature: 'chatbot',
        userId: user?.uid,
        userRole: role,
        payload: { message: userText },
      });

      const replyText = res.success && res.rawContent
        ? res.rawContent
        : res.error || 'AI is temporarily unavailable. Please try again.';

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'AI is temporarily unavailable. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-lg h-[560px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-outfit border border-gray-200 animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                THENIJOBS AI Assistant <Sparkles size={14} className="text-amber-400 fill-amber-400" />
              </h3>
              <p className="text-[10px] text-emerald-200 flex items-center gap-1 font-medium">
                Role: <span className="uppercase font-bold text-white">{role}</span> • Groq AI Architecture
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                  AI
                </div>
              )}
              <div
                className={`max-w-[84%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none font-medium shadow-xs'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-xs whitespace-pre-line'
                }`}
              >
                <p>{msg.text}</p>
                <span className={`text-[9px] block text-right mt-1 ${msg.sender === 'user' ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium pt-1">
              <Loader2 size={14} className="animate-spin text-emerald-600" /> AI Assistant is responding...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={
              role === 'SEEKER'
                ? 'Ask about accounting jobs, resume tips, salary...'
                : role === 'COMPANY'
                ? 'Ask about candidate search or JD generator...'
                : 'Type your prompt here...'
            }
            className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
