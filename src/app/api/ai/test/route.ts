import { NextRequest, NextResponse } from 'next/server';
import { createGeminiProvider } from '@/lib/ai/providers/geminiProvider';
import { createGroqProvider } from '@/lib/ai/providers/groqProvider';
import { createOpenAIProvider } from '@/lib/ai/providers/openaiProvider';

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, model } = await req.json();

    // AI-1: this endpoint has no authentication, and it used to fall back to the SERVER's
    // GROQ_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY when the caller sent none. So anyone able
    // to POST here could spend the owner's provider quota, and use the response as an oracle
    // for whether those keys were live — without ever holding one.
    //
    // The only caller, the admin AI-settings page, returns early unless it has a key and
    // always sends it, so requiring one costs that page nothing. A caller must now bring their
    // own key, which makes this useless as a way to spend ours.
    //
    // This is NOT the whole fix. The endpoint still needs an admin check, which has to be
    // added alongside the admin page that calls it; that page is currently held by another
    // branch. Recorded in the ledger rather than half-done here.
    const resolvedApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';

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
