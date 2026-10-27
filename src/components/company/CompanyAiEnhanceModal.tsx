'use client';

import React, { useState } from 'react';
import {
  Sparkles, X, Check, RefreshCw, AlertCircle, ArrowRight,
  Globe, Tag, CheckCheck, Edit3, ShieldAlert, BookOpen, Layers
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';

export interface CompanyAiEnhanceResult {
  tagline: string;
  shortIntro: string;
  enhancedDescription: string;
  suggestedCategories: string[];
  suggestedKeywords: string[];
  suggestedSections: Array<{ title: string; content: string }>;
  marketingHighlights: string[];
  language: 'en' | 'ta';
  disclaimer: string;
}

export interface CompanyAiOriginalData {
  companyName: string;
  category: string;
  district: string;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
  shortDescription?: string;
  tagline?: string;
}

interface CompanyAiEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalData: CompanyAiOriginalData;
  onApply: (appliedFields: {
    description?: string;
    tagline?: string;
    category?: string;
    highlights?: string[];
    aiEnhanced: boolean;
    aiOriginalContent?: any;
    aiEnhancedAt?: Date;
  }) => void;
}

export default function CompanyAiEnhanceModal({
  isOpen,
  onClose,
  originalData,
  onApply,
}: CompanyAiEnhanceModalProps) {
  const { user } = useAuth();
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyAiEnhanceResult | null>(null);

  // Field-level accepted states
  const [acceptTagline, setAcceptTagline] = useState(true);
  const [acceptDescription, setAcceptDescription] = useState(true);
  const [acceptIntro, setAcceptIntro] = useState(true);
  const [acceptCategories, setAcceptCategories] = useState(false);

  // User-edited generated values
  const [editedTagline, setEditedTagline] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedIntro, setEditedIntro] = useState('');
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (targetLang = language) => {
    setLoading(true);
    setError(null);
    try {
      const idToken = auth.currentUser
        ? await auth.currentUser.getIdToken()
        : (typeof (user as any)?.getIdToken === 'function' ? await (user as any).getIdToken() : undefined);
      const res = await fetch('/api/company/auto-enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          companyName: originalData.companyName,
          category: originalData.category,
          district: originalData.district,
          location: originalData.location,
          phone: originalData.phone,
          email: originalData.email,
          website: originalData.website,
          shortDescription: originalData.shortDescription,
          language: targetLang,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to generate enhanced company content');
      }

      const data: CompanyAiEnhanceResult = json.data;
      setResult(data);
      setEditedTagline(data.tagline);
      setEditedDescription(data.enhancedDescription);
      setEditedIntro(data.shortIntro);
    } catch (err: any) {
      setError(err.message || 'Error occurred while contacting Gemini AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (newLang: 'en' | 'ta') => {
    setLanguage(newLang);
    handleGenerate(newLang);
  };

  const handleApplyChanges = () => {
    if (!result) return;

    const applied: any = {
      aiEnhanced: true,
      aiEnhancedAt: new Date(),
      aiOriginalContent: {
        description: originalData.shortDescription || '',
        tagline: originalData.tagline || '',
        category: originalData.category || '',
      },
    };

    if (acceptTagline && editedTagline.trim()) {
      applied.tagline = editedTagline.trim();
    }
    if (acceptDescription && editedDescription.trim()) {
      applied.description = editedDescription.trim();
    }
    if (acceptCategories && result.suggestedCategories.length > 0) {
      applied.category = result.suggestedCategories[0];
    }
    if (result.marketingHighlights && result.marketingHighlights.length > 0) {
      applied.highlights = result.marketingHighlights;
    }

    onApply(applied);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-outfit">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">AI Company Auto-Enhance</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-blue-950 font-bold text-xs uppercase tracking-wider">
                  Gemini Powered
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Enhance your company profile, tagline, and overview with zero data fabrication.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex bg-blue-950/40 p-1 rounded-xl border border-white/15 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleLanguageToggle('en')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  language === 'en' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageToggle('ta')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  language === 'ta' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Strict Data Integrity & Verification Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Zero Fabrication Policy & Mandatory Admin Review</p>
              <p className="text-amber-800 leading-relaxed">
                Gemini AI enhances and polishes your writing style based strictly on provided notes. It will never invent GST numbers, official certifications, founding dates, or revenue claims. All AI enhancements remain pending until verified and approved by the Platform Administrator.
              </p>
            </div>
          </div>

          {/* Initial State Prompt if not generated yet */}
          {!result && !loading && !error && (
            <div className="text-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Ready to Auto-Enhance &ldquo;{originalData.companyName || 'Your Company'}&rdquo;
              </h3>
              <p className="text-sm text-gray-600 max-w-lg mx-auto mb-6">
                Our Gemini AI engine will analyze your company name, location, and short description to write a professional overview, punchy tagline, and structured profile sections.
              </p>
              <button
                type="button"
                onClick={() => handleGenerate()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                <Sparkles size={16} /> Generate Enhanced Profile Now
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-14 space-y-4">
              <RefreshCw className="w-9 h-9 text-blue-600 animate-spin mx-auto" />
              <div>
                <p className="font-bold text-gray-900 text-base">Gemini AI is crafting your company profile...</p>
                <p className="text-xs text-gray-500">
                  Polishing phrasing in {language === 'ta' ? 'professional Tamil' : 'professional English'} without fabricating facts.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-800 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => handleGenerate()}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Results Side-by-Side Comparison */}
          {result && !loading && (
            <div className="space-y-6">

              {/* 1. Tagline Comparison */}
              <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-blue-600" />
                    <h4 className="font-bold text-gray-900 text-sm">Company Tagline</h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-700 select-none">
                    <input
                      type="checkbox"
                      checked={acceptTagline}
                      onChange={(e) => setAcceptTagline(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    Accept this Tagline
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <span className="font-semibold text-gray-500 block mb-1">ORIGINAL:</span>
                    <p className="text-gray-700 italic">
                      {originalData.tagline || 'None provided'}
                    </p>
                  </div>

                  <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 relative group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-blue-800">AI ENHANCED:</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingTagline(!isEditingTagline)}
                        className="text-blue-600 hover:text-blue-800 text-[11px] flex items-center gap-1"
                      >
                        <Edit3 size={12} /> {isEditingTagline ? 'Done' : 'Edit'}
                      </button>
                    </div>
                    {isEditingTagline ? (
                      <input
                        type="text"
                        value={editedTagline}
                        onChange={(e) => setEditedTagline(e.target.value)}
                        className="w-full text-xs font-medium text-blue-900 bg-white border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <p className="font-bold text-blue-950 text-sm">
                        &ldquo;{editedTagline || result.tagline}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Detailed Overview Description */}
              <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-blue-600" />
                    <h4 className="font-bold text-gray-900 text-sm">Company Overview & Description</h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-700 select-none">
                    <input
                      type="checkbox"
                      checked={acceptDescription}
                      onChange={(e) => setAcceptDescription(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    Accept Enhanced Description
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="font-semibold text-gray-500 block mb-1">ORIGINAL USER NOTES:</span>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {originalData.shortDescription || 'No description provided initially.'}
                    </p>
                  </div>

                  <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-blue-800">AI EXPANDED & POLISHED:</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingDescription(!isEditingDescription)}
                        className="text-blue-600 hover:text-blue-800 text-[11px] flex items-center gap-1"
                      >
                        <Edit3 size={12} /> {isEditingDescription ? 'Done' : 'Edit'}
                      </button>
                    </div>

                    {isEditingDescription ? (
                      <textarea
                        rows={7}
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="w-full text-xs font-normal text-blue-950 bg-white border border-blue-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                      />
                    ) : (
                      <p className="text-blue-950 whitespace-pre-line leading-relaxed">
                        {editedDescription || result.enhancedDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Suggested Categories & Keywords */}
              <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-blue-600" />
                    <h4 className="font-bold text-gray-900 text-sm">Suggested SEO Keywords & Categories</h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-700 select-none">
                    <input
                      type="checkbox"
                      checked={acceptCategories}
                      onChange={(e) => setAcceptCategories(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    Adopt AI Primary Category
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Suggested Categories
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {result.suggestedCategories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs border border-blue-200"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Discovery Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.suggestedKeywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-xs border border-gray-200"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Marketing Highlights */}
              {result.marketingHighlights && result.marketingHighlights.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4">
                  <h5 className="font-bold text-indigo-950 text-xs uppercase tracking-wider mb-2">
                    Key Value Highlights
                  </h5>
                  <ul className="space-y-1.5 text-xs text-indigo-900">
                    {result.marketingHighlights.map((hl, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-600 shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            {result ? (
              <span>Fields checked with &ldquo;Accept&rdquo; will replace your current form inputs upon confirmation.</span>
            ) : (
              <span>Click Generate to begin AI auto-enhancement.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>

            {result && (
              <button
                type="button"
                onClick={handleApplyChanges}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <CheckCheck size={16} /> Apply Selected Enhancements
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
