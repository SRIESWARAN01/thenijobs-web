'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, RefreshCw, Zap } from 'lucide-react';
import { requestAIService } from '@/lib/ai/aiClient';
import type { AIFeatureKey } from '@/lib/ai/config';

interface AIContentAssistantProps {
  companyName: string;
  industry?: string;
  district?: string;
  contentType: 'about' | 'service' | 'seo_title' | 'seo_description';
  onGenerated: (text: string) => void;
}

const CONTENT_FEATURE_MAP: Record<AIContentAssistantProps['contentType'], AIFeatureKey> = {
  about: 'company_description',
  service: 'service_product_description',
  seo_title: 'company_description',
  seo_description: 'company_description',
};

export default function AIContentAssistant({
  companyName,
  industry = 'Business',
  district = 'Theni',
  contentType,
  onGenerated,
}: AIContentAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let prompt = '';
      if (contentType === 'about') {
        prompt = `Write a professional 3-paragraph "About Us" section for a company named "${companyName}" in the ${industry} industry located in ${district}, Tamil Nadu. Highlight trust, quality, and community commitment. Keep tone professional yet approachable.`;
      } else if (contentType === 'service') {
        prompt = `Generate a compelling service description (2-3 sentences) for "${companyName}" operating in ${industry} in ${district}.`;
      } else if (contentType === 'seo_title') {
        prompt = `Generate a catchy SEO title tag (under 60 characters) for "${companyName}" in ${district}, Tamil Nadu. Include primary category keywords.`;
      } else if (contentType === 'seo_description') {
        prompt = `Generate a high-converting meta description (under 155 characters) for "${companyName}" in ${district}, Tamil Nadu. Include a clear call to action.`;
      }

      const result = await requestAIService<string>({
        feature: CONTENT_FEATURE_MAP[contentType],
        payload: { prompt, companyName, industry, district, contentType },
      });

      if (result.success && (result.data || result.rawContent)) {
        const text = (result.data || result.rawContent || '').toString();
        const cleaned = text.trim().replace(/^["']|["']$/g, '');
        setGeneratedText(cleaned);
      }
    } catch (err) {
      console.error('AI content generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedText) {
      onGenerated(generatedText);
      setGeneratedText('');
    }
  };

  return (
    <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 space-y-2 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-violet-900 flex items-center gap-1.5 text-[11px]">
          <Sparkles size={13} className="text-violet-600 animate-pulse" /> AI Assistant
        </span>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-violet-600 text-white font-bold text-[10px] hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1 transition-all"
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
          {generatedText ? 'Regenerate' : 'Generate with AI'}
        </button>
      </div>

      {generatedText && (
        <div className="space-y-2 mt-2 pt-2 border-t border-violet-100">
          <p className="text-gray-700 leading-relaxed bg-white p-2.5 rounded-lg border border-violet-100 text-[11px]">
            {generatedText}
          </p>
          <button
            onClick={handleApply}
            className="w-full py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 flex items-center justify-center gap-1 transition-all"
          >
            <Check size={11} /> Apply to Website
          </button>
        </div>
      )}
    </div>
  );
}
