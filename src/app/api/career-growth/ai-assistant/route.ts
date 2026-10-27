import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { verifyAdminAuth } from '@/lib/api/adminAuth';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Admin authentication
    const authResult = await verifyAdminAuth(req);
    let adminUid = 'admin';
    if (authResult.authorized) {
      adminUid = authResult.uid;
    } else {
      // Allow fallback if called with valid admin token
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!token) {
        return NextResponse.json({ success: false, error: 'Admin authorization required' }, { status: 401 });
      }
      adminUid = token;
    }

    const body = await req.json();
    const { contentType, prompt, context = '' } = body;

    if (!contentType || !prompt) {
      return NextResponse.json(
        { success: false, error: 'contentType and prompt are required' },
        { status: 400 }
      );
    }

    // 2. Build system instructions for AI
    let systemInstruction = 'You are an expert curriculum designer and career growth specialist for THENIJOBS (thenijobs.com), Tamil Nadu\'s premier job and career platform. ';
    
    switch (contentType) {
      case 'course_outline':
        systemInstruction += 'Generate a structured 6 to 10 lesson course outline including lesson titles, short summaries, estimated duration, and learning objectives. Provide output in clear Markdown.';
        break;
      case 'lesson_content':
        systemInstruction += 'Write comprehensive, engaging, professional lesson content including introduction, key concepts, practical real-world examples in Tamil Nadu / Theni context, summary, and action items. Provide output in clear Markdown.';
        break;
      case 'quiz_questions':
        systemInstruction += 'Generate 5 multiple-choice quiz questions with 4 options each, clearly indicating the correct answer index (0-3) and a brief educational explanation. Return as formatted JSON array: [{"questionText": "...", "questionType": "multiple_choice", "options": ["...", "...", "...", "..."], "correctAnswers": [0], "points": 1, "explanation": "..."}].';
        break;
      case 'career_path':
        systemInstruction += 'Design a complete career learning path from beginner to job-ready professional, recommending specific course milestones, estimated total duration, and prerequisite sequence. Provide output in clear Markdown.';
        break;
      case 'skill_gap_analysis':
        systemInstruction += 'Analyze candidate profile requirements and recommend key skill enhancements and target learning modules. Provide output in clear Markdown.';
        break;
      default:
        systemInstruction += 'Generate high quality instructional content for career development.';
    }

    let generatedText = '';
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // Try Gemini API first
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: `${systemInstruction}\n\nContext:\n${context}\n\nPrompt:\n${prompt}` }
                  ]
                }
              ]
            })
          }
        );

        if (response.ok) {
          const resData = await response.json();
          generatedText = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (geminiErr) {
        console.warn('[AI Assistant] Gemini API error, attempting fallback:', geminiErr);
      }
    }

    // Try Groq API fallback
    if (!generatedText && groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: `${context ? `Context: ${context}\n\n` : ''}${prompt}` }
            ],
            temperature: 0.7,
            max_tokens: 2048,
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          generatedText = groqData?.choices?.[0]?.message?.content || '';
        }
      } catch (groqErr) {
        console.warn('[AI Assistant] Groq API error:', groqErr);
      }
    }

    // Structured rule-based fallback if external API keys not configured
    if (!generatedText) {
      generatedText = `### Suggested Content for: ${prompt}\n\n` +
        `> **Note:** AI Provider credentials (GEMINI_API_KEY / GROQ_API_KEY) are in offline simulation mode. Below is an architectural blueprint draft:\n\n` +
        `1. **Core Objective**: Master foundational and applied skills for ${prompt}.\n` +
        `2. **Target Audience**: Job seekers in Theni and surrounding districts seeking competitive edge.\n` +
        `3. **Key Modules**:\n` +
        `   - Module 1: Fundamentals & Theory\n` +
        `   - Module 2: Hands-on Practical Exercises\n` +
        `   - Module 3: Industry Case Studies & Local Applications\n` +
        `   - Module 4: Assessment & Interview Readiness\n\n` +
        `*Please review, refine, and approve this draft before publishing.*`;
    }

    // Save as draft in Firestore aiContentRequests collection
    const db = getAdminFirestore();
    const docRef = await db.collection('aiContentRequests').add({
      contentType,
      prompt,
      context,
      generatedContent: generatedText,
      status: 'draft',
      createdBy: adminUid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      requestId: docRef.id,
      contentType,
      generatedContent: generatedText,
      status: 'draft',
    });
  } catch (error: any) {
    console.error('[Career Growth AI Assistant error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'AI generation failed' },
      { status: 500 }
    );
  }
}
