import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { computeSubscriptionState } from '@/lib/subscriptionService';
import { getActiveJobPostingLimit, isUnlimited } from '@/lib/plans';
import { generateJobSlug } from '@/lib/seo/jobSlug';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      jobType = 'full_time',
      location = 'Theni',
      district = 'Theni',
      openings = 1,
      experience = 'Fresher',
      education = 'Any Degree',
      skills = [],
      salaryMin,
      salaryMax,
      salaryType = 'month',
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
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Job title is required.' }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Company ID is required.' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 401 });
    }

    const db = getAdminFirestore();

    // 1. Fetch Company Record
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ success: false, error: 'Company record not found.' }, { status: 404 });
    }

    const companyData = companyDoc.data()!;

    // 2. Verify Company Ownership
    if (companyData.ownerId !== userId) {
      return NextResponse.json({ success: false, error: 'You are not authorized to post jobs for this company.' }, { status: 403 });
    }

    // 3. Compute Subscription State
    const subState = computeSubscriptionState(companyData as any);
    if (!subState.isAccessAllowed) {
      return NextResponse.json({
        success: false,
        error: 'Your subscription is not active. Please upgrade or renew your plan to post jobs.',
        subscriptionState: subState,
      }, { status: 403 });
    }

    // 4. Enforce Authoritative Active Job Posting Limit
    const activeJobsLimit = getActiveJobPostingLimit(subState.plan);
    const activeJobsQuery = await db.collection('jobs')
      .where('companyId', '==', companyId)
      .where('isActive', '==', true)
      .get();

    const currentActiveJobs = activeJobsQuery.size;

    if (!isUnlimited(activeJobsLimit) && currentActiveJobs >= activeJobsLimit) {
      return NextResponse.json({
        success: false,
        error: `Active job posting limit reached (${currentActiveJobs}/${activeJobsLimit} jobs). Upgrade your plan to post more openings.`,
        currentCount: currentActiveJobs,
        limit: activeJobsLimit,
        plan: subState.plan,
      }, { status: 403 });
    }

    // 5. Construct Job Payload
    const minSal = salaryMin ? parseInt(salaryMin) : null;
    const maxSal = salaryMax ? parseInt(salaryMax) : null;

    let salaryDisplay = 'Not Disclosed';
    if (minSal && maxSal) {
      salaryDisplay = `₹${minSal.toLocaleString('en-IN')} - ₹${maxSal.toLocaleString('en-IN')} / ${salaryType}`;
    } else if (minSal) {
      salaryDisplay = `From ₹${minSal.toLocaleString('en-IN')} / ${salaryType}`;
    } else if (maxSal) {
      salaryDisplay = `Up to ₹${maxSal.toLocaleString('en-IN')} / ${salaryType}`;
    }

    const jobSlug = generateJobSlug(
      title.trim(),
      companyData.name || 'Company',
      district || location.trim() || 'Theni'
    );

    const now = new Date();
    const jobPayload = {
      title: title.trim(),
      slug: jobSlug,
      description: description ? description.trim() : '',
      jobType,
      location: location.trim() || district || 'Theni',
      district: district || 'Theni',
      openings: parseInt(openings) || 1,
      experience: experience || 'Fresher',
      education: education || 'Any Degree',
      skills: Array.isArray(skills) ? skills : [],
      salaryMin: minSal,
      salaryMax: maxSal,
      salary: salaryDisplay,
      salaryType,
      isNegotiable: !!isNegotiable,
      benefits: Array.isArray(benefits) ? benefits : [],
      isPremium: !!isPremium,
      isUrgent: !!isUrgent,
      isWalkIn: !!isWalkIn,
      walkInDate: walkInDate || '',
      walkInTime: walkInTime || '',
      walkInVenue: walkInVenue || location || 'Company Office',
      walkInContactPhone: walkInContactPhone || companyData.phone || '',
      companyId,
      companyName: companyData.name || 'Company',
      companyLogoUrl: companyData.logoUrl || '',
      companyDistrict: companyData.district || district || 'Theni',
      postedBy: userId,
      status: 'pending',
      approvalStatus: 'pending',
      isActive: false, // Inactive until approved by admin
      viewCount: 0,
      applicationsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('jobs').add(jobPayload);

    return NextResponse.json({
      success: true,
      jobId: docRef.id,
      slug: jobSlug,
      message: 'Job submitted successfully and queued for admin review.',
    });
  } catch (error: any) {
    console.error('[API Create Job Error]:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred while creating the job posting.',
    }, { status: 500 });
  }
}
