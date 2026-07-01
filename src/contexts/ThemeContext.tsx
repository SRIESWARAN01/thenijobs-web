'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { PRESET_THEMES } from '@/components/company/CustomTemplates';
import { usePreferences } from '@/contexts/PreferencesContext';

export type ThemeName = 'classic-blue' | 'emerald-growth' | 'royal-purple' | 'sunset-amber' | 'royal-gold' | 'ocean-cyan' | 'forest-green' | 'midnight-dark';

interface ThemeContextValue {
  landingPageTheme: ThemeName;
  setLandingPageTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'thenijobs.landing_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [landingPageTheme, setLandingPageThemeState] = useState<ThemeName>('classic-blue');
  const { theme: colorMode } = usePreferences();
  const isDarkMode = colorMode === 'dark';

  // Apply theme classes and CSS variables to the document root element
  const applyTheme = useCallback((themeName: ThemeName, isDark: boolean) => {
    if (typeof document === 'undefined') return;

    const preset = PRESET_THEMES[themeName] || PRESET_THEMES['classic-blue'];
    const root = document.documentElement;

    const bg = isDark ? preset.darkBg : preset.bg;
    const card = isDark ? preset.darkCard : preset.card;
    const text = isDark ? preset.darkText : preset.text;
    const border = isDark ? preset.darkBorder : preset.border;

    // Set standard theme CSS variables on root
    root.style.setProperty('--theme-primary', preset.primary);
    root.style.setProperty('--theme-secondary', preset.secondary);
    root.style.setProperty('--theme-accent', preset.accent);
    root.style.setProperty('--theme-bg', bg);
    root.style.setProperty('--theme-card', card);
    root.style.setProperty('--theme-text', text);
    root.style.setProperty('--theme-border', border);
    root.style.setProperty('--theme-success', preset.success);
    root.style.setProperty('--theme-warning', preset.warning);
    root.style.setProperty('--theme-error', preset.error);

    // Apply font-family and transition overrides for smooth experience
    root.style.setProperty('--theme-font-sans', '"Inter", "Outfit", sans-serif');

    // Add list of CSS helper classes as a stylesheet override
    const styleId = 'thenijobs-theme-global-overrides';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      /* Theme Helper Classes */
      .bg-theme-main {
        background-color: var(--theme-bg) !important;
      }
      .bg-theme-card {
        background-color: var(--theme-card) !important;
      }
      .text-theme-primary {
        color: var(--theme-primary) !important;
      }
      .text-theme-accent {
        color: var(--theme-accent) !important;
      }
      .text-theme-body {
        color: var(--theme-text) !important;
      }
      .border-theme {
        border-color: var(--theme-border) !important;
      }
      .btn-theme-primary {
        background-color: var(--theme-primary) !important;
        color: #ffffff !important;
        transition: all 0.2s ease-in-out;
      }
      .btn-theme-primary:hover {
        background-color: var(--theme-secondary) !important;
        transform: translateY(-1px);
      }
      .btn-theme-secondary {
        background-color: var(--theme-card) !important;
        border: 1px solid var(--theme-border) !important;
        color: var(--theme-text) !important;
        transition: all 0.2s ease-in-out;
      }
      .btn-theme-secondary:hover {
        background-color: var(--theme-bg) !important;
        border-color: var(--theme-primary) !important;
      }
      .theme-pill {
        background-color: rgba(var(--theme-primary), 0.1);
        border: 1px solid var(--theme-border);
        color: var(--theme-primary);
      }
      .theme-gradient-text {
        background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .theme-border-glow:hover {
        border-color: var(--theme-primary) !important;
        box-shadow: 0 0 12px -2px rgba(var(--theme-primary), 0.2);
      }
      .theme-card-glow {
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .theme-icon-container {
        background-color: rgba(var(--theme-primary), 0.08) !important;
        color: var(--theme-primary) !important;
      }
    `;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeName;
      if (stored && Object.keys(PRESET_THEMES).includes(stored)) {
        setLandingPageThemeState(stored);
        applyTheme(stored, isDarkMode);
      } else {
        applyTheme('classic-blue', isDarkMode);
      }
    }
  }, [isDarkMode, applyTheme]);

  const setLandingPageTheme = useCallback((themeName: ThemeName) => {
    if (!Object.keys(PRESET_THEMES).includes(themeName)) return;
    setLandingPageThemeState(themeName);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, themeName);
    }
    applyTheme(themeName, isDarkMode);
  }, [isDarkMode, applyTheme]);

  const value = useMemo(() => ({
    landingPageTheme,
    setLandingPageTheme
  }), [landingPageTheme, setLandingPageTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
