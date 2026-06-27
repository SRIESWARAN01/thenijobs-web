'use client';

import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';

export function useAnalytics() {
  const logCustomEvent = async (eventName: string, params?: Record<string, any>) => {
    try {
      const analyticsInstance = await analytics();
      if (analyticsInstance) {
        logEvent(analyticsInstance, eventName, params);
      }
    } catch (err) {
      console.warn(`[Analytics] Failed to log event ${eventName}:`, err);
    }
  };

  const logSignup = (userId: string, role: string) => {
    void logCustomEvent('signup_completed', { userId, role });
  };

  const logJobPosting = (jobId: string, companyId: string, title: string) => {
    void logCustomEvent('job_posting_submitted', { jobId, companyId, title });
  };

  const logJobApplication = (jobId: string, companyId: string, seekerId: string) => {
    void logCustomEvent('job_application_submitted', { jobId, companyId, seekerId });
  };

  const logSubscription = (userId: string, plan: string, amount: number) => {
    void logCustomEvent('subscription_purchased', { userId, plan, amount });
  };

  return {
    logCustomEvent,
    logSignup,
    logJobPosting,
    logJobApplication,
    logSubscription,
  };
}
