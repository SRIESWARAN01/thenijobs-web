import { NextRequest, NextResponse } from 'next/server';
import { getActiveProvider } from '@/lib/ai/aiConfigService';
import { callGroqAI } from '@/lib/ai/groqClient';

// In-memory rate limiting map for company enhancement
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // Max 10 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Authentication Token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to enhance company profile.' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token.' },
        { status: 401 }
      );
    }

    // 2. Parse and Validate Request Body
    const body = await req.json();
    const {
      companyName,
      category = 'Business',
      subcategory = '',
      district = 'Theni District',
      location = '',
      phone = '',
      email = '',
      website = '',
      shortDescription = '',
      language = 'en',
    } = body;

    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company Name is required for AI enhancement.' },
        { status: 400 }
      );
    }

    // Rate Limiting (Identifier based on IP or Token snippet)
    const rateLimitId = token.slice(-16) || req.headers.get('x-forwarded-for') || 'anon';
    if (isRateLimited(rateLimitId)) {
      return NextResponse.json(
        { success: false, error: 'Too many AI enhancement requests. Please wait a minute before retrying.' },
        { status: 429 }
      );
    }

    const isTamil = language === 'ta';

    // 3. Construct System Prompt with Strict Anti-Fabrication Invariants
    const systemPrompt = `You are a Senior Business Branding & Profile Consultant for THENIJOBS (District-Level Employment & Business Platform in Theni District, Tamil Nadu).

CRITICAL DATA ACCURACY RULES (ZERO FABRICATION POLICY):
1. You MUST NOT invent, hallucinate, or fabricate:
   - GST numbers or government registration numbers.
   - Physical street addresses, phone numbers, email addresses, or websites that were not supplied.
   - Company founding years or founding dates.
   - Employee counts, annual turnover, or financial figures.
   - Awards, official certifications, or legal accreditations.
   - Verification status (NEVER claim the company is "GST Verified", "Govt Approved", or "Admin Verified").
2. If any factual record is not supplied by the user, leave it blank or mark it as "Needs Verification".
3. Your primary objective:
   - Rewrite and expand the user's brief notes into an articulate, professional, and trustworthy company profile overview.
   - Craft a compelling, memorable business tagline.
   - Provide a welcoming 1-2 sentence company introduction.
   - Suggest relevant business categories and discovery keywords.
   - Recommend 3 structured profile sections tailored to their industry.
   - Provide 3 authentic marketing highlights based ONLY on their supplied sector and information.
4. Language Requirement:
   ${isTamil 
     ? 'Output ALL textual content in grammatically accurate, professional Tamil (தமிழ் மொழி). Ensure high-standard Tamil vocabulary suitable for an enterprise profile.' 
     : 'Output ALL content in clear, engaging, professional English.'}

You MUST return a valid JSON object matching this exact schema:
{
  "tagline": "string (punchy 5-10 word business tagline)",
  "shortIntro": "string (1-2 sentence executive introduction)",
  "enhancedDescription": "string (detailed 2-3 paragraph professional company overview)",
  "suggestedCategories": ["string", "string", "string"],
  "suggestedKeywords": ["string", "string", "string", "string"],
  "suggestedSections": [
    { "title": "string", "content": "string" },
    { "title": "string", "content": "string" },
    { "title": "string", "content": "string" }
  ],
  "marketingHighlights": ["string", "string", "string"],
  "disclaimer": "AI-generated content requires user confirmation and platform Admin Approval before publication."
}`;

    const userPrompt = `Please enhance the company profile for:
Company Name: ${companyName.trim()}
Business Category: ${category || 'General Business'}
Subcategory: ${subcategory || 'Not specified'}
Location / Town: ${location || 'Theni District'}
District: ${district}
Known Contact / Phone: ${phone ? phone : 'Unspecified'}
Known Email: ${email ? email : 'Unspecified'}
Website: ${website ? website : 'Unspecified'}
User Provided Notes / Short Description:
"""
${shortDescription.trim() || 'A business operating in ' + (location || 'Theni District') + ' providing quality products and services to local customers.'}
"""

Language: ${isTamil ? 'Tamil (தமிழ்)' : 'English'}
Remember the Zero Fabrication Policy: Do not invent fake GST numbers, years, awards, or verified claims.`;

    // 4. Execute AI via Active Provider (Gemini / Groq Fallback)
    const { provider } = await getActiveProvider();
    let aiResponse: any = null;

    if (provider) {
      aiResponse = await provider.complete({
        systemPrompt,
        userPrompt,
        jsonMode: true,
        maxTokens: 2048,
        temperature: 0.6,
      });
    } else {
      aiResponse = await callGroqAI({
        systemPrompt,
        userPrompt,
        responseFormatJson: true,
      });
    }

    if (!aiResponse || !aiResponse.success || !aiResponse.content) {
      return NextResponse.json(
        {
          success: false,
          error: aiResponse?.error || 'AI enhancement service is temporarily unavailable. Please try again.',
        },
        { status: 502 }
      );
    }

    // 5. Parse and Validate JSON Schema
    let parsedData = aiResponse.parsedJson;
    if (!parsedData && typeof aiResponse.content === 'string') {
      try {
        const cleaned = aiResponse.content
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        parsedData = JSON.parse(cleaned);
      } catch (e) {
        console.error('[Company Auto-Enhance] JSON parse error:', e);
      }
    }

    if (!parsedData || !parsedData.enhancedDescription) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI response did not match the expected profile schema. Please retry.',
        },
        { status: 502 }
      );
    }

    // 6. Clean and Guarantee Data Integrity
    const sanitizedData = {
      tagline: typeof parsedData.tagline === 'string' ? parsedData.tagline.trim() : '',
      shortIntro: typeof parsedData.shortIntro === 'string' ? parsedData.shortIntro.trim() : '',
      enhancedDescription: typeof parsedData.enhancedDescription === 'string' ? parsedData.enhancedDescription.trim() : '',
      suggestedCategories: Array.isArray(parsedData.suggestedCategories) ? parsedData.suggestedCategories.slice(0, 5) : [],
      suggestedKeywords: Array.isArray(parsedData.suggestedKeywords) ? parsedData.suggestedKeywords.slice(0, 8) : [],
      suggestedSections: Array.isArray(parsedData.suggestedSections)
        ? parsedData.suggestedSections.map((sec: any) => ({
            title: String(sec.title || 'Section').slice(0, 60),
            content: String(sec.content || '').slice(0, 500),
          })).slice(0, 4)
        : [],
      marketingHighlights: Array.isArray(parsedData.marketingHighlights)
        ? parsedData.marketingHighlights.map((h: any) => String(h).slice(0, 100)).slice(0, 4)
        : [],
      language: isTamil ? 'ta' : 'en',
      disclaimer: 'AI-generated content is unverified and pending Admin Approval before publication.',
      provider: aiResponse.provider || 'gemini',
      model: aiResponse.model || 'gemini-flash-latest',
    };

    return NextResponse.json({
      success: true,
      data: sanitizedData,
    });
  } catch (error: any) {
    console.error('[Company Auto-Enhance API Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error while processing AI enhancement.',
      },
      { status: 500 }
    );
  }
}
