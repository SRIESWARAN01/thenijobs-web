'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Upload, FileText, Download, Trash2, Star, CheckCircle,
  File, Clock, Zap, ChevronRight, Lightbulb, Shield,
  HardDrive, Eye, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { useUploadFile, useDeleteFile } from '@/hooks/useStorage';
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';

interface ResumeFile {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  isDefault: boolean;
  format: string;
  url?: string;
  storagePath?: string;
}

export default function ResumeManagementPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  // 1. Fetch seekerProfile to get resumes list in real-time
  const { data: seekerProfile, loading: profileLoading } = useDocument<any>('seekerProfiles', uid);
  const resumes: ResumeFile[] = seekerProfile?.resumes || [];

  const { uploadFile, progress: uploadProgress, loading: uploading } = useUploadFile();
  const { deleteFile } = useDeleteFile();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const saveResumesToDb = async (newResumes: ResumeFile[]) => {
    if (!uid) return;
    try {
      await setDoc(doc(db, 'seekerProfiles', uid), {
        resumes: newResumes
      }, { merge: true });
    } catch (err) {
      console.error('Failed to save resumes:', err);
      toast.error('Failed to update resumes list.');
    }
  };

  const handleUpload = async (file: File) => {
    if (!uid) return;
    try {
      const timestamp = Date.now();
      const storagePath = `resumes/${uid}/${timestamp}_${file.name}`;
      const downloadUrl = await uploadFile(file, storagePath, {
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSizeBytes: 5 * 1024 * 1024
      });

      const newResume: ResumeFile = {
        id: timestamp.toString(),
        name: file.name,
        uploadDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        size: `${(file.size / 1024).toFixed(0)} KB`,
        isDefault: resumes.length === 0,
        format: file.name.split('.').pop()?.toUpperCase() || 'PDF',
        url: downloadUrl,
        storagePath: storagePath
      };

      await saveResumesToDb([...resumes, newResume]);
    } catch (err) {
      console.error(err);
      toast.error('Upload failed', (err as Error).message);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, [resumes, uid]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const setAsDefault = async (id: string) => {
    const updated = resumes.map(r => ({ ...r, isDefault: r.id === id }));
    await saveResumesToDb(updated);
  };

  const handleDeleteResume = async (resume: ResumeFile) => {
    if (!confirm(`Are you sure you want to delete "${resume.name}"?`)) return;

    if (resume.storagePath) {
      try {
        await deleteFile(resume.storagePath);
      } catch (err) {
        console.error('Failed to delete storage file:', err);
      }
    }

    const updated = resumes.filter(r => r.id !== resume.id);
    if (resume.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    await saveResumesToDb(updated);
  };

  return (
    <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto font-outfit text-gray-900">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-outfit font-bold text-gray-900">Resume Management</h1>
        <p className="text-sm text-slate-500 mt-1">Upload, manage, and build your professional resume</p>
      </div>

      {uploading && (
        <div className="glass-card rounded-2xl p-4 border border-emerald-200 bg-emerald-50 flex items-center gap-3">
          <Loader2 size={18} className="text-emerald-400 animate-spin" />
          <span className="text-xs text-gray-300">Uploading resume... {uploadProgress}%</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Resume Zone */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-4">
              <Upload size={15} className="text-emerald-400" /> Upload Resume
            </h2>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500/60 bg-emerald-100'
                  : 'border-white/15 hover:border-emerald-500/40 hover:bg-emerald-50'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                isDragging ? 'bg-emerald-500/20' : 'bg-white'
              }`}>
                <Upload size={24} className={isDragging ? 'text-emerald-400' : 'text-gray-400'} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {isDragging ? 'Drop your resume here' : 'Drag & drop your resume here'}
                </p>
                <p className="text-xs text-gray-505 mt-1">
                  or <span className="text-emerald-400 font-medium">browse files</span> — PDF, DOC (max 5MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Resume Versions List */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <FileText size={15} className="text-emerald-400" /> My Resumes
              </h2>
              <span className="text-xs text-gray-505">{resumes.length} resume{resumes.length !== 1 ? 's' : ''}</span>
            </div>
            
            {profileLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={24} className="text-emerald-400 animate-spin mb-2" />
                <p className="text-xs text-gray-505">Loading resumes...</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {resumes.map(resume => (
                  <div key={resume.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                    {/* File Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      resume.isDefault
                        ? 'bg-emerald-500/15 border border-emerald-200'
                        : 'bg-white border border-gray-100'
                    }`}>
                      <File size={20} className={resume.isDefault ? 'text-emerald-400' : 'text-gray-400'} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{resume.name}</p>
                        {resume.isDefault && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-200 font-bold uppercase">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-505">
                        <span className="flex items-center gap-1"><Clock size={10} /> {resume.uploadDate}</span>
                        <span className="flex items-center gap-1"><HardDrive size={10} /> {resume.size}</span>
                        <span className="uppercase font-medium text-gray-600">{resume.format}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!resume.isDefault && (
                        <button
                          onClick={() => setAsDefault(resume.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-100 transition-all"
                          title="Set as Default"
                        >
                          <Star size={14} />
                        </button>
                      )}
                      {resume.url && resume.url !== '#' ? (
                        <>
                          <button
                            onClick={() => window.open(resume.url, '_blank')}
                            className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Preview"
                          >
                            <Eye size={14} />
                          </button>
                          <a
                            href={resume.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Download"
                          >
                            <Download size={14} />
                          </a>
                        </>
                      ) : (
                        <Link
                          href="/seeker/resume/builder"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all flex items-center gap-1 border border-blue-200"
                          title="Edit in Resume Builder"
                        >
                          <Eye size={12} /> Edit / PDF
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteResume(resume)}
                        className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-red-100 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {resumes.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    <FileText size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No resumes uploaded yet</p>
                    <p className="text-xs mt-1">Upload your first resume to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resume Builder CTA */}
          <Link
            href="/seeker/resume/builder"
            className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-emerald-200 transition-all group block"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Zap size={24} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-400 transition-colors">
                Build Resume Online
              </h3>
              <p className="text-xs text-gray-450 mt-0.5">
                Use our step-by-step builder to create a professional resume. Choose from 3 templates.
              </p>
              <div className="flex items-center gap-3 mt-2">
                {['Professional', 'Modern', 'Simple'].map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-lg bg-white text-gray-400 border border-gray-100">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-600 group-hover:text-emerald-400 transition-colors shrink-0" />
          </Link>
        </div>

        {/* Right Column - Tips */}
        <div className="space-y-6">
          {/* Resume Tips */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-4">
              <Lightbulb size={15} className="text-amber-400" /> Resume Tips
            </h3>
            <div className="space-y-3">
              {[
                { tip: 'Keep your resume to 1-2 pages for better readability', icon: FileText },
                { tip: 'Use keywords from job descriptions to pass ATS scans', icon: Shield },
                { tip: 'Quantify achievements with numbers and percentages', icon: Star },
                { tip: 'Update your resume every 3-6 months', icon: Clock },
                { tip: 'Use a professional email address', icon: CheckCircle },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={11} className="text-amber-400" />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.tip}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Resume Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Resumes', value: resumes.length.toString(), color: 'text-emerald-400' },
                { label: 'Default Resume Format', value: resumes.find(r => r.isDefault)?.format || 'None', color: 'text-cyan-400' },
                { label: 'Last Updated', value: resumes.length > 0 ? resumes[resumes.length - 1].uploadDate : 'Never', color: 'text-amber-400' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                  <span className="text-xs text-gray-400">{stat.label}</span>
                  <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
