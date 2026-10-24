'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import {
  User, Lock, Sparkles, MapPin, Briefcase, Globe,
  ImagePlus, Save, Trash2, RefreshCw, Upload, CheckCircle2,
  AlertCircle, Loader2, Clock, Camera, ShieldCheck
} from 'lucide-react';
import { LinkedinIcon } from '@/components/ui/BrandIcons';
import Link from 'next/link';
import { FounderProfile, FOUNDER_DESIGNATIONS, FounderDesignation } from '@/lib/types';
import { hasFeaturePermission } from '@/lib/plans';
import { useUploadFile, useDeleteFile } from '@/hooks/useStorage';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { optimizeImageForUpload } from '@/lib/storage/imageOptimizer';
import { useToast } from '@/contexts/ToastContext';

export interface CompanyFounderManagerProps {
  founder?: FounderProfile;
  companyId?: string;
  planSlug?: string;
  viewerIsAdmin?: boolean;
  onChange: (founder: FounderProfile) => void;
  onSaved?: (founder: FounderProfile) => void;
}

const STANDARD_DESIGNATIONS: string[] = [
  'Founder',
  'Co-Founder',
  'Owner',
  'CEO',
  'Managing Director',
  'Chairman',
  'Director',
  'Proprietor',
  'Other'
];

export default function CompanyFounderManager({
  founder,
  companyId,
  planSlug = 'free',
  viewerIsAdmin = false,
  onChange,
  onSaved,
}: CompanyFounderManagerProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feature permission gate (Admins always have access)
  const isEnabled = viewerIsAdmin || hasFeaturePermission(planSlug, 'founderProfile');

  // Storage hooks
  const { uploadFile, progress: uploadProgress, loading: uploading } = useUploadFile();
  const { deleteFile } = useDeleteFile();

  // Internal form state
  const [form, setForm] = useState<FounderProfile>({
    name: founder?.name || '',
    designation: founder?.designation || 'Founder',
    customDesignation: founder?.customDesignation || '',
    photoUrl: founder?.photoUrl || '',
    photoStoragePath: founder?.photoStoragePath || '',
    bio: founder?.bio || '',
    linkedinUrl: founder?.linkedinUrl || '',
    since: founder?.since || founder?.founderSince || '',
    experienceYears: founder?.experienceYears || founder?.experience || '',
    nativePlace: founder?.nativePlace || '',
    message: founder?.message || '',
    twitterUrl: founder?.twitterUrl || '',
    facebookUrl: founder?.facebookUrl || ''
  });

  // Designation dropdown selection
  const [selectedDesignation, setSelectedDesignation] = useState<string>('Founder');
  const [customDesignation, setCustomDesignation] = useState<string>('');

  // Staged file for upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(founder?.photoUrl || null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync external founder prop updates
  useEffect(() => {
    if (founder) {
      const currentDesig = founder.designation || '';
      const isStandard = STANDARD_DESIGNATIONS.includes(currentDesig);

      if (isStandard && currentDesig !== 'Other') {
        setSelectedDesignation(currentDesig);
        setCustomDesignation('');
      } else if (currentDesig) {
        setSelectedDesignation('Other');
        setCustomDesignation(founder.customDesignation || currentDesig);
      } else {
        setSelectedDesignation('Founder');
        setCustomDesignation('');
      }

      setForm({
        name: founder.name || '',
        designation: founder.designation || (isStandard ? currentDesig : 'Founder'),
        customDesignation: founder.customDesignation || (!isStandard ? currentDesig : ''),
        photoUrl: founder.photoUrl || '',
        photoStoragePath: founder.photoStoragePath || '',
        bio: founder.bio || '',
        linkedinUrl: founder.linkedinUrl || '',
        since: founder.since || founder.founderSince || '',
        experienceYears: founder.experienceYears || founder.experience || '',
        nativePlace: founder.nativePlace || '',
        message: founder.message || '',
        twitterUrl: founder.twitterUrl || '',
        facebookUrl: founder.facebookUrl || ''
      });

      if (!selectedFile) {
        setPreviewUrl(founder.photoUrl || null);
      }
    }
  }, [founder]);

  // Clean up staged blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle Designation selection
  const handleDesignationSelect = (value: string) => {
    setSelectedDesignation(value);
    let resolved = value;
    if (value === 'Other') {
      resolved = customDesignation.trim();
    }
    const updated = {
      ...form,
      designation: resolved,
      customDesignation: value === 'Other' ? customDesignation : ''
    };
    setForm(updated);
    onChange(updated);
  };

  const handleCustomDesignationChange = (customVal: string) => {
    setCustomDesignation(customVal);
    const updated = {
      ...form,
      designation: customVal.trim() || 'Other',
      customDesignation: customVal
    };
    setForm(updated);
    onChange(updated);
  };

  // Field updater
  const updateField = (key: keyof FounderProfile, value: string) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    onChange(updated);
  };

  // File selection & validation
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate File MIME Type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate File Size (Max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error('File size exceeds 5 MB. Please select a smaller photo.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Revoke previous blob URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Generate local instant preview
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setImageError(false);
    setSaveSuccess(false);

    // Update parent with current preview so real-time cards reflect selection
    const updated = { ...form, photoUrl: objectUrl };
    setForm(updated);
    onChange(updated);
  };

  // Remove photo
  const handleRemovePhoto = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageError(false);
    setSaveSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const updated = {
      ...form,
      photoUrl: '',
      photoStoragePath: ''
    };
    setForm(updated);
    onChange(updated);
    toast.info('Profile photo removed. Save changes to update the profile.');
  };

  // Save Founder Profile (direct save or parent update)
  const handleSaveFounder = async () => {
    // 1. Validation
    if (!form.name?.trim()) {
      toast.error('Founder / Owner Name is required.');
      return;
    }

    const effectiveDesignation = selectedDesignation === 'Other'
      ? customDesignation.trim()
      : selectedDesignation;

    if (!effectiveDesignation) {
      toast.error('Designation is required. Please specify a role.');
      return;
    }

    if (!previewUrl && !form.photoUrl && !selectedFile) {
      toast.error('Founder / Owner Profile Photo is required.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      let finalPhotoUrl = form.photoUrl || '';
      let finalStoragePath = form.photoStoragePath || '';
      const previousPhotoUrl = founder?.photoUrl || '';

      // 2. Upload new photo to Firebase Storage if a new file was staged
      if (selectedFile && companyId) {
        // Optimize client-side to WebP (max 800x800, 85% quality, 5MB limit)
        const optimizedFile = await optimizeImageForUpload(selectedFile, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.85,
          maxInputBytes: 5 * 1024 * 1024,
          label: 'Founder profile photo'
        });

        const storagePath = `companies/${companyId}/founder/founder_${Date.now()}.webp`;
        finalPhotoUrl = await uploadFile(optimizedFile, storagePath);
        finalStoragePath = storagePath;

        // Clean up previous storage asset if exists and different
        if (previousPhotoUrl && previousPhotoUrl !== finalPhotoUrl && !previousPhotoUrl.startsWith('blob:')) {
          deleteFile(previousPhotoUrl).catch(err => {
            console.warn('Note on previous founder photo cleanup:', err);
          });
        }
      }

      // If user removed photo and saved
      if (!previewUrl && !selectedFile && previousPhotoUrl && !previousPhotoUrl.startsWith('blob:')) {
        deleteFile(previousPhotoUrl).catch(err => {
          console.warn('Note on deleted founder photo cleanup:', err);
        });
        finalPhotoUrl = '';
        finalStoragePath = '';
      }

      const finalFounder: FounderProfile = {
        name: form.name.trim(),
        designation: effectiveDesignation,
        customDesignation: selectedDesignation === 'Other' ? customDesignation.trim() : '',
        photoUrl: finalPhotoUrl,
        photoStoragePath: finalStoragePath,
        bio: form.bio?.trim() || '',
        linkedinUrl: form.linkedinUrl?.trim() || '',
        since: form.since?.trim() || '',
        founderSince: form.since?.trim() || '',
        experienceYears: form.experienceYears?.trim() || '',
        experience: form.experienceYears?.trim() || '',
        nativePlace: form.nativePlace?.trim() || '',
        message: form.message?.trim() || '',
        twitterUrl: form.twitterUrl?.trim() || '',
        facebookUrl: form.facebookUrl?.trim() || ''
      };

      // 3. Persist to Firestore if companyId exists
      if (companyId) {
        await updateDocument('companies', companyId, {
          founder: finalFounder,
          founderName: finalFounder.name,
          founderDesignation: finalFounder.designation,
          founderPhotoUrl: finalFounder.photoUrl,
          founderPhotoStoragePath: finalFounder.photoStoragePath,
          founderBio: finalFounder.bio,
          founderLinkedInUrl: finalFounder.linkedinUrl,
          founderSince: finalFounder.since,
          founderExperience: finalFounder.experienceYears,
          updatedAt: new Date()
        });
      }

      // 4. Update parent state
      setForm(finalFounder);
      setSelectedFile(null);
      setPreviewUrl(finalPhotoUrl || null);
      onChange(finalFounder);
      onSaved?.(finalFounder);

      setSaveSuccess(true);
      toast.success('Founder & Owner Profile saved successfully!');
    } catch (err: any) {
      console.error('Founder Profile save error:', err);
      toast.error(err?.message || 'Failed to save Founder & Owner profile.');
    } finally {
      setSaving(false);
    }
  };

  // Locked plan view
  if (!isEnabled) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 p-8 text-center shadow-sm font-outfit">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/30">
          <Lock size={32} />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
          <Sparkles size={13} /> Standard &amp; Premium Feature
        </span>
        <h3 className="mt-3 text-xl font-bold text-slate-900">Founder &amp; Owner Profile Locked</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Upgrade to our <strong className="text-slate-900 font-semibold">Standard Plan (₹1,800/yr)</strong> or higher to feature your company founder or owner, leadership bio, photo, experience, and LinkedIn links.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/employer/subscription"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <span>Upgrade Subscription</span>
            <Sparkles size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-outfit">
      {/* ── Section Header ── */}
      <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <User size={22} className="text-blue-600" />
            Founder &amp; Owner Profile
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Showcase your company founder or owner.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-fadeIn">
              <CheckCircle2 size={14} /> Saved &amp; Live
            </span>
          )}
          {uploading && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              <Loader2 size={14} className="animate-spin" /> Uploading {uploadProgress}%
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Profile Photo Upload & Card Preview ── */}
        <div className="space-y-6 lg:col-span-1">
          <div className="p-6 rounded-3xl border border-slate-200/80 bg-slate-50/70 text-center space-y-4 shadow-xs">
            <div className="text-left">
              <label className="text-xs font-bold text-slate-800 block">
                Founder / Owner Profile Photo <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                JPG, PNG, or WebP. Max 5 MB.
              </p>
            </div>

            {/* Photo Avatar Preview */}
            <div className="relative mx-auto w-36 h-36 rounded-3xl overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center group">
              {previewUrl && !imageError ? (
                <img
                  src={previewUrl}
                  alt={form.name || 'Founder Profile'}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                  <User size={48} className="text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-400 mt-1">No Photo</span>
                </div>
              )}

              {/* Upload Progress Overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2">
                  <Loader2 size={24} className="animate-spin text-blue-400 mb-1" />
                  <span className="text-[11px] font-bold">{uploadProgress}%</span>
                  <div className="w-3/4 h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Hover quick action overlay */}
              {!uploading && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold cursor-pointer"
                  title="Click to choose a new photo"
                >
                  <Camera size={22} className="mb-1" />
                  <span>{previewUrl ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Upload size={14} className="text-blue-600" />
                <span>{previewUrl ? 'Replace Photo' : 'Upload Profile Photo'}</span>
              </button>

              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                  className="w-full py-2 px-4 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 text-xs font-semibold text-red-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Trash2 size={13} />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            {/* Live Card Mini-Preview */}
            <div className="mt-4 pt-4 border-t border-slate-200/70 text-left space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Card Preview</p>
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {form.name || 'Founder / Owner Name'}
                </p>
                <p className="text-[11px] font-semibold text-blue-600 truncate">
                  {selectedDesignation === 'Other' ? (customDesignation || 'Custom Designation') : selectedDesignation}
                </p>
                {form.since && (
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                    <Clock size={10} className="text-amber-500" /> Since {form.since}
                  </p>
                )}
                {form.experienceYears && (
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Briefcase size={10} className="text-emerald-500" /> {form.experienceYears}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Form Fields ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Row 1: Required Fields (Name & Designation) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Founder / Owner Name */}
            <div>
              <label htmlFor="founder-name-input" className="text-xs font-bold text-slate-800 block mb-1.5">
                Founder / Owner Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="founder-name-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. S. Ramanathan"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Full legal or professional name</p>
            </div>

            {/* Designation Dropdown */}
            <div>
              <label htmlFor="founder-designation-select" className="text-xs font-bold text-slate-800 block mb-1.5">
                Designation <span className="text-red-500">*</span>
              </label>
              <select
                id="founder-designation-select"
                value={selectedDesignation}
                onChange={(e) => handleDesignationSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium cursor-pointer"
              >
                {STANDARD_DESIGNATIONS.map((desig) => (
                  <option key={desig} value={desig}>
                    {desig}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Official title in the organization</p>
            </div>
          </div>

          {/* Conditional Custom Designation when "Other" is selected */}
          {selectedDesignation === 'Other' && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 animate-fadeIn">
              <label htmlFor="founder-custom-designation" className="text-xs font-bold text-blue-900 block mb-1.5">
                Custom Designation <span className="text-red-500">*</span>
              </label>
              <input
                id="founder-custom-designation"
                type="text"
                value={customDesignation}
                onChange={(e) => handleCustomDesignationChange(e.target.value)}
                placeholder="e.g. Chief Operating Officer, Managing Partner"
                className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
              />
              <p className="text-[11px] text-blue-700/80 mt-1">Specify your custom designation or role title</p>
            </div>
          )}

          {/* Row 2: Optional Timeline & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Founder Since / Established Year */}
            <div>
              <label htmlFor="founder-since-input" className="text-xs font-bold text-slate-800 block mb-1.5">
                Founder Since / Established Year
              </label>
              <div className="relative">
                <input
                  id="founder-since-input"
                  type="text"
                  value={form.since || ''}
                  onChange={(e) => updateField('since', e.target.value)}
                  placeholder="e.g. 2018 or Established 2018"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Year established or active since</p>
            </div>

            {/* Professional Experience */}
            <div>
              <label htmlFor="founder-experience-input" className="text-xs font-bold text-slate-800 block mb-1.5">
                Professional Experience
              </label>
              <div className="relative">
                <input
                  id="founder-experience-input"
                  type="text"
                  value={form.experienceYears || ''}
                  onChange={(e) => updateField('experienceYears', e.target.value)}
                  placeholder="e.g. 15+ Years Industry Experience"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Career or leadership tenure</p>
            </div>
          </div>

          {/* Row 3: LinkedIn Profile URL */}
          <div>
            <label htmlFor="founder-linkedin-input" className="text-xs font-bold text-slate-800 block mb-1.5">
              LinkedIn Profile URL
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                <LinkedinIcon size={16} />
              </span>
              <input
                id="founder-linkedin-input"
                type="url"
                value={form.linkedinUrl || ''}
                onChange={(e) => updateField('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Professional profile link for applicant confidence</p>
          </div>

          {/* Row 4: About Founder / Owner (Biography) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="founder-bio-textarea" className="text-xs font-bold text-slate-800">
                About Founder / Owner
              </label>
              <span className="text-[11px] text-slate-400">
                {form.bio?.length || 0} / 600
              </span>
            </div>
            <textarea
              id="founder-bio-textarea"
              rows={3}
              maxLength={600}
              value={form.bio || ''}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Share the founder's vision, educational background, professional story, or commitment to Theni district..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium resize-y"
            />
          </div>

          {/* Row 5: Founder's Message / Quote (Optional Brand Message) */}
          <div>
            <label htmlFor="founder-message-textarea" className="text-xs font-bold text-slate-800 block mb-1.5">
              Founder&apos;s Message to Clients &amp; Candidates (Optional)
            </label>
            <textarea
              id="founder-message-textarea"
              rows={2}
              maxLength={300}
              value={form.message || ''}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder="&quot;Our mission is to empower local trade and deliver reliable craftsmanship across Tamil Nadu...&quot;"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium resize-y"
            />
          </div>

          {/* Save Action Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Public profile displays only verified information entered above.</span>
            </div>

            <button
              type="button"
              onClick={handleSaveFounder}
              disabled={saving || uploading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {saving || uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Founder Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
