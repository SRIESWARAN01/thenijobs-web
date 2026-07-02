'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';
import {
  Clock, Plus, Trash2, Calendar, CheckSquare, Square,
  ShieldAlert, Sparkles, Loader2, CheckCircle, Bell, X
} from 'lucide-react';


interface CustomReminder {
  id: string;
  title: string;
  notes?: string;
  category: 'Interview' | 'Application' | 'Subscription' | 'Personal';
  dueDate: string;
  dueTime: string;
  completed: boolean;
  createdAt: string;
}

export default function SeekerRemindersPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  // 1. Fetch real-time interviews for the logged-in seeker
  const { data: rawInterviews, loading: interviewsLoading } = useCollection<any>('interviews', [
    where('seekerId', '==', uid || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !uid });

  // 2. Fetch subscriptions to show renewal warnings
  const { data: rawSubscriptions, loading: subsLoading } = useCollection<any>('subscriptions', [
    where('userId', '==', uid || '')
  ], { skip: !uid });

  // 3. State for custom reminders stored in localStorage
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>([]);
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  // Load from localStorage
  useEffect(() => {
    if (!uid) return;
    try {
      const stored = localStorage.getItem(`thenijobs_seeker_custom_reminders_${uid}`);
      if (stored) {
        setCustomReminders(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load custom reminders', e);
    }
    setLoadedFromStorage(true);
  }, [uid]);

  // Save to localStorage
  const saveToStorage = (updatedList: CustomReminder[]) => {
    if (!uid) return;
    try {
      localStorage.setItem(`thenijobs_seeker_custom_reminders_${uid}`, JSON.stringify(updatedList));
      setCustomReminders(updatedList);
    } catch (e) {
      console.error('Failed to save custom reminders', e);
    }
  };

  // 4. Modal and search states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState<'Interview' | 'Application' | 'Subscription' | 'Personal'>('Personal');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('');
  
  const [activeTab, setActiveTab] = useState<'all' | 'interviews' | 'subscriptions' | 'custom' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add custom reminder
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newReminder: CustomReminder = {
      id: `custom_${Date.now()}`,
      title: newTitle.trim(),
      notes: newNotes.trim() || undefined,
      category: newCategory,
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      dueTime: newDueTime || '12:00',
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newReminder, ...customReminders];
    saveToStorage(updated);

    // Reset fields
    setNewTitle('');
    setNewNotes('');
    setNewCategory('Personal');
    setNewDueDate('');
    setNewDueTime('');
    setIsModalOpen(false);
  };

  // Toggle custom reminder completion
  const handleToggleComplete = (id: string) => {
    const updated = customReminders.map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    saveToStorage(updated);
  };

  // Delete custom reminder
  const handleDeleteReminder = (id: string) => {
    const updated = customReminders.filter(r => r.id !== id);
    saveToStorage(updated);
  };

  // 5. Build combined reminders list
  const allReminders = useMemo(() => {
    const list: any[] = [];

    // Map interviews into unified reminder items
    rawInterviews.forEach((int) => {
      const isCompleted = int.status === 'completed' || int.status === 'cancelled';
      list.push({
        id: int.id,
        title: `Interview for ${int.jobTitle || 'Job'}`,
        subtitle: int.companyName || 'Company',
        description: int.notes || 'Interview scheduled by employer.',
        category: 'Interview',
        dueDate: int.date || 'TBD',
        dueTime: int.time || '',
        completed: isCompleted,
        type: 'dynamic_interview',
        actions: int.meetingLink ? [
          { label: 'Join Meet', href: int.meetingLink, color: 'emerald' }
        ] : [],
      });
    });

    // Map subscriptions into unified warning reminder items
    rawSubscriptions.forEach((sub) => {
      if (sub.status === 'active' && sub.expiresAt) {
        const expiryDate = new Date(sub.expiresAt.seconds * 1000);
        const daysUntil = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 3600 * 24));
        
        if (daysUntil <= 14) {
          list.push({
            id: sub.id,
            title: `Your ${sub.planName || 'Plan'} Subscription Expires Soon`,
            subtitle: `Expires in ${daysUntil} days`,
            description: `Verify billing options or upgrade your plan to maintain premium seeker status.`,
            category: 'Subscription',
            dueDate: expiryDate.toLocaleDateString(),
            dueTime: '',
            completed: false,
            type: 'dynamic_subscription',
            actions: [
              { label: 'Manage Plan', href: '/seeker/subscription', color: 'cyan' }
            ]
          });
        }
      }
    });

    // Add custom reminders
    customReminders.forEach((r) => {
      list.push({
        id: r.id,
        title: r.title,
        subtitle: r.category,
        description: r.notes,
        category: r.category,
        dueDate: r.dueDate,
        dueTime: r.dueTime,
        completed: r.completed,
        type: 'custom',
      });
    });

    // Sort active first, then by date
    return list.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(`${a.dueDate} ${a.dueTime || '00:00'}`).getTime() - new Date(`${b.dueDate} ${b.dueTime || '00:00'}`).getTime();
    });
  }, [rawInterviews, rawSubscriptions, customReminders]);

  // 6. Filter by Tab and Search Query
  const filteredReminders = useMemo(() => {
    return allReminders.filter((item) => {
      // Tab filter
      if (activeTab === 'completed') {
        if (!item.completed) return false;
      } else {
        if (item.completed) return false;
        if (activeTab === 'interviews' && item.category !== 'Interview') return false;
        if (activeTab === 'subscriptions' && item.category !== 'Subscription') return false;
        if (activeTab === 'custom' && item.type !== 'custom') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSubtitle = item.subtitle?.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        return matchesTitle || matchesSubtitle || matchesDesc;
      }

      return true;
    });
  }, [allReminders, activeTab, searchQuery]);

  // Compute metrics counts
  const pendingCount = allReminders.filter(r => !r.completed).length;
  const interviewCount = allReminders.filter(r => !r.completed && r.category === 'Interview').length;
  const subWarningsCount = allReminders.filter(r => !r.completed && r.category === 'Subscription').length;
  const customCount = allReminders.filter(r => !r.completed && r.type === 'custom').length;

  const loading = interviewsLoading || subsLoading || !loadedFromStorage;

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Header section */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Reminders</p>
            <h1 className="mt-1 text-2xl font-bold text-white font-outfit">My Reminders & Tasks</h1>
            <p className="mt-1 text-sm text-gray-400">Keep track of interview invites, plan expirations, and custom alerts.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={16} /> Add Task Reminder
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading your reminders...</p>
        </div>
      ) : (
        <>
          {/* Metrics section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Pending Reminders', value: pendingCount, icon: Clock, color: 'violet' },
              { label: 'Interview Reminders', value: interviewCount, icon: Calendar, color: 'amber' },
              { label: 'Renewal Warnings', value: subWarningsCount, icon: ShieldAlert, color: 'rose' },
              { label: 'Custom Tasks', value: customCount, icon: Sparkles, color: 'cyan' }
            ].map((stat) => {
              const Icon = stat.icon;
              const colorClasses = 
                stat.color === 'violet' ? 'bg-violet-500/10 text-violet-400' :
                stat.color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                stat.color === 'rose' ? 'bg-rose-500/10 text-rose-400' :
                'bg-cyan-500/10 text-cyan-400';

              return (
                <div key={stat.label} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-2xl font-bold text-white font-outfit">{stat.value}</p>
                    <div className={`w-10 h-10 rounded-xl ${colorClasses} flex items-center justify-center`}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Filtering and search */}
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Plus size={16} className="rotate-45" />
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reminders..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/40 focus:bg-white/[0.06] outline-none transition-all"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 no-scrollbar">
              {[
                { label: 'All Active', value: 'all', count: allReminders.filter(r => !r.completed).length },
                { label: 'Interviews', value: 'interviews', count: interviewCount },
                { label: 'Subscriptions', value: 'subscriptions', count: subWarningsCount },
                { label: 'Custom Tasks', value: 'custom', count: customCount },
                { label: 'Completed', value: 'completed', count: allReminders.filter(r => r.completed).length }
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as any)}
                  className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                    activeTab === tab.value
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-[10px] opacity-70">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reminders List */}
          <div className="space-y-3">
            {filteredReminders.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-white/[0.04]">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.02] text-gray-500">
                  <Bell size={24} />
                </div>
                <h2 className="text-base font-semibold text-white">No reminders found</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                  {searchQuery ? 'Try matching keywords in the search bar.' : 'You have no items in this filter group.'}
                </p>
              </div>
            ) : (
              filteredReminders.map((item) => {
                const categoryColor = 
                  item.category === 'Interview' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  item.category === 'Subscription' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  item.category === 'Application' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                  'bg-violet-500/10 text-violet-400 border-violet-500/20';

                return (
                  <div
                    key={item.id}
                    className={`glass-card rounded-2xl p-4 transition-all hover:border-white/[0.15] border border-white/[0.06] flex items-start gap-4 ${
                      item.completed ? 'opacity-60 bg-white/[0.01]' : ''
                    }`}
                  >
                    {/* Checkbox trigger for custom reminders */}
                    {item.type === 'custom' ? (
                      <button
                        onClick={() => handleToggleComplete(item.id)}
                        aria-label={`Toggle status for ${item.title}`}
                        className="text-gray-500 hover:text-emerald-400 mt-0.5 transition-colors shrink-0"
                      >
                        {item.completed ? <CheckSquare size={20} className="text-emerald-400" /> : <Square size={20} />}
                      </button>
                    ) : (
                      <div className="text-emerald-500/40 mt-0.5 shrink-0">
                        <CheckCircle size={20} />
                      </div>
                    )}

                    {/* Content details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-base font-semibold text-white ${item.completed ? 'line-through text-gray-500' : ''}`}>
                          {item.title}
                        </h3>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${categoryColor}`}>
                          {item.category}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{item.subtitle}</p>
                      {item.description && (
                        <p className="mt-2 text-xs leading-relaxed text-gray-500">{item.description}</p>
                      )}

                      {/* Due date details */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        <span>Due: {item.dueDate} {item.dueTime}</span>
                      </div>
                    </div>

                    {/* Actions and deletion */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.actions && item.actions.map((act: any) => (
                        <a
                          key={act.label}
                          href={act.href}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
                        >
                          {act.label}
                        </a>
                      ))}
                      
                      {item.type === 'custom' && (
                        <button
                          onClick={() => handleDeleteReminder(item.id)}
                          className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Reminder"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0d0d20] border border-white/[0.08] rounded-2xl shadow-2xl p-6 relative font-outfit text-white">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-white mb-4">Add Task Reminder</h2>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Call company HR or prepare portfolio"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 focus:bg-white/[0.06] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0d0d20] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 outline-none transition-all"
                >
                  <option value="Personal">Personal Task</option>
                  <option value="Interview">Interview Prep</option>
                  <option value="Application">Job Application</option>
                  <option value="Subscription">Subscription</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Due Time</label>
                  <input
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Notes (Optional)</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Add details, links, or contact phone..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 focus:bg-white/[0.06] outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Create Reminder Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
