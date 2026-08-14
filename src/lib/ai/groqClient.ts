import Groq from 'groq-sdk';
import { DEFAULT_GROQ_MODEL } from './config';

/**
 * Server-only Groq API Client Wrapper.
 * Reads GROQ_API_KEY and GROQ_MODEL strictly from environment.
 * NEVER import this file into client components!
 */

export interface GroqCompletionParams {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  responseFormatJson?: boolean;
}

export interface GroqResponse<T = any> {
  success: boolean;
  content: string;
  parsedJson?: T;
  model: string;
  error?: string;
}

export async function callGroqAI<T = any>(
  params: GroqCompletionParams
): Promise<GroqResponse<T>> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('[Groq AI] Missing GROQ_API_KEY environment variable.');
    return {
      success: false,
      content: '',
      model: params.model || DEFAULT_GROQ_MODEL,
      error: 'AI is temporarily unavailable. Please try again.',
    };
  }

  const activeModel = params.model || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  try {
    const groq = new Groq({ apiKey });

    const messages: any[] = [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userPrompt },
    ];

    const requestOptions: any = {
      messages,
      model: activeModel,
      temperature: 0.3,
    };

    if (params.responseFormatJson) {
      requestOptions.response_format = { type: 'json_object' };
    }

    const completion = await groq.chat.completions.create(requestOptions);
    const content = completion.choices[0]?.message?.content || '';

    let parsedJson: T | undefined = undefined;
    if (params.responseFormatJson && content) {
      try {
        parsedJson = JSON.parse(content);
      } catch (jsonErr) {
        console.warn('[Groq AI] Failed to parse JSON response directly. Cleaning markdown codeblocks...');
        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
        try {
          parsedJson = JSON.parse(cleaned);
        } catch (e) {
          console.error('[Groq AI] JSON parsing completely failed:', e);
        }
      }
    }

    return {
      success: true,
      content,
      parsedJson,
      model: activeModel,
    };
  } catch (err: any) {
    console.error('[Groq AI Service Error]:', err);
    return {
      success: false,
      content: '',
      model: activeModel,
      error: 'AI is temporarily unavailable. Please try again.',
    };
  }
}
