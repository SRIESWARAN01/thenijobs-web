'use client';

import { useState } from 'react';
import { Languages, Moon, Sun, Paintbrush, Check } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTheme, type ThemeName } from '@/contexts/ThemeContext';
import { PRESET_THEMES } from '@/components/company/CustomTemplates';

const labels = {
  en: {
    language: 'English',
    switchLanguage: 'Switch to Tamil',
    theme: 'Dark mode',
    switchTheme: 'Switch theme',
    colorTheme: 'Color theme',
  },
  ta: {
    language: 'தமிழ்',
    switchLanguage: 'Switch to English',
    theme: 'Light mode',
    switchTheme: 'Switch theme',
    colorTheme: 'வண்ணத் திட்டம்',
  },
};

export default function PreferenceControls({ compact = false }: { compact?: boolean }) {
  const { language, theme, toggleLanguage, toggleTheme } = usePreferences();
  const { landingPageTheme, setLandingPageTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const copy = labels[language];
  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  const handleSelectTheme = (t: ThemeName) => {
    setLandingPageTheme(t);
    setShowThemeMenu(false);
  };

  return (
    <div className="flex items-center gap-2 relative">
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

      {/* Landing Page Visual Theme Paintbrush Switcher */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className="inline-flex h-12 w-12 md:h-10 md:w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-teal-200 hover:text-teal-700"
          aria-label={copy.colorTheme}
          title={copy.colorTheme}
        >
          <Paintbrush size={17} className="text-violet-600" />
        </button>

        {showThemeMenu && (
          <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-[999] animate-slideDown text-slate-900">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">
              Select Page Theme
            </p>
            <div className="space-y-0.5">
              {(Object.keys(PRESET_THEMES).slice(0, 8) as ThemeName[]).map((tKey) => {
                const isSelected = landingPageTheme === tKey;
                const preset = PRESET_THEMES[tKey];
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => handleSelectTheme(tKey)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                      isSelected
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/5 shrink-0"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span>{preset.name}</span>
                    </div>
                    {isSelected && <Check size={12} className="text-violet-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
