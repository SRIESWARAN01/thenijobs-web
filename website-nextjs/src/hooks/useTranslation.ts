'use client';

import { usePreferences } from '@/contexts/PreferencesContext';
import { en } from '@/lib/locales/en';
import { ta } from '@/lib/locales/ta';

export function useTranslation() {
  const { language } = usePreferences();
  const translations = language === 'ta' ? ta : en;

  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }
    return typeof value === 'string' ? value : (fallback || key);
  };

  return { t, language };
}
