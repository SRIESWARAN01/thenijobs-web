import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('backups/inspected_7_companies.json', 'utf8'));

for (const [id, fields] of Object.entries(data)) {
  console.log('ID:', id);
  console.log('  Name:', fields.name?.stringValue);
  console.log('  Category:', fields.category?.stringValue);
  console.log('  District:', fields.district?.stringValue || fields.location?.stringValue);
  console.log('  verificationStatus:', fields.verificationStatus?.stringValue);
  console.log('  approvalStatus:', fields.approvalStatus?.stringValue);
  console.log('  isActive:', fields.isActive?.booleanValue);
  console.log('  isVerified:', fields.isVerified?.booleanValue);
  console.log('  slug:', fields.slug?.stringValue || fields.slugLower?.stringValue);
  console.log('  logoUrl:', fields.logoUrl?.stringValue);
  console.log('  coverUrl:', fields.coverUrl?.stringValue);
}
