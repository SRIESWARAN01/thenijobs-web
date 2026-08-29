import { NextRequest, NextResponse } from 'next/server';
import { createGeminiProvider } from '@/lib/ai/providers/geminiProvider';
import { createGroqProvider } from '@/lib/ai/providers/groqProvider';
import { createOpenAIProvider } from '@/lib/ai/providers/openaiProvider';

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, model } = await req.json();

    const resolvedApiKey = apiKey || (
      provider === 'groq' ? process.env.GROQ_API_KEY :
      provider === 'gemini' ? (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) :
      provider === 'openai' ? process.env.OPENAI_API_KEY : undefined
    );

    if (!provider || !resolvedApiKey) {
      return NextResponse.json(
        { success: false, error: 'Provider and API Key are required' },
        { status: 400 }
      );
    }

    let providerInstance: any = null;

    switch (provider) {
      case 'gemini':
        providerInstance = createGeminiProvider(resolvedApiKey, model || 'gemini-flash-latest');
        break;
      case 'groq':
        providerInstance = createGroqProvider(resolvedApiKey, model || 'llama-3.3-70b-versatile');
        break;
      case 'openai':
        providerInstance = createOpenAIProvider(resolvedApiKey, model || 'gpt-4o-mini');
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
