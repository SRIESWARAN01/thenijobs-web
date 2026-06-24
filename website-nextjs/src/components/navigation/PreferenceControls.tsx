'use client';

import { Languages, Moon, Sun } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';

const labels = {
  en: {
    language: 'English',
    switchLanguage: 'Switch to Tamil',
    theme: 'Dark mode',
    switchTheme: 'Switch theme',
  },
  ta: {
    language: 'தமிழ்',
    switchLanguage: 'Switch to English',
    theme: 'Light mode',
    switchTheme: 'Switch theme',
  },
};

export default function PreferenceControls({ compact = false }: { compact?: boolean }) {
  const { language, theme, toggleLanguage, toggleTheme } = usePreferences();
  const copy = labels[language];
  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleLanguage}
        className="inline-flex h-12 md:h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition-colors hover:border-teal-200 hover:text-teal-700"
        aria-label={copy.switchLanguage}
        title={copy.switchLanguage}
      >
        <Languages size={16} />
        {!compact && <span>{copy.language}</span>}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex h-12 w-12 md:h-10 md:w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-teal-200 hover:text-teal-700"
        aria-label={copy.switchTheme}
        title={copy.theme}
      >
        <ThemeIcon size={17} />
      </button>
    </div>
  );
}
