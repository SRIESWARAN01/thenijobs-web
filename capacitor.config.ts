import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thenijobs.thenijobs',
  appName: 'THENIJOBS',
  webDir: 'out',

  // Load from live server — enables SSR, API routes, and dynamic pages
  server: {
    url: 'https://thenijobs.com',
    cleartext: false,
  },

  android: {
    backgroundColor: '#0a0a1a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a1a',
    },
  },
};

export default config;
