import { NextRequest, NextResponse } from 'next/server';
import { createGeminiProvider } from '@/lib/ai/providers/geminiProvider';
import { createGroqProvider } from '@/lib/ai/providers/groqProvider';
import { createOpenAIProvider } from '@/lib/ai/providers/openaiProvider';

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, model } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Provider and API Key are required' },
        { status: 400 }
      );
    }

    let providerInstance: any = null;

    switch (provider) {
      case 'gemini':
        providerInstance = createGeminiProvider(apiKey, model || 'gemini-flash-latest');
        break;
      case 'groq':
        providerInstance = createGroqProvider(apiKey, model || 'llama-3.3-70b-versatile');
        break;
      case 'openai':
        providerInstance = createOpenAIProvider(apiKey, model || 'gpt-4o-mini');
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
    }

    const testResult = await providerInstance.testConnection();

    return NextResponse.json(testResult);
  } catch (err: any) {
    console.error('[AI Test API Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Connection test failed' },
      { status: 500 }
    );
  }
}
