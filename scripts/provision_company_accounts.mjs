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

const COMPANIES = [
  {
    id: 'ik3pWBDVVUR3Sb51knwK',
    name: 'Agrimore',
    email: 'agrimorein@gmail.com',
    phone: '7094826586',
    password: 'Agrimore@Theni2026',
    taluk: 'Chinnamanur',
  },
  {
    id: 'oKDQpFZ3bx9C4S0Z0ti9',
    name: 'Apex Scholar Publication',
    email: 'apex.scholar.publication@gmail.com',
    phone: '9489154408',
    password: 'ApexPub@Theni2026',
    taluk: 'Theni',
  },
  {
    id: 'mWWNVrCGounWsmXdaRGL',
    name: 'Sarvesh Super Market',
    email: 'veeraselvam1103@gmail.com',
    phone: '9843913423',
    password: 'Sarvesh@Theni2026',
    taluk: 'Theni',
  },
  {
    id: 'u9sYSAG9YoGrept1FbSe',
    name: 'Suruliraj Chemicals',
    email: 'surliraj71@gmail.com',
    phone: '9940821092',
    password: 'Suruliraj@Theni2026',
    taluk: 'Theni',
  },
  {
    id: '7K95afmwXMddFJo8PeRB',
    name: 'M K Security Solutions & Electronics',
    email: 'mkcmr2025@gmail.com',
    phone: '9629625478',
    password: 'MKSecurity@Theni2026',
    taluk: 'Theni',
  },
  {
    id: 'SDv5CaYdxKRWOXl4ej84',
    name: 'Chennai Bakes',
    email: 'sirajudeeninonline@gmail.com',
    phone: '9943766344',
    password: 'ChennaiBakes@Theni2026',
    taluk: 'Uthamapalayam',
  },
  {
    id: 'VG1PwPzKXofu1fLxLIpk',
    name: 'SVR Heritage Hall',
    email: 'sasivishvajit@gmail.com',
    phone: '9591990514',
    password: 'SVRHeritage@Theni2026',
    taluk: 'Uthamapalayam',
  },
  {
    id: 'vMQgOwNd2fZ4Nm8870Dw',
    name: 'AGS IT Solutions',
    email: 'malai24x7@gmail.com',
    phone: '9750585060',
    password: 'AGSSolutions@Theni2026',
    taluk: 'Theni',
  },
];

async function main() {
  await syncClockSkew();
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');

  const envLocal = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
  const match = envLocal.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(\{.*?\})'/s);
  const serviceAccount = JSON.parse(match[1]);

  const app = initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore(app);
  const auth = getAuth(app);

  console.log(`Starting company accounts provisioning for ${COMPANIES.length} companies...`);

  for (const c of COMPANIES) {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(c.email);
      console.log(`Existing Auth user found for ${c.email}: UID=${userRecord.uid}`);
      // Update password and displayName
      await auth.updateUser(userRecord.uid, {
        password: c.password,
        displayName: c.name,
      });
      console.log(`Updated password for ${c.email}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: c.email,
          password: c.password,
          displayName: c.name,
          emailVerified: true,
        });
        console.log(`Created new Auth user for ${c.email}: UID=${userRecord.uid}`);
      } else {
        throw err;
      }
    }

    const uid = userRecord.uid;

    // 1. Create or update user doc in `users`
    await db.collection('users').doc(uid).set({
      uid,
      email: c.email,
      fullName: c.name,
      displayName: c.name,
      phone: c.phone,
      mobileNumber: c.phone,
      role: 'business_owner',
      companyId: c.id,
      companyName: c.name,
      approvalStatus: 'approved',
      accountStatus: 'active',
      subscriptionStatus: 'active',
      subscriptionPlan: 'standard',
      isEmployer: true,
      canPostJobs: true,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`Synced users doc for ${c.name} (${uid})`);

    // 2. Update company doc in `companies` with ownerId = uid
    await db.collection('companies').doc(c.id).set({
      ownerId: uid,
      verificationStatus: 'verified',
      isVerified: true,
      isActive: true,
      accountStatus: 'active',
      subscriptionStatus: 'active',
      subscriptionPlan: 'standard',
      accountEmail: c.email,
      contactPerson: c.name,
      phone: c.phone,
      email: c.email,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`Linked company ${c.id} ownerId to ${uid}`);

    // 3. Record in `companyAccounts` for admin inspection
    await db.collection('companyAccounts').doc(c.id).set({
      companyId: c.id,
      companyName: c.name,
      taluk: c.taluk,
      email: c.email,
      phone: c.phone,
      authUid: uid,
      role: 'business_owner',
      status: 'active',
      verificationStatus: 'verified',
      subscriptionPlan: 'standard',
      passwordUpdated: true,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`Created companyAccounts entry for ${c.name}`);
  }

  console.log('\nAll company accounts provisioned successfully!');
}

main().catch(console.error);
