'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, Banknote, FileText, Zap, Users, Calendar, Phone, Video } from 'lucide-react';
import { updateDocument } from '@/lib/firebase/firestoreService';

type ModalType = 'salary' | 'description' | 'skills' | 'vacancies' | 'deadline' | 'contact' | 'interview' | null;

interface JobQuickUpdateModalsProps {
  activeModal: ModalType;
  onClose: () => void;
  jobId: string;
  currentData: {
    salaryMin?: number;
    salaryMax?: number;
    isNegotiable?: boolean;
    description?: string;
    skills?: string[];
    openings?: string;
    deadline?: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    interviewDate?: string;
    interviewTime?: string;
    interviewLocation?: string;
    meetingLink?: string;
  };
  onSuccess?: () => void;
}

const inputCls = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all";
const labelCls = "text-xs font-semibold text-gray-600 block mb-1.5";

export default function JobQuickUpdateModals({
  activeModal, onClose, jobId, currentData, onSuccess
}: JobQuickUpdateModalsProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Local form states
  const [salaryMin, setSalaryMin] = useState(String(currentData.salaryMin || ''));
  const [salaryMax, setSalaryMax] = useState(String(currentData.salaryMax || ''));
  const [isNegotiable, setIsNegotiable] = useState(currentData.isNegotiable || false);
  const [description, setDescription] = useState(currentData.description || '');
  const [skills, setSkills] = useState<string[]>(currentData.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [openings, setOpenings] = useState(currentData.openings || '1');
  const [deadline, setDeadline] = useState(currentData.deadline || '');
  const [contactPerson, setContactPerson] = useState(currentData.contactPerson || '');
  const [contactPhone, setContactPhone] = useState(currentData.contactPhone || '');
  const [contactEmail, setContactEmail] = useState(currentData.contactEmail || '');
  const [interviewDate, setInterviewDate] = useState(currentData.interviewDate || '');
  const [interviewTime, setInterviewTime] = useState(currentData.interviewTime || '');
  const [interviewLocation, setInterviewLocation] = useState(currentData.interviewLocation || '');
  const [meetingLink, setMeetingLink] = useState(currentData.meetingLink || '');

  // Reset on modal change
  useEffect(() => {
    setSuccess(false);
    setSalaryMin(String(currentData.salaryMin || ''));
    setSalaryMax(String(currentData.salaryMax || ''));
    setIsNegotiable(currentData.isNegotiable || false);
    setDescription(currentData.description || '');
    setSkills(currentData.skills || []);
    setOpenings(currentData.openings || '1');
    setDeadline(currentData.deadline || '');
    setContactPerson(currentData.contactPerson || '');
    setContactPhone(currentData.contactPhone || '');
    setContactEmail(currentData.contactEmail || '');
    setInterviewDate(currentData.interviewDate || '');
    setInterviewTime(currentData.interviewTime || '');
    setInterviewLocation(currentData.interviewLocation || '');
    setMeetingLink(currentData.meetingLink || '');
  }, [activeModal, currentData]);

  if (!activeModal) return null;

  const saveUpdate = async (fields: Record<string, any>) => {
    setLoading(true);
    try {
      await updateDocument('jobs', jobId, { ...fields, updatedAt: new Date() });
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkill('');
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter(x => x !== s));

  const MODAL_CONFIG: Record<string, { title: string; icon: typeof Banknote; color: string }> = {
    salary: { title: 'Update Salary', icon: Banknote, color: '#059669' },
    description: { title: 'Update Description', icon: FileText, color: '#2563EB' },
    skills: { title: 'Update Skills', icon: Zap, color: '#7C3AED' },
    vacancies: { title: 'Update Vacancies', icon: Users, color: '#D97706' },
    deadline: { title: 'Update Deadline', icon: Calendar, color: '#DC2626' },
    contact: { title: 'Update Contact', icon: Phone, color: '#0891B2' },
    interview: { title: 'Update Interview', icon: Video, color: '#E11D48' },
  };

  const config = MODAL_CONFIG[activeModal];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Icon size={18} style={{ color: config.color }} />
            <h3 className="text-sm font-bold text-gray-900">{config.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-500 transition-all tap-target-auto">
            <X size={16} />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-8 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check size={24} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Updated Successfully!</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Salary Modal */}
            {activeModal === 'salary' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="employer-jobquickupdatemodals-min-salary-mo" className={labelCls}>Min Salary (₹/mo)</label>
                    <input id="employer-jobquickupdatemodals-min-salary-mo" type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} className={inputCls} placeholder="15000" />
                  </div>
                  <div>
                    <label htmlFor="employer-jobquickupdatemodals-max-salary-mo" className={labelCls}>Max Salary (₹/mo)</label>
                    <input id="employer-jobquickupdatemodals-max-salary-mo" type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} className={inputCls} placeholder="25000" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={isNegotiable} onChange={e => setIsNegotiable(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 tap-target-auto" />
                  Salary is negotiable
                </label>
                <button onClick={() => saveUpdate({ salaryMin: Number(salaryMin), salaryMax: Number(salaryMax), isNegotiable })}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#2563EB' }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Salary
                </button>
              </>
            )}

            {/* Description Modal */}
            {activeModal === 'description' && (
              <>
                <div>
                  <label className={labelCls}>Job Description</label>
                  <textarea id="employer-jobquickupdatemodals-setisnegotiable-e-target-checked-classna" value={description} onChange={e => setDescription(e.target.value)}
                    className={inputCls + ' min-h-[150px] resize-y'} placeholder="Describe the role..." />
                </div>
                <button onClick={() => saveUpdate({ description })} disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#2563EB' }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Description
                </button>
              </>
            )}

            {/* Skills Modal */}
            {activeModal === 'skills' && (
              <>
                <div className="flex gap-2">
                  <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className={inputCls} aria-label="Add a skill" placeholder="Add a skill..." />
                  <button onClick={addSkill} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-all whitespace-nowrap">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 flex items-center gap-1">
                      {s}
                      <button onClick={() => removeSkill(s)} className="text-blue-400 hover:text-red-500 tap-target-auto">×</button>
                    </span>
                  ))}
                </div>
                <button onClick={() => saveUpdate({ skills })} disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#2563EB' }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Skills
                </button>
              </>
            )}

            {/* Vacancies Modal */}
            {activeModal === 'vacancies' && (
              <>
                <div>
                  <label htmlFor="employer-jobquickupdatemodals-number-of-openings" className={labelCls}>Number of Openings</label>
                  <select id="employer-jobquickupdatemodals-number-of-openings" value={openings} onChange={e => setOpenings(e.target.value)} className={inputCls}>
                    {['1','2','3','4','5','10','15','20','20+','50+','100+'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => saveUpdate({ openings })} disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#2563EB' }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Vacancies
                </button>
              </>
            )}

            {/* Deadline Modal */}
            {activeModal === 'deadline' && (
              <>
                <div>
                  <label htmlFor="employer-jobquickupdatemodals-application-deadline" className={labelCls}>Application Deadline</label>
                  <input id="employer-jobquickupdatemodals-application-deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputCls}
                    min={new Date().toISOString().split('T')[0]} />
                </div>
                <button onClick={() => saveUpdate({ deadline })} disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#2563EB' }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Deadline
                </button>
              </>
            )}

            {/* Contact Modal */}
            {activeModal === 'contact' && (
              <>
                <div>
                  <label htmlFor="employer-jobquickupdatemodals-contact-person" className={labelCls}>Contact Person</label>
                  <input id="employer-jobquickupdatemodals-contact-person" type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className={inputCls} placeholder="HR Manager" />
                </div>
                <div>
                  <label htmlFor="employer-jobquickupdatemodals-contact-phone" className={labelCls}>Contact Phone</label>
                  <input id="employer-jobquickupdatemodals-contact-phone" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className={inputCls} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label htmlFor="employer-jobquickupdatemodals-contact-email" className={labelCls}>Contact Email</label>
                  <input id="employer-jobquickupdatemodals-contact-email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className={inputCls} placeholder="hr@company.com" />
                </div>
                <button onClick={() => saveUpdate({ contactPerson, contactPhone, contactEmail })} disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#2563EB' }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Contact
                </button>
              </>
            )}

            {/* Interview Modal */}
            {activeModal === 'interview' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="employer-jobquickupdatemodals-interview-date" className={labelCls}>Interview Date</label>
                    <input id="employer-jobquickupdatemodals-interview-date" type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="employer-jobquickupdatemodals-interview-time" className={labelCls}>Interview Time</label>
                    <input id="employer-jobquickupdatemodals-interview-time" type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label htmlFor="employer-jobquickupdatemodals-location-venue" className={labelCls}>Location / Venue</label>
                  <input id="employer-jobquickupdatemodals-location-venue" type="text" value={interviewLocation} onChange={e => setInterviewLocation(e.target.value)} className={inputCls} placeholder="Office address or venue" />
                </div>
                <div>
                  <label htmlFor="employer-jobquickupdatemodals-meeting-link-optional" className={labelCls}>Meeting Link (optional)</label>
                  <input id="employer-jobquickupdatemodals-meeting-link-optional" type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className={inputCls} placeholder="https://meet.google.com/..." />
                </div>
                <button onClick={() => saveUpdate({ interviewDate, interviewTime, interviewLocation, meetingLink })} disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#2563EB' }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Interview Details
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
