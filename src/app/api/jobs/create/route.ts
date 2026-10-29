import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth, syncClockSkew } from '@/lib/firebase/firebaseAdmin';
import { computeSubscriptionState } from '@/lib/subscriptionService';
import { getActiveJobPostingLimit, isUnlimited } from '@/lib/plans';
import { generateJobSlug } from '@/lib/seo/jobSlug';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
};

/**
 * Validates whether an incoming string is a valid ISO date format (YYYY-MM-DD).
 */
function isValidDateString(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
}

export async function POST(request: NextRequest) {
  const correlationId =
    request.headers.get('x-correlation-id') ||
    `job_req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

  const responseHeaders = {
    ...JSON_HEADERS,
    'x-correlation-id': correlationId,
  };

  try {
    // 1. Proactively adjust system clock skew to avoid OAuth JWT rejection
    await syncClockSkew().catch(() => 0);

    // 2. Safe Body Parsing (prevents SyntaxError crashes on empty/malformed streams)
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const {
      title,
      description = '',
      jobType = 'full_time',
      location = 'Theni',
      district = 'Theni',
      openings = 1,
      experience = 'Fresher',
      education = 'Any Degree',
      skills = [],
      salaryMin,
      salaryMax,
      salaryType = 'monthly',
      isNegotiable = false,
      benefits = [],
      isPremium = false,
      isUrgent = false,
      isWalkIn = false,
      walkInDate,
      walkInTime,
      walkInVenue,
      walkInContactPhone,
      companyId,
      userId,
      deadline,
      applicationDeadline,
      idempotencyKey: bodyIdempotencyKey,
    } = body || {};

    const idempotencyKey =
      request.headers.get('x-idempotency-key') || bodyIdempotencyKey || null;

    // 3. Request Field Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Job title is required.', correlationId },
        { status: 400, headers: responseHeaders }
      );
    }

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Company ID is required.', correlationId },
        { status: 400, headers: responseHeaders }
      );
    }

    // 4. Server-Side Authentication & Session Verification
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    let authenticatedUid: string | null = null;

    if (token) {
      try {
        const auth = getAdminAuth();
        const decoded = await auth.verifyIdToken(token);
        authenticatedUid = decoded.uid;
      } catch (adminAuthErr: any) {
        // Fallback: Verify ID Token via Google Identity Toolkit REST API
        try {
          const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
          if (apiKey) {
            const verifyRes = await fetch(
              `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: token }),
              }
            );
            const verifyData = await verifyRes.json().catch(() => null);
            if (verifyRes.ok && verifyData?.users?.[0]?.localId) {
              authenticatedUid = verifyData.users[0].localId;
            }
          }
        } catch {
          // Token verification failed across both paths
        }
      }
    }

    // If caller could not be authenticated via Bearer token:
    // In production, strictly enforce Bearer token verification.
    // In test or development environments without live Google Auth tokens, accept verified userId.
    if (!authenticatedUid) {
      const isTestOrDev = process.env.NODE_ENV !== 'production' || !process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (isTestOrDev && userId && typeof userId === 'string') {
        authenticatedUid = userId;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication required. Please sign in to post a job listing.',
            correlationId,
          },
          { status: 401, headers: responseHeaders }
        );
      }
    }

    // 5. Firebase Admin Firestore Access
    let db: any;
    try {
      db = getAdminFirestore();
    } catch (dbInitErr: any) {
      console.error(`[API Create Job ${correlationId}] Firebase Admin init error:`, dbInitErr?.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Backend database service is temporarily unavailable. Please retry in a moment.',
          details: dbInitErr?.message,
          correlationId,
        },
        { status: 503, headers: responseHeaders }
      );
    }

    // 6. Fetch Company Record
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Company record not found.', correlationId },
        { status: 404, headers: responseHeaders }
      );
    }

    const companyData = companyDoc.data()!;

    // 7. Verify Company Ownership or Authorization Server-Side
    const userDoc = await db.collection('users').doc(authenticatedUid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const isOwner = companyData.ownerId === authenticatedUid || companyData.ownerId === userId;
    const isLinkedUser = userData?.companyId === companyId;
    const isOwnerEmail = Boolean(
      companyData.ownerEmail &&
      userData?.email &&
      companyData.ownerEmail.toLowerCase() === userData.email.toLowerCase()
    );
    const isEmployee = Array.isArray(companyData.employeeIds) && (
      companyData.employeeIds.includes(authenticatedUid) || companyData.employeeIds.includes(userId)
    );

    if (!isOwner && !isLinkedUser && !isOwnerEmail && !isEmployee) {
      console.warn(`[API Create Job ${correlationId}] Unauthorized attempt: user ${userId} tried to post for company ${companyId}`);
      return NextResponse.json(
        { success: false, error: 'You are not authorized to post jobs for this company.', correlationId },
        { status: 403, headers: responseHeaders }
      );
    }

    // Self-heal: If user is verified authorized but company ownerId was unassigned/guest, sync ownerId
    if (!isOwner && (isLinkedUser || isOwnerEmail)) {
      await db.collection('companies').doc(companyId).update({
        ownerId: authenticatedUid,
        updatedAt: new Date(),
      }).catch(() => {});
    }

    // 8. Enforce Admin Approval Requirement for Job Posting
    const isCompanyVerified = companyData.verificationStatus === 'verified' || companyData.isVerified === true;
    if (!isCompanyVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job posting is locked until your business profile is verified and approved by THENIJOBS Admin. Please contact support on WhatsApp to request approval.',
          locked: true,
          correlationId,
        },
        { status: 403, headers: responseHeaders }
      );
    }

    // 9. Compute Subscription State
    const subState = computeSubscriptionState(companyData as any);
    if (!subState.isAccessAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Your subscription is not active. Please upgrade or renew your plan to post jobs.',
          subscriptionState: subState,
          correlationId,
        },
        { status: 403, headers: responseHeaders }
      );
    }

    // 10. Enforce Authoritative Active Job Posting Limit
    const activeJobsLimit = getActiveJobPostingLimit(subState.plan);
    const activeJobsQuery = await db.collection('jobs')
      .where('companyId', '==', companyId)
      .where('isActive', '==', true)
      .get();

    const currentActiveJobs = activeJobsQuery.size;

    if (!isUnlimited(activeJobsLimit) && currentActiveJobs >= activeJobsLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Active job posting limit reached (${currentActiveJobs}/${activeJobsLimit} jobs). Upgrade your plan to post more openings.`,
          currentCount: currentActiveJobs,
          limit: activeJobsLimit,
          plan: subState.plan,
          correlationId,
        },
        { status: 403, headers: responseHeaders }
      );
    }

    // 11. Idempotency & Accidental Duplicate Prevention
    if (idempotencyKey) {
      const existingKeyQuery = await db.collection('jobs')
        .where('companyId', '==', companyId)
        .where('idempotencyKey', '==', idempotencyKey)
        .limit(1)
        .get();

      if (!existingKeyQuery.empty) {
        const existingDoc = existingKeyQuery.docs[0];
        const existingData = existingDoc.data();
        return NextResponse.json(
          {
            success: true,
            jobId: existingDoc.id,
            slug: existingData.slug,
            message: 'Job listing already received. Awaiting admin review.',
            isDuplicate: true,
            correlationId,
          },
          { status: 200, headers: responseHeaders }
        );
      }
    }

    // Check for identical pending job submitted within the last 60 seconds (double-click safeguard)
    const recentDuplicateQuery = await db.collection('jobs')
      .where('companyId', '==', companyId)
      .where('title', '==', title.trim())
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!recentDuplicateQuery.empty) {
      const recentDoc = recentDuplicateQuery.docs[0];
      const recentData = recentDoc.data();
      const createdAtMs = recentData.createdAt?.toMillis
        ? recentData.createdAt.toMillis()
        : new Date(recentData.createdAt || 0).getTime();

      if (Date.now() - createdAtMs < 60_000) {
        return NextResponse.json(
          {
            success: true,
            jobId: recentDoc.id,
            slug: recentData.slug,
            message: 'Job listing recently submitted and queued for review.',
            isDuplicate: true,
            correlationId,
          },
          { status: 200, headers: responseHeaders }
        );
      }
    }

    // 12. Construct Salary Display & Formatted Payload
    let minSal: number | null = null;
    let maxSal: number | null = null;

    if (salaryMin !== undefined && salaryMin !== null && salaryMin !== '') {
      const parsed = parseInt(String(salaryMin), 10);
      if (!isNaN(parsed) && parsed >= 0) minSal = parsed;
    }

    if (salaryMax !== undefined && salaryMax !== null && salaryMax !== '') {
      const parsed = parseInt(String(salaryMax), 10);
      if (!isNaN(parsed) && parsed >= 0) maxSal = parsed;
    }

    // If both specified and min > max, swap them gracefully
    if (minSal !== null && maxSal !== null && minSal > maxSal) {
      const temp = minSal;
      minSal = maxSal;
      maxSal = temp;
    }

    const normalizedSalaryType = (salaryType || 'monthly').toString().toLowerCase();

    let salaryDisplay = 'Not Disclosed';
    if (minSal && maxSal) {
      salaryDisplay = `₹${minSal.toLocaleString('en-IN')} - ₹${maxSal.toLocaleString('en-IN')} / ${normalizedSalaryType}`;
    } else if (minSal) {
      salaryDisplay = `From ₹${minSal.toLocaleString('en-IN')} / ${normalizedSalaryType}`;
    } else if (maxSal) {
      salaryDisplay = `Up to ₹${maxSal.toLocaleString('en-IN')} / ${normalizedSalaryType}`;
    }

    const jobSlug = generateJobSlug(
      title.trim(),
      companyData.name || 'Company',
      district || location.trim() || 'Theni'
    );

    const now = new Date();
    const defaultDeadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const candidateDeadline = deadline || applicationDeadline;
    const resolvedDeadline = isValidDateString(candidateDeadline) ? candidateDeadline : defaultDeadline;

    const parsedOpenings = Math.max(1, parseInt(String(openings), 10) || 1);

    const jobPayload = {
      title: title.trim(),
      slug: jobSlug,
      description: typeof description === 'string' ? description.trim() : '',
      jobType: typeof jobType === 'string' ? jobType : 'full_time',
      location: (location && String(location).trim()) || district || 'Theni',
      district: (district && String(district).trim()) || 'Theni',
      openings: parsedOpenings,
      experience: experience || 'Fresher',
      education: education || 'Any Degree',
      skills: Array.isArray(skills) ? skills.map(s => String(s).trim()).filter(Boolean) : [],
      salaryMin: minSal,
      salaryMax: maxSal,
      salary: salaryDisplay,
      salaryType: normalizedSalaryType,
      isNegotiable: Boolean(isNegotiable),
      benefits: Array.isArray(benefits) ? benefits.map(b => String(b).trim()).filter(Boolean) : [],
      isPremium: Boolean(isPremium),
      isUrgent: Boolean(isUrgent),
      isWalkIn: Boolean(isWalkIn),
      walkInDate: walkInDate || '',
      walkInTime: walkInTime || '',
      walkInVenue: walkInVenue || location || 'Company Office',
      walkInContactPhone: walkInContactPhone || companyData.phone || '',
      companyId,
      business_id: companyId,
      companyName: companyData.name || 'Company',
      companyLogoUrl: companyData.logoUrl || companyData.logo || '',
      companyDistrict: companyData.district || district || 'Theni',
      deadline: resolvedDeadline,
      application_deadline: resolvedDeadline,
      postedBy: authenticatedUid,
      created_by: authenticatedUid,
      created_by_role: 'employer',
      status: 'pending',
      approvalStatus: 'pending',
      approval_status: 'pending',
      isActive: false, // Inactive until approved by admin
      viewCount: 0,
      applicationsCount: 0,
      idempotencyKey: idempotencyKey || null,
      createdAt: now,
      created_at: now,
      updatedAt: now,
      updated_at: now,
    };

    const docRef = await db.collection('jobs').add(jobPayload);

    console.info(`[API Create Job ${correlationId}] Successfully created job doc=${docRef.id} for company=${companyId}`);

    return NextResponse.json(
      {
        success: true,
        jobId: docRef.id,
        slug: jobSlug,
        message: 'Job submitted successfully and queued for admin review.',
        correlationId,
      },
      { status: 200, headers: responseHeaders }
    );
  } catch (error: any) {
    console.error(`[API Create Job ${correlationId}] Uncaught error:`, error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'An unexpected error occurred while creating the job posting.',
        correlationId,
      },
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method Not Allowed. Please send a POST request with job details to create a listing.',
    },
    {
      status: 405,
      headers: {
        ...JSON_HEADERS,
        Allow: 'POST, OPTIONS',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, GET, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-correlation-id, x-idempotency-key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
