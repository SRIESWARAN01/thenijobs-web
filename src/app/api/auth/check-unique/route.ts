import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { email, phone, excludeUid } = await request.json();

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone parameter is required' }, { status: 400 });
    }

    // 1. Check Email uniqueness
    if (email) {
      const emailQuery = await adminDb.collection('users')
        .where('email', '==', email.trim().toLowerCase())
        .get();

      for (const doc of emailQuery.docs) {
        if (!excludeUid || doc.id !== excludeUid) {
          return NextResponse.json({ unique: false, exists: 'email' });
        }
      }
    }

    // 2. Check Phone uniqueness
    if (phone) {
      // Normalize phone number to match +91XXXXXXXXXX format
      const cleanDigits = phone.replace(/\D/g, '').slice(-10);
      if (cleanDigits.length === 10) {
        const formattedPhone = `+91${cleanDigits}`;
        
        // Query phone field
        const phoneQuery = await adminDb.collection('users')
          .where('phone', '==', formattedPhone)
          .get();

        for (const doc of phoneQuery.docs) {
          if (!excludeUid || doc.id !== excludeUid) {
            return NextResponse.json({ unique: false, exists: 'phone' });
          }
        }

        // Query mobileNumber field
        const mobileQuery = await adminDb.collection('users')
          .where('mobileNumber', '==', formattedPhone)
          .get();

        for (const doc of mobileQuery.docs) {
          if (!excludeUid || doc.id !== excludeUid) {
            return NextResponse.json({ unique: false, exists: 'phone' });
          }
        }
      }
    }

    return NextResponse.json({ unique: true });
  } catch (err: any) {
    console.error('[Check Unique Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
