import { NextRequest, NextResponse } from 'next/server';
import { callGroqAI } from '@/lib/ai/groqClient';
import { checkUserCredits, deductUserCredits, logAIUsage } from '@/lib/ai/creditService';
import { AIFeatureKey, AI_CREDIT_COSTS } from '@/lib/ai/config';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';

import { JOB_SEARCH_SYSTEM_PROMPT, buildJobSearchPrompt } from '@/lib/ai/prompts/jobSearchPrompt';
import { JOB_RECOMMENDATION_SYSTEM_PROMPT, buildJobRecommendationPrompt } from '@/lib/ai/prompts/jobRecommendationPrompt';
import { CAREER_ASSISTANT_SYSTEM_PROMPT, buildCareerAssistantPrompt } from '@/lib/ai/prompts/careerAssistantPrompt';
import { RESUME_IMPROVEMENT_SYSTEM_PROMPT, FULL_RESUME_GEN_SYSTEM_PROMPT, buildResumeImprovementPrompt, buildFullResumeGenPrompt } from '@/lib/ai/prompts/resumePrompt';
import { COVER_LETTER_SYSTEM_PROMPT, buildCoverLetterPrompt } from '@/lib/ai/prompts/coverLetterPrompt';
import { INTERVIEW_PREP_SYSTEM_PROMPT, buildInterviewPrepPrompt, buildAnswerFeedbackPrompt } from '@/lib/ai/prompts/interviewPrompt';
import { COMPANY_CONTENT_SYSTEM_PROMPT, buildCompanyContentPrompt } from '@/lib/ai/prompts/companyPrompt';
import { JOB_DESCRIPTION_SYSTEM_PROMPT, buildJobDescriptionPrompt } from '@/lib/ai/prompts/jobDescriptionPrompt';
import { CANDIDATE_MATCHING_SYSTEM_PROMPT, buildCandidateMatchingPrompt } from '@/lib/ai/prompts/candidateMatchingPrompt';
import { CANDIDATE_SEARCH_SYSTEM_PROMPT, buildCandidateSearchPrompt } from '@/lib/ai/prompts/candidateSearchPrompt';
import { CHATBOT_SYSTEM_PROMPT, buildChatbotPrompt } from '@/lib/ai/prompts/chatbotPrompt';

// Server-side in-memory rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 15; // Max 15 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feature, userId, userRole = 'SEEKER', payload = {} } = body as {
      feature: AIFeatureKey;
      userId: string;
      userRole?: 'SEEKER' | 'COMPANY' | 'ADMIN' | 'GUEST';
      payload?: any;
    };

    if (!feature) {
      return NextResponse.json({ success: false, error: 'Feature specification required' }, { status: 400 });
    }

    // Rate Limiting
    const rateLimitId = userId || req.headers.get('x-forwarded-for') || 'anonymous';
    if (isRateLimited(rateLimitId)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a minute before making another request.' },
        { status: 429 }
      );
    }

    // Credit Check (Only enforce if userId provided)
    if (userId) {
      const creditStatus = await checkUserCredits(userId, feature);
      if (!creditStatus.allowed) {
        return NextResponse.json({
          success: false,
          error: creditStatus.message || 'Insufficient AI credits',
          requiredCredits: creditStatus.requiredCredits,
          currentBalance: creditStatus.currentBalance,
        }, { status: 402 });
      }
    }

    let systemPrompt = '';
    let userPrompt = '';
    let responseFormatJson = true;
    let customResponse: any = null;

    // Feature routing
    switch (feature) {
      case 'job_search': {
        systemPrompt = JOB_SEARCH_SYSTEM_PROMPT;
        userPrompt = buildJobSearchPrompt(payload.query || '');
        break;
      }

      case 'job_recommendation': {
        systemPrompt = JOB_RECOMMENDATION_SYSTEM_PROMPT;
        userPrompt = buildJobRecommendationPrompt(payload.candidateProfile || {}, payload.jobs || []);
        break;
      }

      case 'career_assistant': {
        systemPrompt = CAREER_ASSISTANT_SYSTEM_PROMPT;
        userPrompt = buildCareerAssistantPrompt(payload.question || '', payload.profile);
        responseFormatJson = false;
        break;
      }

      case 'profile_improvement':
      case 'resume_improvement': {
        systemPrompt = RESUME_IMPROVEMENT_SYSTEM_PROMPT;
        userPrompt = buildResumeImprovementPrompt(payload.resumeData || payload.profile || {});
        break;
      }

      case 'full_resume_generation': {
        systemPrompt = FULL_RESUME_GEN_SYSTEM_PROMPT;
        userPrompt = buildFullResumeGenPrompt(payload);
        break;
      }

      case 'cover_letter': {
        systemPrompt = COVER_LETTER_SYSTEM_PROMPT;
        userPrompt = buildCoverLetterPrompt(payload);
        break;
      }

      case 'interview_prep': {
        systemPrompt = INTERVIEW_PREP_SYSTEM_PROMPT;
        if (payload.userAnswer && payload.question) {
          userPrompt = buildAnswerFeedbackPrompt(payload.question, payload.userAnswer);
        } else {
          userPrompt = buildInterviewPrepPrompt(payload.role || 'General Role', payload.skills || []);
        }
        break;
      }

      case 'company_description':
      case 'service_product_description': {
        systemPrompt = COMPANY_CONTENT_SYSTEM_PROMPT;
        userPrompt = buildCompanyContentPrompt({
          companyName: payload.companyName || 'Company',
          category: payload.category || 'Business',
          district: payload.district || 'Theni',
          keyDetails: payload.keyDetails,
          contentType: feature === 'service_product_description' ? 'service_product_description' : 'company_description',
        });
        break;
      }

      case 'job_description': {
        systemPrompt = JOB_DESCRIPTION_SYSTEM_PROMPT;
        userPrompt = buildJobDescriptionPrompt(payload);
        break;
      }

      case 'candidate_matching':
      case 'candidate_ranking': {
        systemPrompt = CANDIDATE_MATCHING_SYSTEM_PROMPT;
        userPrompt = buildCandidateMatchingPrompt(payload.job || {}, payload.candidate || {});
        break;
      }

      case 'candidate_search': {
        systemPrompt = CANDIDATE_SEARCH_SYSTEM_PROMPT;
        userPrompt = buildCandidateSearchPrompt(payload.query || '');
        break;
      }

      case 'chatbot': {
        systemPrompt = CHATBOT_SYSTEM_PROMPT;
        userPrompt = buildChatbotPrompt(userRole, payload.message || '', payload.context);
        responseFormatJson = false;
        break;
      }

      default:
        return NextResponse.json({ success: false, error: 'Unsupported AI feature' }, { status: 400 });
    }

    // Execute Groq API Call
    const aiResponse = await callGroqAI({
      systemPrompt,
      userPrompt,
      responseFormatJson,
    });

    if (!aiResponse.success) {
      // Log failure (no credit deduction)
      if (userId) {
        await logAIUsage({
          userId,
          role: userRole,
          feature,
          creditsUsed: 0,
          provider: 'groq',
          model: aiResponse.model,
          success: false,
          errorCode: aiResponse.error,
        });
      }
      return NextResponse.json({ success: false, error: 'AI is temporarily unavailable. Please try again.' }, { status: 500 });
    }

    // Handle DB query integration for job_search or candidate_search
    if (feature === 'job_search' && aiResponse.parsedJson) {
      try {
        const intent = aiResponse.parsedJson;
        // Fetch REAL Firestore jobs filtered by status APPROVED/LIVE
        const jobsRef = collection(db, 'jobs');
        const q = query(jobsRef, where('status', 'in', ['APPROVED', 'LIVE', 'active']), firestoreLimit(20));
        const snapshot = await getDocs(q);
        const realJobs: any[] = [];
        snapshot.forEach(docSnap => {
          realJobs.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Filter locally based on parsed AI criteria
        const filteredJobs = realJobs.filter(j => {
          if (intent.district && j.district && !j.district.toLowerCase().includes(intent.district.toLowerCase())) {
            return false;
          }
          if (intent.category && j.category && !j.category.toLowerCase().includes(intent.category.toLowerCase())) {
            return false;
          }
          if (intent.minSalary && j.salary && (typeof j.salary === 'number' ? j.salary < intent.minSalary : false)) {
            return false;
          }
          return true;
        });

        customResponse = {
          intent: aiResponse.parsedJson,
          realJobs: filteredJobs.length > 0 ? filteredJobs : realJobs.slice(0, 5),
          totalFound: filteredJobs.length,
        };
      } catch (dbErr) {
        console.error('[AI Job Search Firestore Query Error]:', dbErr);
      }
    }

    // On Success: Deduct credits & Log usage
    const creditsUsed = AI_CREDIT_COSTS[feature] || 1;
    if (userId) {
      await deductUserCredits(userId, feature);
      await logAIUsage({
        userId,
        role: userRole,
        feature,
        creditsUsed,
        provider: 'groq',
        model: aiResponse.model,
        success: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: customResponse || aiResponse.parsedJson || aiResponse.content,
      rawContent: aiResponse.content,
      creditsDeducted: creditsUsed,
    });
  } catch (err: any) {
    console.error('[AI API Controller Error]:', err);
    return NextResponse.json({ success: false, error: 'AI is temporarily unavailable. Please try again.' }, { status: 500 });
  }
}
