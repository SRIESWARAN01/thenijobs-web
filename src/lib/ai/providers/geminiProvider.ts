/**
 * Gemini AI Provider
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, AICompletionParams, AIProviderResponse, AITestResult } from './index';

export function createGeminiProvider(apiKey: string, model: string): AIProvider {
  return {
    name: 'gemini',

    async complete(params: AICompletionParams): Promise<AIProviderResponse> {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const genModel = genAI.getGenerativeModel({
          model,
          generationConfig: {
            maxOutputTokens: params.maxTokens || 2048,
            temperature: params.temperature || 0.7,
            ...(params.jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        });

        const chat = genModel.startChat({
          history: [{ role: 'user', parts: [{ text: params.systemPrompt }] },
                    { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] }],
        });

        const result = await chat.sendMessage(params.userPrompt);
        const text = result.response.text();

        let parsedJson;
        if (params.jsonMode) {
          try { parsedJson = JSON.parse(text); } catch { /* not valid JSON */ }
        }

        return { success: true, content: text, parsedJson, model, provider: 'gemini' };
      } catch (err: any) {
        return { success: false, content: '', model, provider: 'gemini', error: err.message };
      }
    },

    async testConnection(): Promise<AITestResult> {
      const start = Date.now();
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const genModel = genAI.getGenerativeModel({ model });
        const result = await genModel.generateContent('Say "hello" in one word.');
        const text = result.response.text();
        return { success: !!text, latencyMs: Date.now() - start, model, provider: 'gemini' };
      } catch (err: any) {
        return { success: false, latencyMs: Date.now() - start, model, provider: 'gemini', error: err.message };
      }
    },
  };
}
