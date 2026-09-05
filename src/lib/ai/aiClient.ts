import { AIFeatureKey } from './config';
import { auth } from '@/lib/firebase/config';

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
    // AI-1: this used to send only Content-Type, so the server's token check — which was
    // written as `if (authHeader)` — never ran for a single real request, and the server took
    // the caller's identity from the `userId` field of this body instead. The server now
    // requires the token for everything except the guest chatbot, so it has to be sent.
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) headers.Authorization = `Bearer ${idToken}`;
    } catch (tokenErr) {
      // No token means the request goes up as a guest and the server decides what a guest may
      // do. Failing here would break the guest chatbot, which is allowed to have no token.
      console.warn('[AI Client] Could not attach an auth token:', tokenErr);
    }

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        // `userId` is still sent for compatibility with older callers, but the server ignores
        // it entirely and uses the token above. It decides nothing.
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
