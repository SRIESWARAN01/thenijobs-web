/**
 * THENIJOBS Design System Tokens
 * Global design tokens for consistent branding, typography, spacing, and colors
 * Supports light and dark themes with semantic color system
 */

export const DESIGN_TOKENS = {
  // ============ COLOR PALETTE ============
  colors: {
    // Primary Brand Color - Teal (Professional, trustworthy)
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Primary
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c2d6b',
    },

    // Accent - Saffron (Tamil cultural connection)
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Accent
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },

    // Semantic Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
    warning: {
      50: '#fefce8',
      100: '#fef3c7',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },

    // Neutral Grayscale
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      150: '#edeff4', // Between 100-200
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
  },

  // ============ TYPOGRAPHY ============
  typography: {
    fonts: {
      sora: '"Sora", ui-sans-serif, system-ui, -apple-system, sans-serif',
      inter: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
      mono: '"Fira Code", monospace',
    },

    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
      '6xl': '3.75rem', // 60px
    },

    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    lineHeights: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },

    letterSpacings: {
      tight: '-0.02em',
      normal: '0em',
      wide: '0.02em',
      wider: '0.05em',
    },
  },

  // ============ SPACING (8px Grid System) ============
  spacing: {
    0: '0rem', // 0px
    0.5: '0.125rem', // 2px
    1: '0.25rem', // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem', // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem', // 12px
    3.5: '0.875rem', // 14px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    7: '1.75rem', // 28px
    8: '2rem', // 32px
    9: '2.25rem', // 36px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    14: '3.5rem', // 56px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    28: '7rem', // 112px
    32: '8rem', // 128px
  },

  // ============ BORDER RADIUS ============
  borderRadius: {
    none: '0rem',
    xs: '0.125rem', // 2px
    sm: '0.25rem', // 4px
    base: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem', // 32px
    full: '9999px',
  },

  // ============ SHADOWS ============
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    premium: '0 20px 60px rgba(0, 0, 0, 0.15)',
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
    'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
  },

  // ============ TRANSITIONS & ANIMATIONS ============
  transitions: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },

  easings: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    ease: 'ease',
  },

  // ============ BREAKPOINTS ============
  breakpoints: {
    xs: '320px',
    sm: '375px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px',
    '3xl': '1920px',
  },

  // ============ Z-INDEX LAYERS ============
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    'modal-backdrop': 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
    notification: 1700,
  },
};

// ============ SEMANTIC TOKENS FOR LIGHT THEME ============
export const LIGHT_THEME = {
  background: {
    primary: DESIGN_TOKENS.colors.neutral[0],
    secondary: DESIGN_TOKENS.colors.neutral[50],
    tertiary: DESIGN_TOKENS.colors.neutral[100],
  },
  text: {
    primary: DESIGN_TOKENS.colors.neutral[900],
    secondary: DESIGN_TOKENS.colors.neutral[700],
    tertiary: DESIGN_TOKENS.colors.neutral[600],
    muted: DESIGN_TOKENS.colors.neutral[500],
  },
  border: DESIGN_TOKENS.colors.neutral[200],
  input: {
    background: DESIGN_TOKENS.colors.neutral[0],
    border: DESIGN_TOKENS.colors.neutral[300],
    focus: DESIGN_TOKENS.colors.primary[500],
  },
};

// ============ SEMANTIC TOKENS FOR DARK THEME ============
export const DARK_THEME = {
  background: {
    primary: DESIGN_TOKENS.colors.neutral[950],
    secondary: DESIGN_TOKENS.colors.neutral[900],
    tertiary: DESIGN_TOKENS.colors.neutral[800],
  },
  text: {
    primary: DESIGN_TOKENS.colors.neutral[0],
    secondary: DESIGN_TOKENS.colors.neutral[200],
    tertiary: DESIGN_TOKENS.colors.neutral[400],
    muted: DESIGN_TOKENS.colors.neutral[500],
  },
  border: DESIGN_TOKENS.colors.neutral[700],
  input: {
    background: DESIGN_TOKENS.colors.neutral[900],
    border: DESIGN_TOKENS.colors.neutral[700],
    focus: DESIGN_TOKENS.colors.primary[500],
  },
};

export type DesignTokens = typeof DESIGN_TOKENS;
export type ThemeTokens = typeof LIGHT_THEME;
