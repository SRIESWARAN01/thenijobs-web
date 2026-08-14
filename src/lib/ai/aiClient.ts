import { AIFeatureKey } from './config';

export interface RequestAIOptions {
  feature: AIFeatureKey;
  userId?: string;
  userRole?: 'SEEKER' | 'COMPANY' | 'ADMIN' | 'GUEST';
  payload?: any;
}

export interface AIResponseResult<T = any> {
  success: boolean;
  data?: T;
  rawContent?: string;
  creditsDeducted?: number;
  error?: string;
}

/**
 * Centralized Client Helper for calling THENIJOBS AI Service.
 * Safely routes requests through /api/ai server-side endpoint.
 */
export async function requestAIService<T = any>(
  options: RequestAIOptions
): Promise<AIResponseResult<T>> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feature: options.feature,
        userId: options.userId,
        userRole: options.userRole || 'SEEKER',
        payload: options.payload || {},
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'AI is temporarily unavailable. Please try again.',
      };
    }

    return {
      success: true,
      data: result.data as T,
      rawContent: result.rawContent,
      creditsDeducted: result.creditsDeducted,
    };
  } catch (err: any) {
    console.error('[AI Client Request Error]:', err);
    return {
      success: false,
      error: 'AI is temporarily unavailable. Please try again.',
    };
  }
}
