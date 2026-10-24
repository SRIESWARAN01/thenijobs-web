import fs from 'node:fs';
import path from 'node:path';

const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
const token = JSON.parse(fs.readFileSync(configPath, 'utf8')).tokens.access_token;
const ids = [
  'ik3pWBDVVUR3Sb51knwK', // Agrimore
  'mWWNVrCGounWsmXdaRGL', // Sarvesh Super Market
  'oKDQpFZ3bx9C4S0Z0ti9', // Apex Scholar Publication
  'u9sYSAG9YoGrept1FbSe', // Suruliraj Chemicals
  'SDv5CaYdxKRWOXl4ej84', // Chennai Bakes
  'VG1PwPzKXofu1fLxLIpk', // SVR Heritage Hall
  'vMQgOwNd2fZ4Nm8870Dw'  // AGS IT Solutions
];

async function inspect() {
  const results = {};
  for (const id of ids) {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/thenijobs-9f01d/databases/(default)/documents/companies/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    results[id] = data.fields;
  }
  fs.writeFileSync('backups/inspected_7_companies.json', JSON.stringify(results, null, 2));
  console.log('Inspected and wrote 7 companies to backups/inspected_7_companies.json');
}

inspect().catch(console.error);
