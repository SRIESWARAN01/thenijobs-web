'use client';

import { useState } from 'react';
import {
  Radio, Send, Globe, Users, Building2, UserCheck, Loader2, ChevronDown, CheckCircle, Clock
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { sendBroadcastNotification } from '@/lib/firebase/firestoreService';
import { orderBy, limit } from 'firebase/firestore';

// ===== TYPES =====
interface BroadcastDoc {
  id: string;
  title: string;
  message: string;
  audience: string;
  sentAt?: any;
  status: 'sent' | 'scheduled' | 'draft';
  stats?: { sent: number; delivered: number; opened: number };
  createdAt?: any;
}

const AUDIENCE_OPTIONS = [
  { value: '', label: 'All Users', icon: Globe },
  { value: 'job_seeker', label: 'Job Seekers Only', icon: Users },
  { value: 'employer', label: 'Employers Only', icon: Building2 },
  { value: 'business_owner', label: 'Business Owners Only', icon: UserCheck },
];

export default function BroadcastsPage() {
  const { data: broadcasts, loading } = useCollection<BroadcastDoc>('broadcasts', [
    orderBy('createdAt', 'desc'),
    limit(30)
  ]);

  const [composeTitle, setComposeTitle] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeAudience, setComposeAudience] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!composeTitle || !composeMessage) {
      setError('Please fill in both title and message fields.');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Trigger the server-side Cloud Function
      await sendBroadcastNotification({
        title: composeTitle,
        message: composeMessage,
        targetRole: composeAudience || undefined,
      });

      // Clear compose fields
      setComposeTitle('');
      setComposeMessage('');
      setComposeAudience('');
      setSuccess(true);
    } catch (err: any) {
      console.error('Send broadcast error:', err);
      setError(err?.message || 'Failed to send broadcast notification.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Platform Broadcasts</h1>
          <p className="text-sm text-gray-400 mt-1">Compose and dispatch targeted system broadcasts to users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="xl:col-span-1">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Radio size={18} className="text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Create Broadcast</h2>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                Broadcast sent successfully!
              </div>
            )}

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Broadcast Title</label>
                <input
                  type="text"
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  placeholder="E.g., System Maintenance Alert"
                  className="search-input w-full px-3.5 py-2.5 text-sm"
                  maxLength={140}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Message Body</label>
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Enter details of your broadcast here..."
                  rows={5}
                  className="search-input w-full px-3.5 py-2.5 text-sm resize-none"
                  maxLength={600}
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Target Audience</label>
                <div className="relative">
                  <select
                    value={composeAudience}
                    onChange={(e) => setComposeAudience(e.target.value)}
                    className="appearance-none w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-gray-300 outline-none focus:border-violet-500/40 transition-all cursor-pointer"
                  >
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#0f0f24]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Send Button */}
              <button
                disabled={actionLoading}
                onClick={handleSend}
                className="btn-gradient w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm relative z-0 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 size={16} className="relative z-10 animate-spin" />
                ) : (
                  <>
                    <Send size={16} className="relative z-10" />
                    <span className="relative z-10">Send Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* History / Logs */}
        <div className="xl:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Broadcast History</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Audit log of system-wide notifications dispatched</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={36} className="text-violet-400 animate-spin" />
              </div>
            ) : broadcasts.length > 0 ? (
              <div className="divide-y divide-white/[0.04]">
                {broadcasts.map((b) => {
                  const stats = b.stats || { sent: 0, delivered: 0, opened: 0 };
                  const timestamp = b.sentAt || b.createdAt;

                  return (
                    <div key={b.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Radio size={16} className="text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold flex-shrink-0">
                              <CheckCircle size={9} /> Dispatched
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{b.message}</p>
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Users size={10} /> {b.audience || 'All Users'}
                            </span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Clock size={10} /> {timestamp ? new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp).toLocaleString('en-IN') : 'Recent'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                  <Radio size={28} className="text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-400">No broadcasts sent yet</p>
                <p className="text-xs text-gray-500 mt-1">Compose your first system-wide announcement using the form</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
