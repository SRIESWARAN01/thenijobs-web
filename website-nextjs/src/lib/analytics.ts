import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, increment, doc, updateDoc } from 'firebase/firestore';

export type AnalyticsEventType =
  | 'visit'            // Website Visit
  | 'product_view'     // Product View
  | 'service_view'     // Service View
  | 'whatsapp_click'   // WhatsApp Click
  | 'call_click'       // Phone Call / Call Button Click
  | 'contact_submit'   // Contact Form Submission
  | 'review_submit';   // Review Submission

export interface AnalyticsEventInput {
  companyId: string;
  eventType: AnalyticsEventType;
  userId?: string | null;
  targetId?: string | null;   // e.g. productId or serviceId
  targetName?: string | null; // e.g. productName or serviceName
}

export async function trackAnalyticsEvent(event: AnalyticsEventInput) {
  try {
    if (!event.companyId) return;

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // "YYYY-MM-DD"
    
    // 1. Log event details to analyticsEvents collection
    await addDoc(collection(db, 'analyticsEvents'), {
      companyId: event.companyId,
      eventType: event.eventType,
      userId: event.userId || null,
      targetId: event.targetId || null,
      targetName: event.targetName || null,
      timestamp: serverTimestamp(),
      dateStr,
    });

    // 2. Increment counters in companies document
    const companyRef = doc(db, 'companies', event.companyId);
    const updateData: any = {};

    if (event.eventType === 'visit') {
      updateData.visitCount = increment(1);
    } else if (event.eventType === 'whatsapp_click') {
      updateData.whatsappClickCount = increment(1);
    } else if (event.eventType === 'call_click') {
      updateData.callClickCount = increment(1);
    } else if (event.eventType === 'contact_submit') {
      updateData.contactSubmitCount = increment(1);
    } else if (event.eventType === 'review_submit') {
      updateData.reviewSubmitCount = increment(1);
    }

    if (Object.keys(updateData).length > 0) {
      await updateDoc(companyRef, updateData).catch(err => {
        console.warn('[Analytics] Failed to update company counters:', err);
      });
    }

    // 3. Increment counters on target (product/service) document
    if (event.targetId) {
      if (event.eventType === 'product_view') {
        const productRef = doc(db, 'products', event.targetId);
        await updateDoc(productRef, {
          viewCount: increment(1)
        }).catch(() => {});
      } else if (event.eventType === 'whatsapp_click') {
        const productRef = doc(db, 'products', event.targetId);
        await updateDoc(productRef, {
          clickCount: increment(1)
        }).catch(() => {});
      }
    }

  } catch (err) {
    console.error('[Analytics] Event tracking error:', err);
  }
}
