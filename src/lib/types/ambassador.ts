// ============================================================
// THENIJOBS — Village Ambassador & Referral System Types
// ============================================================

import type { SubscriptionPlanSlug } from './index';

export type AmbassadorStatus = 'active' | 'suspended' | 'pending';
export type PayoutStatus = 'pending' | 'completed' | 'rejected';
export type ReferralStatus = 'credited' | 'paid_out' | 'cancelled';

export interface Ambassador {
  uid: string;
  fullName: string;
  phone: string;
  email: string;
  upiId: string;
  district: string;
  taluk: string;
  referralCode: string;
  status: AmbassadorStatus;
  totalEarningsINR: number;
  pendingPayoutINR: number;
  paidPayoutINR: number;
  referredShopsCount: number;
  occupation?: string; // e.g. "College Student", "DTP Center Owner", "Freelancer"
  createdAt: any;
  updatedAt?: any;
}

export interface Referral {
  id: string;
  ambassadorUid: string;
  ambassadorCode: string;
  companyId: string;
  companyName: string;
  shopOwnerPhone?: string;
  subscribedPlan: SubscriptionPlanSlug;
  amountPaidINR: number;
  commissionAmountINR: number;
  paymentId?: string;
  status: ReferralStatus;
  createdAt: any;
}

export interface PayoutRequest {
  id: string;
  ambassadorUid: string;
  ambassadorName: string;
  phone: string;
  upiId: string;
  requestedAmountINR: number;
  status: PayoutStatus;
  utrNumber?: string;
  adminNote?: string;
  requestedAt: any;
  processedAt?: any;
}
