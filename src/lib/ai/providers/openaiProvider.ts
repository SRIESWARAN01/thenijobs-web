/**
 * OpenAI AI Provider
 */
import OpenAI from 'openai';
import type { AIProvider, AICompletionParams, AIProviderResponse, AITestResult } from './index';

export function createOpenAIProvider(apiKey: string, model: string): AIProvider {
  return {
    name: 'openai',

    async complete(params: AICompletionParams): Promise<AIProviderResponse> {
      try {
        const client = new OpenAI({ apiKey });
        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt },
          ],
          max_tokens: params.maxTokens || 2048,
          temperature: params.temperature || 0.7,
          ...(params.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
        });

        const text = response.choices?.[0]?.message?.content || '';
        let parsedJson;
        if (params.jsonMode) {
          try { parsedJson = JSON.parse(text); } catch { /* not valid JSON */ }
        }

        return { success: true, content: text, parsedJson, model, provider: 'openai' };
      } catch (err: any) {
        return { success: false, content: '', model, provider: 'openai', error: err.message };
      }
    },

    async testConnection(): Promise<AITestResult> {
      const start = Date.now();
      try {
        const client = new OpenAI({ apiKey });
        const response = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: 'Say "hello" in one word.' }],
          max_tokens: 10,
        });
        const text = response.choices?.[0]?.message?.content || '';
        return { success: !!text, latencyMs: Date.now() - start, model, provider: 'openai' };
      } catch (err: any) {
        return { success: false, latencyMs: Date.now() - start, model, provider: 'openai', error: err.message };
      }
    },
  };
}
