// ============================================================
// THENIJOBS — Village Ambassador & Referral System Types
// ============================================================

import type { SubscriptionPlanSlug } from './index';

export type AmbassadorStatus = 'active' | 'suspended' | 'pending';
export type PayoutStatus = 'pending' | 'completed' | 'rejected';
export type ReferralStatus = 'pending_verification' | 'approved' | 'credited' | 'paid_out' | 'rejected' | 'cancelled';
export type PayoutMethod = 'bank_transfer' | 'upi';

export interface Ambassador {
  uid: string;
  fullName: string;
  phone: string;
  email: string;
  upiId: string;
  // Bank Account Details for direct NEFT/IMPS withdrawals
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  preferredPayoutMethod?: PayoutMethod;
  district: string;
  taluk: string;
  referralCode: string;
  status: AmbassadorStatus;
  totalEarningsINR: number;
  pendingPayoutINR: number; // Available withdrawable wallet balance
  pendingApprovalEarningsINR?: number; // Referrals awaiting admin verification
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
  referralCode?: string; // alias for ambassadorCode
  companyId: string;
  companyName: string;
  shopOwnerPhone?: string;
  subscribedPlan: SubscriptionPlanSlug;
  planSlug?: string; // alias
  amountPaidINR: number;
  subscriptionAmountINR?: number; // alias
  commissionAmountINR: number;
  paymentId?: string;
  status: ReferralStatus;
  adminVerifiedAt?: any;
  adminNote?: string;
  createdAt: any;
}

export interface PayoutRequest {
  id: string;
  ambassadorUid: string;
  ambassadorName: string;
  phone: string;
  payoutMethod: PayoutMethod;
  upiId?: string;
  // Bank details for withdrawal
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  // Aliases for bank properties
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  requestedAmountINR: number;
  status: PayoutStatus;
  utrNumber?: string;
  adminNote?: string;
  processingTimeline?: string; // e.g. 'within_8_hours'
  requestedAt: any;
  processedAt?: any;
}
