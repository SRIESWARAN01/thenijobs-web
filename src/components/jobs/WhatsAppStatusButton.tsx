'use client';

import React, { useState } from 'react';
import { Smartphone, MessageCircle } from 'lucide-react';
import WhatsAppStatusGeneratorModal from './WhatsAppStatusGeneratorModal';

interface WhatsAppStatusButtonProps {
  job: any;
  company?: any;
  variant?: 'button' | 'pill' | 'icon' | 'compact';
  className?: string;
}

export default function WhatsAppStatusButton({
  job,
  company,
  variant = 'compact',
  className = '',
}: WhatsAppStatusButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === 'icon' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          title="WhatsApp Status Poster (9:16) / வாட்ஸ்அப் ஸ்டேட்டஸ்"
          className={`p-2 rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer ${className}`}
        >
          <Smartphone size={15} />
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          title="9:16 WhatsApp Status & Story Generator (வாட்ஸ்அப் ஸ்டேட்டஸ்)"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-all cursor-pointer active:scale-95 ${className}`}
        >
          <Smartphone size={13} className="text-emerald-600 shrink-0" />
          <span>ஸ்டேட்டஸ் (9:16)</span>
        </button>
      )}

      {variant === 'pill' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 ${className}`}
        >
          <Smartphone size={14} className="shrink-0" />
          <span>வாட்ஸ்அப் ஸ்டேட்டஸ் போஸ்டர் (9:16)</span>
        </button>
      )}

      {variant === 'button' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 ${className}`}
        >
          <Smartphone size={16} className="shrink-0" />
          <span>📱 1-Tap WhatsApp Status Generator (9:16)</span>
        </button>
      )}

      {isOpen && (
        <WhatsAppStatusGeneratorModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          job={job}
          company={company}
        />
      )}
    </>
  );
}
