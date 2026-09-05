'use client';

import { useState } from 'react';
import { Sparkles, X, Send, Bot, User, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { requestAIService } from '@/lib/ai/aiClient';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  recommendations?: any[];
}

export default function AICareerCoachModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Vanakkam! 👋 I am your THENIJOBS AI Assistant. Ask me anything about local job search in Theni, career path advice, resume tips, or interview preparation!',
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: Message = { sender: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await requestAIService({
        feature: 'career_assistant',
        userId: user?.uid,
        userRole: 'SEEKER',
        payload: { question: userText },
      });

      const replyText = res.success && res.rawContent
        ? res.rawContent
        : res.error || 'AI is temporarily unavailable. Please try again.';

      setMessages(prev => [...prev, { sender: 'ai', text: replyText }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'AI is temporarily unavailable. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl max-w-lg w-full flex flex-col h-[520px] shadow-2xl overflow-hidden font-sans border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5 font-sans">
                THENIJOBS AI Assistant <Sparkles size={14} className="text-amber-600 fill-amber-400" />
              </h3>
              <p className="text-[11px] text-blue-100">Powered by Groq AI Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 text-xs font-bold">
                  AI
                </div>
              )}
              <div
                className={`max-w-[82%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-1 text-xs font-bold">
                  You
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            aria-label="Ask about jobs, career advice, or interview tips" placeholder="Ask about jobs, career advice, or interview tips..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 text-base sm:text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          <button
            onClick={handleSend}
            className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
