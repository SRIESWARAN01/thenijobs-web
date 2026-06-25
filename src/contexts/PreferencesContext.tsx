'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';
export type LanguageCode = 'en' | 'ta';

interface PreferencesContextValue {
  theme: ThemeMode;
  language: LanguageCode;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: LanguageCode) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const THEME_KEY = 'thenijobs.theme';
const LANGUAGE_KEY = 'thenijobs.language';

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
}

function getStoredLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  return window.localStorage.getItem(LANGUAGE_KEY) === 'ta' ? 'ta' : 'en';
}

function applyPreferences(theme: ThemeMode, language: LanguageCode) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const storedTheme = getStoredTheme();
    const storedLanguage = getStoredLanguage();
    setThemeState(storedTheme);
    setLanguageState(storedLanguage);
    applyPreferences(storedTheme, storedLanguage);
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
    applyPreferences(nextTheme, getStoredLanguage());
  }, []);

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    applyPreferences(getStoredTheme(), nextLanguage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  }, [language, setLanguage]);

  const value = useMemo(
    () => ({ theme, language, setTheme, setLanguage, toggleTheme, toggleLanguage }),
    [language, setLanguage, setTheme, theme, toggleLanguage, toggleTheme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
