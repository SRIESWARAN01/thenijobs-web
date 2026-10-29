import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, syncClockSkew } from '@/lib/firebase/firebaseAdmin';
import { verifyAdminAuth } from '@/lib/api/adminAuth';

export async function GET(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    await syncClockSkew();
    const db = getAdminFirestore();

    const snap = await db.collection('businessRecoveryRequests').orderBy('createdAt', 'desc').get();

    const requests = await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data();

        // Also fetch real company record for direct comparison
        let actualCompany: any = null;
        if (data.businessId) {
          const compSnap = await db.collection('companies').doc(data.businessId).get();
          if (compSnap.exists) {
            const cd = compSnap.data() || {};
            actualCompany = {
              id: compSnap.id,
              name: cd.name,
              phone: cd.phone || cd.whatsapp,
              email: cd.email || cd.contactEmail,
              taluk: cd.taluk || cd.district,
              ownerId: cd.ownerId,
            };
          }
        }

        return {
          id: doc.id,
          ...data,
          actualCompany,
        };
      })
    );

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    console.error('[Admin Business Recovery List] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business recovery requests.' },
      { status: 500 }
    );
  }
}
