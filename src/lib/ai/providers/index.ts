/**
 * AI Provider Interface & Types
 * Unified interface for all AI providers (Gemini, Groq, OpenAI)
 */

export interface AIProviderResponse {
  success: boolean;
  content: string;
  parsedJson?: any;
  model: string;
  provider: string;
  error?: string;
}

export interface AICompletionParams {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface AITestResult {
  success: boolean;
  latencyMs: number;
  model: string;
  provider: string;
  error?: string;
}

export interface AIProvider {
  name: string;
  complete(params: AICompletionParams): Promise<AIProviderResponse>;
  testConnection(): Promise<AITestResult>;
}

export interface AIProviderConfig {
  activeProvider: 'gemini' | 'groq' | 'openai';
  fallbackProvider: 'gemini' | 'groq' | 'openai' | 'none';
  aiEnabled: boolean;
  providers: {
    gemini: ProviderEntry;
    groq: ProviderEntry;
    openai: ProviderEntry;
  };
  updatedAt?: any;
  updatedBy?: string;
}

export interface ProviderEntry {
  apiKey: string;
  apiKeyMasked: string;
  model: string;
  availableModels: string[];
  status: 'connected' | 'error' | 'untested';
  lastTested: any | null;
  lastError: string | null;
}

/** Available models per provider */
export const PROVIDER_MODELS: Record<string, string[]> = {
  gemini: ['gemini-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
};

/** Default provider config */
export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  activeProvider: 'gemini',
  fallbackProvider: 'groq',
  aiEnabled: true,
  providers: {
    gemini: {
      apiKey: '', apiKeyMasked: '', model: 'gemini-flash-latest',
      availableModels: PROVIDER_MODELS.gemini, status: 'untested', lastTested: null, lastError: null,
    },
    groq: {
      apiKey: '', apiKeyMasked: '', model: 'llama-3.3-70b-versatile',
      availableModels: PROVIDER_MODELS.groq, status: 'untested', lastTested: null, lastError: null,
    },
    openai: {
      apiKey: '', apiKeyMasked: '', model: 'gpt-4o-mini',
      availableModels: PROVIDER_MODELS.openai, status: 'untested', lastTested: null, lastError: null,
    },
  },
};
