'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Building2, MapPin, Globe, FileText, Image,
  Clock, ChevronRight, Check, ArrowLeft, ArrowRight,
  Loader2, Upload, Plus, X, BadgeCheck
} from 'lucide-react';
import { BUSINESS_CATEGORIES, TN_DISTRICTS } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { notifyAllAdmins } from '@/lib/firebase/adminNotify';

const STEPS = [
  { id: 1, label: 'Basic Info', icon: Building2 },
  { id: 2, label: 'Contact & Location', icon: MapPin },
  { id: 3, label: 'Media Upload', icon: Image },
  { id: 4, label: 'Details & Social', icon: Globe },
  { id: 5, label: 'Services', icon: FileText },
  { id: 6, label: 'Preview & Submit', icon: Check },
];

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];
const HOURS = ['08:00 AM', '09:00 AM', '10:00 AM'] as const;

export default function CompanyRegisterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');

  const [form, setForm] = useState({
    name: '', category: '', subcategory: '', foundedYear: '',
    companySize: '', gstNumber: '', registrationNumber: '', description: '',
    phone: '', alternatePhone: '', email: '', website: '', whatsapp: '',
    address: '', district: '', state: 'Tamil Nadu', country: 'India',
    facebook: '', instagram: '', linkedin: '', youtube: '',
    openFrom: '09:00 AM', openTo: '06:00 PM' });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const addService = () => { if (newService.trim()) { setServices(s => [...s, newService.trim()]); setNewService(''); } };
  const removeService = (i: number) => setServices(s => s.filter((_, idx) => idx !== i));

  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.district.trim()) {
      alert('Please fill in Company Name, Phone Number, and District.');
      return;
    }

    setLoading(true);
    try {
      const slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `company-${Date.now()}`;

      const ownerId = user ? user.uid : `guest_${form.phone.replace(/[^0-9]/g, '') || Date.now()}`;

      await addDoc(collection(db, 'companies'), {
        ...form,
        foundedYear: form.foundedYear ? parseInt(form.foundedYear) : '',
        services,
        ownerId,
        ownerEmail: user?.email || form.email || '',
        verificationStatus: 'pending',
        isActive: false,
        isVerified: false,
        isPremium: false,
        rating: 0,
        reviewCount: 0,
        viewCount: 0,
        enquiryCount: 0,
        followerCount: 0,
        slug,
        verificationBadges: {
          mobileVerified: !!form.phone,
          emailVerified: !!form.email,
          gstVerified: !!form.gstNumber,
          businessVerified: false },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp() });

      // Notify all admins about the new registration
      await notifyAllAdmins(
        'New Company Registration 🏢',
        `"${form.name}" (${form.category || 'General'}, ${form.district}) submitted registration and is awaiting approval. Phone: ${form.phone}`,
        '/admin/businesses',
      );

      setSubmittedSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert('Error registering business. Please try again: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-28 md:pb-12">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-outfit font-bold text-gray-900">
            Register Your <span className="gradient-text">Business</span>
          </h1>
          <p className="text-slate-600 text-sm mt-2 font-medium">
            Get your own SEO-friendly page on THENIJOBS. Google-ready from day one.
          </p>
        </div>

        {submittedSuccess ? (
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-10 text-center space-y-5 shadow-lg animate-fade-in font-outfit">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <BadgeCheck size={36} />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase tracking-wide">
                ⏳ Verification Pending
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">Registration Submitted!</h2>
              <p className="text-xs text-gray-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                Thank you for registering <strong>&quot;{form.name}&quot;</strong>. Your business details have been sent to the THENIJOBS verification queue. Admin will review and verify your listing within <strong>2 to 4 hours</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-left max-w-md mx-auto space-y-2 text-gray-700">
              <p className="flex justify-between"><span className="text-gray-400">Business:</span> <strong>{form.name}</strong></p>
              <p className="flex justify-between"><span className="text-gray-400">Category:</span> <strong>{form.category || 'General'}</strong></p>
              <p className="flex justify-between"><span className="text-gray-400">District:</span> <strong>{form.district}</strong></p>
              <p className="flex justify-between"><span className="text-gray-400">Contact:</span> <strong>{form.phone}</strong></p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all text-center"
              >
                Login to Portal / Track Status
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all text-center"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
            <div className="overflow-x-auto no-scrollbar mb-8">
              <div className="flex items-center gap-1 min-w-max mx-auto justify-center">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const isDone = step > s.id;
                  const isCurrent = step === s.id;
                  return (
                    <div key={s.id} className="flex items-center gap-1">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                        ${isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isCurrent ? 'bg-violet-600 text-white'
                            : 'bg-white/5 text-gray-500 border border-gray-200'}`}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center">
                          {isDone ? <Check size={12} /> : <Icon size={12} />}
                        </div>
                        <span className="hidden sm:inline">{s.label}</span>
                      </div>
                      {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-700" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Card */}
            <div className="glass-card rounded-3xl p-6 sm:p-8">

          {/* STEP 1 — Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 size={18} className="text-violet-400" /> Basic Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Company / Business Name *</label>
                  <input type="text" placeholder="Company or business name"
                    value={form.name} onChange={e => update('name', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                  <p className="text-xs text-gray-600 mt-1">Your URL: thenijobs.com/company/<span className="text-violet-400">{form.name.toLowerCase().replace(/\s+/g, '-') || 'your-business-name'}</span></p>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Business Category *</label>
                  <select value={form.category} onChange={e => update('category', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm">
                    <option value="">Select category</option>
                    {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Sub-category</label>
                  <input type="text" placeholder="Sub-category"
                    value={form.subcategory} onChange={e => update('subcategory', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Founded Year</label>
                  <input type="number" placeholder="Year" min="1900" max="2025"
                    value={form.foundedYear} onChange={e => update('foundedYear', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Company Size</label>
                  <select value={form.companySize} onChange={e => update('companySize', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm">
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">GST Number (Optional)</label>
                  <input type="text" placeholder="GST Number"
                    value={form.gstNumber} onChange={e => update('gstNumber', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Registration Number (Optional)</label>
                  <input type="text" placeholder="Registration or license number"
                    value={form.registrationNumber} onChange={e => update('registrationNumber', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Business Description * <span className="text-gray-600">(for SEO – min 100 words)</span></label>
                  <textarea rows={5} placeholder="Describe your business, services offered, and what makes you unique. This will appear on Google Search results."
                    value={form.description} onChange={e => update('description', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm resize-none leading-relaxed" />
                  <p className="text-xs text-gray-600 mt-1">{form.description.split(' ').filter(Boolean).length} words</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Contact & Location */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-violet-400" /> Contact & Location
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Mobile Number *</label>
                  <div className="flex gap-2">
                    <div className="search-input px-3 py-3 text-sm text-gray-400 w-14 text-center rounded-xl">+91</div>
                    <input type="tel" maxLength={10} placeholder="Mobile number"
                      value={form.phone} onChange={e => update('phone', e.target.value)}
                      className="search-input flex-1 px-4 py-3 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Alternate Number</label>
                  <div className="flex gap-2">
                    <div className="search-input px-3 py-3 text-sm text-gray-400 w-14 text-center rounded-xl">+91</div>
                    <input type="tel" maxLength={10} placeholder="Optional"
                      value={form.alternatePhone} onChange={e => update('alternatePhone', e.target.value)}
                      className="search-input flex-1 px-4 py-3 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Email Address *</label>
                  <input type="email" placeholder="contact@yourbusiness.com"
                    value={form.email} onChange={e => update('email', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">WhatsApp Number</label>
                  <div className="flex gap-2">
                    <div className="search-input px-3 py-3 text-sm text-gray-400 w-14 text-center rounded-xl">+91</div>
                    <input type="tel" maxLength={10} placeholder="WhatsApp number"
                      value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)}
                      className="search-input flex-1 px-4 py-3 text-sm" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Website URL</label>
                  <input type="url" placeholder="https://yourbusiness.com"
                    value={form.website} onChange={e => update('website', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Full Address *</label>
                  <textarea rows={2} placeholder="Door no., Street, Area, Town"
                    value={form.address} onChange={e => update('address', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm resize-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">District *</label>
                  <select value={form.district} onChange={e => update('district', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm">
                    <option value="">Select district</option>
                    {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">State</label>
                  <input type="text" value={form.state} readOnly className="search-input w-full px-4 py-3 text-sm opacity-60" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Opening Time</label>
                  <input type="time" value="09:00" className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1.5">Closing Time</label>
                  <input type="time" value="18:00" className="search-input w-full px-4 py-3 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Media Upload */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Image size={18} className="text-violet-400" /> Media Upload
              </h2>
              {[
                { label: 'Company Logo', hint: 'PNG/JPG, Square, min 200×200px', accept: '.png,.jpg,.jpeg', icon: '🖼️' },
                { label: 'Cover Image', hint: 'JPG/PNG, Landscape 1200×400px recommended', accept: '.png,.jpg,.jpeg', icon: '🏞️' },
              ].map(item => (
                <div key={item.label}>
                  <label className="text-xs text-slate-600 font-medium block mb-2">{item.label}</label>
                  <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer group">
                    <div className="text-4xl">{item.icon}</div>
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 group-hover:text-violet-300 transition-colors">
                        <Upload size={14} /> Click to upload
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.hint}</p>
                    </div>
                    <input type="file" accept={item.accept} className="hidden" />
                  </label>
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-2">Gallery Images (up to 10)</label>
                <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer group">
                  <div className="text-4xl">📷</div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 group-hover:text-violet-300 transition-colors">
                      <Upload size={14} /> Upload multiple images
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Office, products, team, work site photos</p>
                  </div>
                  <input type="file" accept=".png,.jpg,.jpeg" multiple className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* STEP 4 — Details & Social */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Globe size={18} className="text-violet-400" /> Social Media & Additional Details
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'facebook', label: 'Facebook Page URL', placeholder: 'https://facebook.com/yourpage', icon: '📘' },
                  { key: 'instagram', label: 'Instagram Profile URL', placeholder: 'https://instagram.com/yourhandle', icon: '📷' },
                  { key: 'linkedin', label: 'LinkedIn Company Page', placeholder: 'https://linkedin.com/company/...', icon: '💼' },
                  { key: 'youtube', label: 'YouTube Channel', placeholder: 'https://youtube.com/@yourchannel', icon: '▶️' },
                ].map(({ key, label, placeholder, icon }) => (
                  <div key={key}>
                    <label className="text-xs text-slate-600 font-medium block mb-1.5">{icon} {label}</label>
                    <input type="url" placeholder={placeholder}
                      value={(form as any)[key]} onChange={e => update(key, e.target.value)}
                      className="search-input w-full px-4 py-3 text-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5 — Services */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-violet-400" /> Business Services
              </h2>
              <p className="text-sm text-gray-400">Add the services your business offers. These help customers find you and improve SEO.</p>
              <div className="flex gap-2">
                <input type="text" value={newService} onChange={e => setNewService(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addService()}
                  placeholder="Add a service your business offers"
                  className="search-input flex-1 px-4 py-3 text-sm" />
                <button onClick={addService}
                  className="btn-gradient px-4 py-3 rounded-xl relative z-10 flex items-center gap-1 text-sm font-semibold">
                  <Plus size={15} /> Add
                </button>
              </div>
              {services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {services.map((s, i) => (
                    <span key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-200 text-sm font-medium">
                      ✓ {s}
                      <button onClick={() => removeService(i)} className="hover:text-rose-400 transition-colors"><X size={13} /></button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 rounded-2xl">
                  Add at least 3 services to improve discoverability
                </div>
              )}
              <div className="glass-card rounded-2xl p-4 border border-emerald-200">
                <p className="text-xs text-emerald-400 font-medium mb-1">💡 SEO Tip</p>
                <p className="text-xs text-gray-400">Each service you add becomes a keyword that helps customers find you on Google. Add specific, detailed service names.</p>
              </div>
            </div>
          )}

          {/* STEP 6 — Preview & Submit */}
          {step === 6 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Check size={18} className="text-violet-400" /> Preview & Submit
              </h2>

              {/* Preview Card */}
              <div className="glass-card rounded-2xl p-5 border border-violet-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-200 flex items-center justify-center text-2xl">🏢</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{form.name || 'Your Business Name'}</h3>
                      <span className="badge-verified">PENDING</span>
                    </div>
                    <div className="text-sm text-gray-400">{form.category || 'Category'} • {form.district || 'District'}</div>
                    <div className="text-xs text-violet-400 mt-0.5">
                      thenijobs.com/company/{(form.name || 'your-business').toLowerCase().replace(/\s+/g, '-')}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{form.description.slice(0, 200) || 'Your business description will appear here...'}</p>
                {services.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                    {services.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/15">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* What happens next */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">What happens next?</p>
                {[
                  { step: '1', text: 'Your profile will be reviewed within 24 hours', icon: Clock },
                  { step: '2', text: 'Once approved, your SEO page goes live instantly', icon: BadgeCheck },
                  { step: '3', text: 'Google will index your page within 3–7 days', icon: Check },
                ].map(({ step, text, icon: Icon }) => (
                  <div key={step} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{step}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-300"><Icon size={13} className="text-emerald-400" />{text}</div>
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 accent-violet-600" />
                <span className="text-xs text-gray-400">
                  I agree to THENIJOBS <Link href="/terms" className="text-violet-400">Terms of Service</Link> and confirm that all information provided is accurate.
                </span>
              </label>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="btn-outline-glass px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              onClick={step === 6 ? handleSubmit : () => setStep(s => s + 1)}
              disabled={loading}
              className="flex-1 btn-gradient py-3 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {step === 6 ? 'Submit for Review' : 'Continue'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </>
      )}
      </div>
      <BottomNav />
    </main>
  );
}
