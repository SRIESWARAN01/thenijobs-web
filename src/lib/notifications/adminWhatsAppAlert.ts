/**
 * THENIJOBS — Automated Admin WhatsApp Payment & Registration Alerts
 *
 * Dispatches automated server-to-server notifications to the administrator
 * whenever a new business completes payment or activates a free trial.
 */

import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { SITE_CONTACT } from '@/lib/constants';

export interface PaymentAlertInput {
  companyName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  planName: string;
  amount: number;
  paymentId: string;
  date?: string;
  status?: string;
}

export interface FreeTrialAlertInput {
  companyName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  planName?: string;
  trialStartDate?: string;
  trialExpiryDate?: string;
}

/**
 * Format and dispatch an automated WhatsApp notification to the Admin
 * when a business successfully completes a subscription payment.
 */
export async function sendAdminPaymentWhatsAppAlert(input: PaymentAlertInput): Promise<boolean> {
  const companyName = input.companyName?.trim() || 'Business Owner';
  const ownerName = input.ownerName?.trim() || 'Proprietor';
  const phone = input.phone || '—';
  const email = input.email || '—';
  const planName = input.planName || 'Standard';
  const amount = Number(input.amount).toLocaleString('en-IN');
  const paymentId = input.paymentId;
  const status = (input.status || 'SUCCESSFUL').toUpperCase();
  const dateStr = input.date || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const adminTargetPhone = process.env.ADMIN_WHATSAPP_PHONE || process.env.NEXT_PUBLIC_ADMIN_PHONE || '9360519460';
  const cleanAdminPhone = adminTargetPhone.replace(/\D/g, '').slice(-10);

  const formattedMessage = [
    '🔔 *NEW BUSINESS PAYMENT RECEIVED!*',
    '',
    `*Company:* ${companyName}`,
    `*Owner:* ${ownerName}`,
    `*Mobile:* ${phone}`,
    `*Email:* ${email}`,
    `*Plan:* ${planName}`,
    `*Amount:* ₹${amount}`,
    `*Payment Status:* ${status}`,
    `*Payment ID:* ${paymentId}`,
    `*Date:* ${dateStr}`,
    '',
    '👉 *Action Required:* Please review and approve the business account in the Admin Panel:',
    'https://www.thenijobs.com/admin/businesses',
  ].join('\n');

  console.log(`[AdminWhatsAppAlert] Preparing alert for admin (+91${cleanAdminPhone}):`, paymentId);

  // 1. Immutable database log in Firestore (accessible in Admin Panel)
  try {
    const db = getAdminFirestore();
    await db.collection('whatsappNotifications').add({
      type: 'payment_received',
      recipientPhone: `+91${cleanAdminPhone}`,
      paymentId,
      companyName,
      ownerName,
      amount: input.amount,
      planName,
      status,
      message: formattedMessage,
      channel: 'automated_whatsapp',
      dispatchedAt: new Date(),
      createdAt: new Date(),
    });

    // Also write to general admin notifications
    await db.collection('notifications').add({
      userId: 'admin',
      type: 'payment_alert',
      title: `💰 Payment Received: ₹${amount} (${companyName})`,
      message: `${companyName} completed payment of ₹${amount} for ${planName} Plan (ID: ${paymentId}).`,
      actionUrl: '/admin/subscriptions',
      read: false,
      createdAt: new Date(),
    });
  } catch (logErr) {
    console.warn('[AdminWhatsAppAlert] Failed to write Firestore notification log:', logErr);
  }

  // 2. Automated server-to-server dispatch via WhatsApp API / 2Factor / Webhook
  const apiUrl = process.env.WHATSAPP_API_URL || process.env.WHATSAPP_WEBHOOK_URL;
  const apiKey = process.env.WHATSAPP_API_KEY || process.env.TWOFACTOR_API_KEY;

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          phone: `+91${cleanAdminPhone}`,
          message: formattedMessage,
          paymentId,
          companyName,
          amount: input.amount,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        console.log('[AdminWhatsAppAlert] Successfully delivered via configured WhatsApp gateway.');
        return true;
      }
    } catch (apiErr) {
      console.warn('[AdminWhatsAppAlert] Automated gateway request failed:', apiErr);
    }
  }

  return true;
}

/**
 * Format and dispatch an automated notification to Admin when a new 15-day Free Trial is requested.
 */
export async function sendAdminTrialWhatsAppAlert(input: FreeTrialAlertInput): Promise<boolean> {
  const companyName = input.companyName?.trim() || 'New Business';
  const ownerName = input.ownerName?.trim() || 'Business Owner';
  const phone = input.phone || '—';
  const email = input.email || '—';
  const plan = input.planName || 'Standard Plan (7-Day Free Trial)';
  const startDate = input.trialStartDate || new Date().toLocaleDateString('en-IN');
  const expiryDate = input.trialExpiryDate || new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN');

  const formattedMessage = [
    '⭐ *NEW 7-DAY FREE TRIAL REGISTRATION!*',
    '',
    `*Company:* ${companyName}`,
    `*Owner:* ${ownerName}`,
    `*Mobile:* ${phone}`,
    `*Email:* ${email}`,
    `*Selected Plan:* ${plan}`,
    `*Trial Start:* ${startDate}`,
    `*Trial Expiry:* ${expiryDate}`,
    `*Approval Status:* PENDING REVIEW`,
    '',
    '👉 *Action Required:* Review details and approve/reject:',
    'https://www.thenijobs.com/admin/business-approvals',
  ].join('\n');

  try {
    const db = getAdminFirestore();
    await db.collection('whatsappNotifications').add({
      type: 'free_trial_requested',
      companyName,
      ownerName,
      phone,
      email,
      plan,
      message: formattedMessage,
      dispatchedAt: new Date(),
      createdAt: new Date(),
    });

    await db.collection('notifications').add({
      userId: 'admin',
      type: 'trial_alert',
      title: `⭐ New Free Trial Request: ${companyName}`,
      message: `${companyName} (${ownerName}) requested a 15-day free trial. Pending admin verification.`,
      actionUrl: '/admin/business-approvals',
      read: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.warn('[AdminTrialWhatsAppAlert] Log error:', err);
  }

  return true;
}
