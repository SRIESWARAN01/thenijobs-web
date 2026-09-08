'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, RefreshCw, Zap } from 'lucide-react';
import { requestAIService } from '@/lib/ai/aiClient';
import type { AIFeatureKey } from '@/lib/ai/config';
import { useToast } from '@/contexts/ToastContext';

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

// api/ai/route.ts's company_description/service_product_description case always returns a JSON
// object shaped like companyPrompt.ts's schema (description/tagline/services/products/
// marketingCopy/metaTitle/metaDescription), never a plain string -- this picks the one field each
// contentType actually wants out of that object.
interface CompanyContentResponse {
  description?: string;
  tagline?: string;
  marketingCopy?: string;
  metaTitle?: string;
  metaDescription?: string;
}

function pickGeneratedField(contentType: AIContentAssistantProps['contentType'], data: CompanyContentResponse): string {
  if (contentType === 'seo_title') return data.metaTitle || '';
  if (contentType === 'seo_description') return data.metaDescription || '';
  return data.description || data.marketingCopy || '';
}

export default function AIContentAssistant({
  companyName,
  industry = 'Business',
  district = 'Theni',
  contentType,
  onGenerated,
}: AIContentAssistantProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await requestAIService<CompanyContentResponse>({
        feature: CONTENT_FEATURE_MAP[contentType],
        userRole: 'COMPANY',
        payload: {
          companyName,
          category: industry,
          district,
          contentType: CONTENT_FEATURE_MAP[contentType],
        },
      });

      const text = result.success && result.data ? pickGeneratedField(contentType, result.data) : '';
      if (text) {
        setGeneratedText(text.trim().replace(/^["']|["']$/g, ''));
      } else {
        toast.error(result.error || 'AI is temporarily unavailable. Please try again.');
      }
    } catch {
      toast.error('AI is temporarily unavailable. Please try again.');
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
