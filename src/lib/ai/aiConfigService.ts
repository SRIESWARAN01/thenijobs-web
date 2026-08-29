/**
 * AI Config Service
 * Reads/writes AI provider config from/to Firestore.
 * Handles API key masking and provider factory creation.
 * Server-side only (used in API routes).
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createGeminiProvider } from './providers/geminiProvider';
import { createGroqProvider } from './providers/groqProvider';
import { createOpenAIProvider } from './providers/openaiProvider';
import type { AIProvider, AIProviderConfig } from './providers/index';
import { DEFAULT_AI_CONFIG } from './providers/index';

const CONFIG_DOC_PATH = 'platformSettings/aiConfig';

/**
 * Mask an API key for display: "gsk_jDnEb...ffTj"
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 10) return key ? '****' : '';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

/**
 * Get AI config from Firestore
 */
export async function getAIConfig(): Promise<AIProviderConfig> {
  try {
    const snap = await getDoc(doc(db, 'platformSettings', 'aiConfig'));
    if (snap.exists()) {
      return snap.data() as AIProviderConfig;
    }
  } catch (err) {
    console.error('[AIConfig] Failed to read config:', err);
  }
  return DEFAULT_AI_CONFIG;
}

/**
 * Save AI config to Firestore (admin only)
 */
export async function saveAIConfig(
  config: Partial<AIProviderConfig>,
  adminUid: string
): Promise<void> {
  await setDoc(doc(db, 'platformSettings', 'aiConfig'), {
    ...config,
    updatedAt: serverTimestamp(),
    updatedBy: adminUid,
  }, { merge: true });
}

/**
 * Update a single provider's config
 */
export async function updateProviderConfig(
  providerName: 'gemini' | 'groq' | 'openai',
  updates: {
    apiKey?: string;
    model?: string;
    status?: 'connected' | 'error' | 'untested';
    lastTested?: any;
    lastError?: string | null;
  },
  adminUid: string
): Promise<void> {
  const config = await getAIConfig();
  const provider = config.providers[providerName];

  const updated = {
    ...provider,
    ...updates,
    apiKeyMasked: updates.apiKey ? maskApiKey(updates.apiKey) : provider.apiKeyMasked,
  };

  await saveAIConfig({
    providers: {
      ...config.providers,
      [providerName]: updated,
    },
  }, adminUid);
}

/**
 * Factory: Create an AIProvider instance from config
 */
export function getProviderClient(
  providerName: 'gemini' | 'groq' | 'openai',
  config: AIProviderConfig
): AIProvider | null {
  const entry = config.providers[providerName];
  const apiKey = entry?.apiKey || (
    providerName === 'gemini' ? (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) :
    providerName === 'groq' ? process.env.GROQ_API_KEY :
    providerName === 'openai' ? process.env.OPENAI_API_KEY : undefined
  );

  if (!apiKey) return null;

  switch (providerName) {
    case 'gemini':
      return createGeminiProvider(apiKey, entry?.model || process.env.GEMINI_MODEL || 'gemini-flash-latest');
    case 'groq':
      return createGroqProvider(apiKey, entry?.model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b');
    case 'openai':
      return createOpenAIProvider(apiKey, entry?.model || 'gpt-4o-mini');
    default:
      return null;
  }
}

/**
 * Get the active provider client, with fallback
 */
export async function getActiveProvider(): Promise<{
  provider: AIProvider | null;
  config: AIProviderConfig;
  isUsingFallback: boolean;
}> {
  const config = await getAIConfig();

  if (!config.aiEnabled) {
    return { provider: null, config, isUsingFallback: false };
  }

  // 1. Try active provider
  let provider = getProviderClient(config.activeProvider, config);
  if (provider) {
    return { provider, config, isUsingFallback: false };
  }

  // 2. Try Groq via environment key
  const envGroqKey = process.env.GROQ_API_KEY;
  if (envGroqKey) {
    provider = createGroqProvider(envGroqKey, process.env.GROQ_MODEL || 'openai/gpt-oss-120b');
    return { provider, config, isUsingFallback: true };
  }

  // 3. Try fallback provider from config
  if (config.fallbackProvider && config.fallbackProvider !== 'none') {
    provider = getProviderClient(config.fallbackProvider, config);
    if (provider) {
      return { provider, config, isUsingFallback: true };
    }
  }

  // 4. Try Gemini via environment key
  const envGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (envGeminiKey) {
    provider = createGeminiProvider(envGeminiKey, process.env.GEMINI_MODEL || 'gemini-flash-latest');
    return { provider, config, isUsingFallback: true };
  }

  return { provider: null, config, isUsingFallback: false };
}
