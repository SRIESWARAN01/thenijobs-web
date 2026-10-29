import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth, syncClockSkew } from '@/lib/firebase/firebaseAdmin';
import { ELIGIBLE_BUSINESS_IDS, ELIGIBLE_BUSINESS_NAMES_WITH_TALUKS } from '@/lib/business/businessAuthService';
import { generateJobSlug } from '@/lib/seo/jobSlug';

export async function POST(req: NextRequest) {
  try {
    await syncClockSkew();
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing token' }, { status: 401 });
    }

    const auth = getAdminAuth();
    let decoded;
    try {
      decoded = await auth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Unauthorized: invalid token' }, { status: 401 });
    }

    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const role = userDoc.data()?.role;

    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      companyId,
      title,
      category,
      openings,
      description,
      qualifications,
      experience,
      salaryMin,
      salaryMax,
      salaryType = 'monthly',
      location,
      district = 'Theni',
      jobType = 'full_time',
      workingHours,
      benefits = [],
      deadline,
      applicationMethod = 'whatsapp',
      contactPerson,
      phone,
      whatsapp,
      email,
      additionalInstructions,
      action = 'publish', // 'draft' | 'pending' | 'publish'
    } = body;

    // 1. Validation
    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json({ success: false, error: 'Please select a company.' }, { status: 400 });
    }

    const isEligibleBusiness = (ELIGIBLE_BUSINESS_IDS as readonly string[]).includes(companyId);
    if (!isEligibleBusiness) {
      return NextResponse.json({
        success: false,
        error: 'Job posting is currently restricted to the 8 registered partner businesses.',
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Job title is required.' }, { status: 400 });
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json({ success: false, error: 'Job category is required.' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ success: false, error: 'Job description is required.' }, { status: 400 });
    }

    // 2. Fetch company document
    const compDoc = await db.collection('companies').doc(companyId).get();
    if (!compDoc.exists) {
      return NextResponse.json({ success: false, error: 'Selected company does not exist.' }, { status: 404 });
    }

    const compData = compDoc.data() || {};
    const companyName = compData.name || ELIGIBLE_BUSINESS_NAMES_WITH_TALUKS[companyId] || 'Partner Business';
    const companyLogoUrl = compData.logoUrl || compData.logo || '';
    const companySlug = compData.slug || '';
    const now = new Date();

    // 3. Resolve status based on requested action
    let status: 'draft' | 'pending' | 'active' = 'active';
    let approvalStatus: 'draft' | 'pending' | 'approved' = 'approved';
    let isActive = true;

    if (action === 'draft') {
      status = 'draft';
      approvalStatus = 'draft';
      isActive = false;
    } else if (action === 'pending') {
      status = 'pending';
      approvalStatus = 'pending';
      isActive = false;
    } else {
      status = 'active';
      approvalStatus = 'approved';
      isActive = true;
    }

    // 4. Generate SEO Slug
    const cleanLocation = location || compData.taluk || compData.district || 'Theni';
    const slug = generateJobSlug(title.trim(), companyName, cleanLocation);

    // Format salary display
    const numMin = Number(salaryMin) || 0;
    const numMax = Number(salaryMax) || 0;
    let salaryDisplay = 'Negotiable';
    if (numMin > 0 && numMax > 0) {
      salaryDisplay = `₹${numMin.toLocaleString('en-IN')} – ₹${numMax.toLocaleString('en-IN')} / ${salaryType}`;
    } else if (numMin > 0) {
      salaryDisplay = `₹${numMin.toLocaleString('en-IN')}+ / ${salaryType}`;
    } else if (salaryType === 'negotiable') {
      salaryDisplay = 'Salary Negotiable';
    }

    const jobPayload: Record<string, any> = {
      // Company identifiers
      companyId,
      business_id: companyId,
      companyName,
      companySlug,
      companyLogoUrl,

      // Job particulars
      title: title.trim(),
      slug,
      category: category.trim(),
      openings: Number(openings) || 1,
      description: description.trim(),
      qualifications: Array.isArray(qualifications) ? qualifications : (qualifications ? [qualifications] : []),
      requirements: Array.isArray(qualifications) ? qualifications : (qualifications ? [qualifications] : []),
      skills: Array.isArray(qualifications) ? qualifications : [],
      experience: experience || 'Fresher (0 yrs)',
      education: Array.isArray(qualifications) ? qualifications.join(', ') : (qualifications || 'Any Degree'),

      // Compensation & Location
      salaryMin: numMin,
      salaryMax: numMax,
      salary: salaryDisplay,
      salaryType,
      location: cleanLocation,
      district: district || 'Theni',
      state: 'Tamil Nadu',
      jobType: jobType || 'full_time',
      workingHours: workingHours || 'Day Shift (9:00 AM – 6:00 PM)',
      benefits: Array.isArray(benefits) ? benefits : [],

      // Application info
      deadline: deadline || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      application_deadline: deadline || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      applicationMethod: applicationMethod || 'whatsapp',
      contactPerson: contactPerson || compData.contactPerson || companyName,
      phone: phone || compData.phone || '',
      whatsapp: whatsapp || compData.whatsapp || compData.phone || '',
      email: email || compData.email || '',
      additionalInstructions: additionalInstructions || '',

      // Moderation & Status
      status,
      approvalStatus,
      approval_status: approvalStatus,
      isActive,
      isFeatured: false,
      isPremium: false,
      isUrgent: false,
      viewCount: 0,
      applicationsCount: 0,

      // Workflow & Audit metadata
      postedBy: decoded.uid,
      created_by: decoded.uid,
      created_by_role: 'admin',
      created_by_admin_email: decoded.email || '',
      approvedBy: status === 'active' ? decoded.uid : null,
      approved_by: status === 'active' ? decoded.uid : null,
      approvedAt: status === 'active' ? now : null,
      approved_at: status === 'active' ? now : null,
      publishedAt: status === 'active' ? now : null,
      published_at: status === 'active' ? now : null,
      createdAt: now,
      created_at: now,
      updatedAt: now,
      updated_at: now,
    };

    const docRef = await db.collection('jobs').add(jobPayload);
    const jobId = docRef.id;

    // Send notification to company owner if exists
    const ownerId = compData.ownerId || compData.userId;
    if (ownerId) {
      try {
        await db.collection('notifications').add({
          userId: ownerId,
          type: 'job_alert',
          title: status === 'active' ? 'New Job Published by Admin! 🚀' : 'New Job Created by Admin',
          message: status === 'active'
            ? `Admin has published "${title}" for ${companyName}. Candidates can now view and apply directly.`
            : `Admin has created "${title}" (${status}) for ${companyName}.`,
          jobId,
          companyId,
          createdAt: now,
          read: false,
        });
      } catch (notifErr) {
        console.warn('[Admin Create Job] Notification note:', notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      jobId,
      slug,
      status,
      publicUrl: `https://www.thenijobs.com/jobs/${slug}`,
      message: status === 'active'
        ? `Job "${title}" published successfully for ${companyName}!`
        : `Job "${title}" saved as ${status} for ${companyName}.`,
    });
  } catch (err: any) {
    console.error('[Admin Create Job API] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
