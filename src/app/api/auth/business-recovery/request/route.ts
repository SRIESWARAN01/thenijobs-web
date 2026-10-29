import { NextRequest, NextResponse } from 'next/server';
import { createBusinessRecoveryRequest } from '@/lib/business/businessAuthService';

// Server-side rate limiter for recovery requests: max 5 per IP per 15 minutes
const recoveryRateLimits = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = recoveryRateLimits.get(ip);
  if (!entry || now > entry.resetTime) {
    recoveryRateLimits.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_REQUESTS;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-ip';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many recovery requests from this network. Please wait a few minutes before trying again.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { businessId, registeredMobile, requesterMobile, registeredEmail } = body;

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please select an eligible business name.' },
        { status: 400 }
      );
    }

    if (!registeredMobile || typeof registeredMobile !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide the registered business mobile number.' },
        { status: 400 }
      );
    }

    if (!requesterMobile || typeof requesterMobile !== 'string') {
      return NextResponse.json(
        { success: false, error: "Please provide the requester's contact mobile number." },
        { status: 400 }
      );
    }

    const result = await createBusinessRecoveryRequest({
      businessId,
      registeredMobile,
      requesterMobile,
      registeredEmail: registeredEmail || null,
      ipAddress: ip,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Business Recovery Request] Server error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to submit recovery request right now. Please try again in a few moments.',
      },
      { status: 500 }
    );
  }
}
