async function test() {
  const res = await fetch('https://www.google.com', { method: 'HEAD' });
  const serverTime = new Date(res.headers.get('date')).getTime();
  const skew = Date.now() - serverTime;
  console.log('Clock skew:', skew, 'ms');
  if (Math.abs(skew) > 60000) {
    const originalNow = Date.now;
    Date.now = () => originalNow() - skew;
    console.log('Compensated Date.now()');
  }

  const { getAdminFirestore } = await import('../src/lib/firebase/firebaseAdmin.ts');
  const db = getAdminFirestore();
  const snap = await db.collection('companies').limit(5).get();
  console.log('SUCCESS! Admin SDK retrieved companies count:', snap.size);
  snap.forEach(doc => {
    console.log('Company ID:', doc.id, 'Name:', doc.data().name || '(unnamed)');
  });
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
