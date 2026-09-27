import { db } from '@/lib/firebase/config';
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import type { Company, User, AccountStatus, WebsiteStatus, PaymentStatus } from '@/lib/types';
import { SITE_CONTACT } from '@/lib/constants';

export interface SubscriptionState {
  isPendingApproval: boolean;
  isTrialActive: boolean;
  isPaidActive: boolean;
  isTrialExpired: boolean;
  isSuspended: boolean;
  trialDaysRemaining: number;
  trialHoursRemaining: number;
  plan: string;
  accountStatus: AccountStatus;
  websiteStatus: WebsiteStatus;
  paymentStatus: PaymentStatus;
  trialStartDate?: Date;
  trialEndDate?: Date;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  adminApprovedAt?: Date;
  approvedBy?: string;
}

/** Converts Firestore timestamp, Date, or string to native Date */
export function toJsDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (typeof val.seconds === 'number') return new Date(val.seconds * 1000);
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Computes the real-time subscription lifecycle state for a company.
 * Single source of truth for UI guards and backend validation.
 */
export function computeSubscriptionState(
  company?: Partial<Company> | null,
  user?: Partial<User> | null,
): SubscriptionState {
  const now = new Date();

  // If company not loaded or empty
  if (!company) {
    return {
      isPendingApproval: false,
      isTrialActive: false,
      isPaidActive: false,
      isTrialExpired: false,
      isSuspended: false,
      trialDaysRemaining: 0,
      trialHoursRemaining: 0,
      plan: 'free',
      accountStatus: 'pending_admin_approval',
      websiteStatus: 'pending_approval',
      paymentStatus: 'unpaid',
    };
  }

  const rawVerificationStatus = company.verificationStatus || 'pending';
  const rawAccountStatus = (company.accountStatus || user?.accountStatus || (rawVerificationStatus === 'pending' ? 'pending_admin_approval' : 'trial_active')) as AccountStatus;
  const rawWebsiteStatus = (company.websiteStatus || (rawAccountStatus === 'suspended' ? 'suspended' : 'active')) as WebsiteStatus;
  const rawPaymentStatus = (company.paymentStatus || user?.paymentStatus || 'unpaid') as PaymentStatus;
  const rawSubscriptionStatus = company.subscriptionStatus || user?.subscriptionStatus;

  const trialStartDate = toJsDate(company.trialStartDate || user?.trialStartDate);
  const trialEndDate = toJsDate(company.trialEndDate || user?.trialEndDate);
  const subStartDate = toJsDate(company.subscriptionStartDate);
  const subEndDate = toJsDate(company.subscriptionEndDate);
  const adminApprovedAt = toJsDate(company.adminApprovedAt || user?.adminApprovedAt);
  const approvedBy = company.approvedBy || user?.approvedBy;

  // 1. Pending Approval Check
  const isPendingApproval =
    rawAccountStatus === 'pending_admin_approval' ||
    rawVerificationStatus === 'pending' ||
    rawSubscriptionStatus === 'pending_admin_approval';

  // 2. Paid Subscription Check
  const isPaidActive =
    rawPaymentStatus === 'paid' &&
    (!subEndDate || subEndDate > now) &&
    rawSubscriptionStatus !== 'suspended';

  // 3. Trial calculations
  let trialDaysRemaining = 0;
  let trialHoursRemaining = 0;
  let isTrialActive = false;
  let isTrialExpired = false;

  if (isPendingApproval) {
    isTrialActive = false;
    isTrialExpired = false;
  } else if (isPaidActive) {
    isTrialActive = false;
    isTrialExpired = false;
  } else if (trialEndDate) {
    const diffMs = trialEndDate.getTime() - now.getTime();
    if (diffMs > 0) {
      isTrialActive = true;
      isTrialExpired = false;
      trialHoursRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
      trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      isTrialActive = false;
      isTrialExpired = true;
    }
  } else if (rawVerificationStatus === 'verified' && rawPaymentStatus !== 'paid') {
    // If verified without trialEndDate, default to trial expired
    isTrialExpired = true;
  }

  // 4. Suspension
  const isSuspended =
    rawAccountStatus === 'suspended' ||
    rawWebsiteStatus === 'suspended' ||
    (isTrialExpired && !isPaidActive) ||
    rawSubscriptionStatus === 'trial_expired' ||
    rawSubscriptionStatus === 'suspended';

  // Effective Plan: Trial gets Standard features only
  let plan = 'standard';
  if (isPaidActive) {
    plan = company.subscriptionPlan || 'standard';
  } else if (isTrialActive) {
    plan = 'standard'; // 15-day free trial is STANDARD plan only
  }

  // Resolved statuses
  let resolvedAccountStatus: AccountStatus = rawAccountStatus;
  let resolvedWebsiteStatus: WebsiteStatus = rawWebsiteStatus;

  if (isPendingApproval) {
    resolvedAccountStatus = 'pending_admin_approval';
    resolvedWebsiteStatus = 'pending_approval';
  } else if (isPaidActive) {
    resolvedAccountStatus = 'active';
    resolvedWebsiteStatus = 'active';
  } else if (isSuspended) {
    resolvedAccountStatus = 'suspended';
    resolvedWebsiteStatus = 'suspended';
  } else if (isTrialActive) {
    resolvedAccountStatus = 'trial_active';
    resolvedWebsiteStatus = 'active';
  }

  return {
    isPendingApproval,
    isTrialActive,
    isPaidActive,
    isTrialExpired,
    isSuspended,
    trialDaysRemaining,
    trialHoursRemaining,
    plan,
    accountStatus: resolvedAccountStatus,
    websiteStatus: resolvedWebsiteStatus,
    paymentStatus: rawPaymentStatus,
    trialStartDate: trialStartDate || undefined,
    trialEndDate: trialEndDate || undefined,
    subscriptionStartDate: subStartDate || undefined,
    subscriptionEndDate: subEndDate || undefined,
    adminApprovedAt: adminApprovedAt || undefined,
    approvedBy: approvedBy || undefined,
  };
}

/**
 * Reconciles trial expiration in Firestore if current date has passed trialEndDate
 * and paymentStatus != 'paid'.
 */
export async function reconcileCompanySubscription(
  companyId: string,
  companyData: any,
  ownerUid?: string,
): Promise<SubscriptionState> {
  const state = computeSubscriptionState(companyData);

  // If trial has expired and payment not made, transition in Firestore
  if (state.isTrialExpired && !state.isPaidActive && (companyData.subscriptionStatus !== 'trial_expired' || companyData.accountStatus !== 'suspended')) {
    try {
      const updates: Record<string, any> = {
        subscriptionStatus: 'trial_expired',
        accountStatus: 'suspended',
        websiteStatus: 'suspended',
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'companies', companyId), updates);

      const targetOwnerUid = ownerUid || companyData.ownerId;
      if (targetOwnerUid) {
        try {
          await updateDoc(doc(db, 'users', targetOwnerUid), {
            subscriptionStatus: 'trial_expired',
            accountStatus: 'suspended',
            updatedAt: serverTimestamp(),
          });

          // Create notification for expired trial
          await addDoc(collection(db, 'notifications'), {
            userId: targetOwnerUid,
            type: 'system',
            title: 'Free Trial Expired ⏳',
            message: 'Your THENIJOBS 15-day Standard free trial has ended. Please complete payment to reactivate your employer services and company website.',
            actionUrl: '/employer/billing',
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch (uErr) {
          console.warn('[reconcileCompanySubscription] user doc update skipped:', uErr);
        }
      }
    } catch (err) {
      console.error('[reconcileCompanySubscription] error updating Firestore:', err);
    }
  }

  return state;
}

/**
 * Admin action: Extend an employer's trial by N days.
 */
export async function extendCompanyTrial(
  companyId: string,
  additionalDays: number,
  adminId: string,
  reason: string = 'Admin trial extension',
) {
  const companySnap = await getDoc(doc(db, 'companies', companyId));
  if (!companySnap.exists()) throw new Error('Company not found');
  const company = companySnap.data();

  const now = new Date();
  const currentEnd = toJsDate(company.trialEndDate) || now;
  const baseDate = currentEnd > now ? currentEnd : now;
  const newEndDate = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

  const updates = {
    trialEndDate: newEndDate,
    subscriptionStatus: 'trial_active',
    accountStatus: 'trial_active',
    websiteStatus: 'active',
    trialExtendedDays: (company.trialExtendedDays || 0) + additionalDays,
    trialExtendedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, 'companies', companyId), updates);

  if (company.ownerId) {
    try {
      await updateDoc(doc(db, 'users', company.ownerId), {
        trialEndDate: newEndDate,
        subscriptionStatus: 'trial_active',
        accountStatus: 'trial_active',
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        userId: company.ownerId,
        type: 'system',
        title: 'Trial Extended! 🎉',
        message: `Your free trial has been extended by ${additionalDays} days. You now have access until ${newEndDate.toLocaleDateString('en-IN')}.`,
        actionUrl: '/employer/dashboard',
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch {}
  }

  // Audit log
  await addDoc(collection(db, 'activityLogs'), {
    userId: adminId,
    userName: 'Admin',
    action: 'Trial extended',
    target: company.name || companyId,
    targetId: companyId,
    details: `Extended by ${additionalDays} days. Reason: ${reason}. New End Date: ${newEndDate.toISOString()}`,
    timestamp: serverTimestamp(),
  });
}

/**
 * Admin action: Manually activate 1-Year Paid Subscription.
 */
export async function manualActivateSubscription(
  companyId: string,
  plan: 'standard' | 'premium' | 'enterprise',
  adminId: string,
  reason: string = 'Manual Admin Activation',
) {
  const companySnap = await getDoc(doc(db, 'companies', companyId));
  if (!companySnap.exists()) throw new Error('Company not found');
  const company = companySnap.data();

  const now = new Date();
  const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  await updateDoc(doc(db, 'companies', companyId), {
    subscriptionPlan: plan,
    subscriptionStatus: 'active',
    accountStatus: 'active',
    websiteStatus: 'active',
    paymentStatus: 'paid',
    subscriptionStartDate: now,
    subscriptionEndDate: endDate,
    updatedAt: serverTimestamp(),
  });

  if (company.ownerId) {
    try {
      await updateDoc(doc(db, 'users', company.ownerId), {
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        accountStatus: 'active',
        paymentStatus: 'paid',
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        userId: company.ownerId,
        type: 'system',
        title: 'Subscription Activated! 🌟',
        message: `Your 1-year ${plan.toUpperCase()} subscription has been activated by THENIJOBS administration.`,
        actionUrl: '/employer/dashboard',
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch {}
  }

  // Record in subscriptions collection
  await addDoc(collection(db, 'subscriptions'), {
    companyId,
    companyName: company.name || '',
    userId: company.ownerId || '',
    plan,
    status: 'active',
    paymentStatus: 'paid',
    amount: plan === 'enterprise' ? 5000 : plan === 'premium' ? 3500 : 1800,
    startDate: now,
    endDate,
    paymentMethod: 'ADMIN_MANUAL',
    autoRenew: false,
    adminApprovedAt: now,
    approvedBy: adminId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Audit log
  await addDoc(collection(db, 'activityLogs'), {
    userId: adminId,
    userName: 'Admin',
    action: 'Manual Subscription Activation',
    target: company.name || companyId,
    targetId: companyId,
    details: `Activated 1-year ${plan} subscription. Reason: ${reason}`,
    timestamp: serverTimestamp(),
  });
}

/**
 * Generates the WhatsApp Payment Reminder dynamic URL as specified in requirement 7.
 */
export function generateWhatsAppReminderUrl(
  company: { name?: string; phone?: string; whatsapp?: string; slug?: string; id?: string },
  paymentUrl?: string,
): string {
  const phone = (company.whatsapp || company.phone || '').replace(/[^0-9]/g, '');
  const companyName = company.name || 'Business Owner';
  const payLink =
    paymentUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/pricing?plan=standard`
      : 'https://thenijobs.com/pricing?plan=standard');

  const text = `Hello ${companyName},

Your THENIJOBS 15-day free trial has ended and we have not received your subscription payment.

Status: 🚫 Trial Expired — Upgrade Required

Your employer account and company website are currently suspended.

To continue using THENIJOBS services including:

• Company Website
• Job Posting
• Candidate Hiring
• Products & Services
• Business Profile
• Employer Dashboard

please choose and activate any paid plan (Basic ₹999/yr, Standard ₹1,800/yr, Premium ₹3,500/yr, or Enterprise ₹5,000/yr).

Payment Link: ${payLink}

Need help or want to pay via UPI / Bank transfer? Reply directly to this WhatsApp message or call +91 93605 19460.

After successful payment, your account and services can be reactivated immediately.

Thank you,
THENIJOBS Team`;

  return `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates the WhatsApp URL for an employer whose trial expired to contact the admin directly.
 */
export function generateAdminWhatsAppContactUrl(
  company?: { name?: string; phone?: string; email?: string; id?: string },
  requestedPlan?: string,
): string {
  const companyName = company?.name || 'My Company';
  const contactInfo = company?.phone || company?.email ? `\nRegistered Contact: ${company?.phone || company?.email}` : '';
  const planInfo = requestedPlan ? `\nSelected Plan: ${requestedPlan}` : '';

  const text = `Hello THENIJOBS Admin,

Business Name: "${companyName}"${contactInfo}
Status: 🚫 Trial Expired — Upgrade Required${planInfo}

My 15-day free trial has expired and my employer services are currently suspended.

I want to upgrade to a paid subscription plan. Please assist me with payment and instant account activation.

Admin WhatsApp Number: +91 93605 19460
Thank you!`;

  return `https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}

