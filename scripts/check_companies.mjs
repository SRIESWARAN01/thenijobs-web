import fs from 'fs';
import path from 'path';

async function syncClockSkew() {
  try {
    const res = await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-store' });
    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const serverTime = new Date(dateHeader).getTime();
      const skew = Date.now() - serverTime;
      if (Math.abs(skew) > 60_000) {
        const OriginalDate = Date;
        const originalNow = OriginalDate.now.bind(OriginalDate);
        Date.now = () => originalNow() - skew;
        function PatchedDate(...args) {
          if (!(this instanceof PatchedDate)) return new OriginalDate(Date.now()).toString();
          if (args.length === 0) return new OriginalDate(Date.now());
          return new OriginalDate(...args);
        }
        PatchedDate.prototype = OriginalDate.prototype;
        PatchedDate.now = () => originalNow() - skew;
        PatchedDate.UTC = OriginalDate.UTC;
        PatchedDate.parse = OriginalDate.parse;
        global.Date = PatchedDate;
      }
    }
  } catch (err) {}
}

async function main() {
  await syncClockSkew();
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const envLocal = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
  const match = envLocal.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(\{.*?\})'/s);
  const serviceAccount = JSON.parse(match[1]);
  const app = initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore(app);

  const uSnap = await db.collection('users').get();
  console.log(`Found ${uSnap.size} user docs in Firestore:`);
  for (const doc of uSnap.docs) {
    const d = doc.data();
    console.log(`ID: ${doc.id} | Email: ${d.email} | Role: ${d.role} | CompanyId: ${d.companyId} | Phone: ${d.phone}`);
  }
}

main().catch(console.error);
