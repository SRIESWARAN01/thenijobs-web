import fs from 'fs';
import path from 'path';
import { syncClockSkew, getAdminAuth, getAdminFirestore } from '../src/lib/firebase/firebaseAdmin.ts';

async function createBackup() {
  await syncClockSkew();
  const auth = getAdminAuth();
  const db = getAdminFirestore();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', `cleanup_backup_${timestamp}`);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`Starting automated backup to: ${backupDir}`);

  // 1. Auth Users
  let authUsers = [];
  let nextPageToken;
  do {
    const list = await auth.listUsers(1000, nextPageToken);
    authUsers = authUsers.concat(list.users.map(u => u.toJSON()));
    nextPageToken = list.pageToken;
  } while (nextPageToken);
  fs.writeFileSync(path.join(backupDir, 'firebase_auth_users.json'), JSON.stringify(authUsers, null, 2));
  console.log(`- Backed up ${authUsers.length} Firebase Auth users`);

  // 2. Firestore Users
  const usersSnap = await db.collection('users').get();
  const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  fs.writeFileSync(path.join(backupDir, 'firestore_users.json'), JSON.stringify(users, null, 2));
  console.log(`- Backed up ${users.length} Firestore users`);

  // 3. Companies
  const compSnap = await db.collection('companies').get();
  const companies = compSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  fs.writeFileSync(path.join(backupDir, 'companies.json'), JSON.stringify(companies, null, 2));
  console.log(`- Backed up ${companies.length} Firestore companies`);

  // 4. Subscriptions
  const subSnap = await db.collection('subscriptions').get();
  const subs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  fs.writeFileSync(path.join(backupDir, 'subscriptions.json'), JSON.stringify(subs, null, 2));
  console.log(`- Backed up ${subs.length} Firestore subscriptions`);

  // 5. Ambassadors / Balances
  const ambSnap = await db.collection('ambassadors').get();
  const amb = ambSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  fs.writeFileSync(path.join(backupDir, 'ambassadors.json'), JSON.stringify(amb, null, 2));
  console.log(`- Backed up ${amb.length} ambassador records`);

  console.log(`Backup completed successfully at: ${backupDir}`);
  return backupDir;
}

createBackup().catch(console.error);
