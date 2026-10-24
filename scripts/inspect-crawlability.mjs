import fs from 'node:fs';

const routes = [
  { name: '/jobs/[id]', file: '.next/server/app/jobs/medical-records-reviewer-ags-it-solutions-theni.html' },
  { name: '/company/[slug]', file: '.next/server/app/company/sarvesh-super-market.html' },
  { name: '/[companySlug]', file: '.next/server/app/sarvesh-super-market.html' },
  { name: '/marketplace/[type]/[companySlug]/[itemId]', file: '.next/server/app/marketplace/service/agrimore/svc_0.html' },
  { name: '/businesses/[category]', file: '.next/server/app/businesses/all.html' },
  { name: '/portfolio/[username]', file: '.next/server/app/portfolio/saai-siddharth.html' },
  { name: '/portfolio/seeker/[id]', file: '.next/server/app/portfolio/seeker/lDZpSbaKK1Rj3RifzGdoLHnzm6D3.html' }
];

console.log('------------------------------------------------------------');
console.log('THENIJOBS CRAWLABILITY & SEO AUDIT (Generated HTML Inspection)');
console.log('------------------------------------------------------------');

for (const r of routes) {
  if (fs.existsSync(r.file)) {
    const content = fs.readFileSync(r.file, 'utf8');
    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
    const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    const robotsMatch = content.match(/<meta\s+name="robots"\s+content="([^"]+)"/);
    const canonicalMatch = content.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
    const jsonLdMatches = content.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || [];
    
    console.log(`\nRoute: ${r.name}`);
    console.log(`  File: ${r.file} (${(content.length / 1024).toFixed(1)} KB)`);
    console.log(`  Title: ${titleMatch ? titleMatch[1] : 'NONE'}`);
    console.log(`  Description: ${descMatch ? descMatch[1].slice(0, 90) + '...' : 'NONE'}`);
    console.log(`  Canonical: ${canonicalMatch ? canonicalMatch[1] : 'NONE'}`);
    console.log(`  Robots: ${robotsMatch ? robotsMatch[1] : 'default (index, follow)'}`);
    console.log(`  JSON-LD Schemas: ${jsonLdMatches.length}`);
    jsonLdMatches.forEach((m, idx) => {
      const typeMatch = m.match(/"@type"\s*:\s*"([^"]+)"/);
      console.log(`    Schema [${idx + 1}]: @type = ${typeMatch ? typeMatch[1] : 'Unknown'}`);
    });
  } else {
    console.log(`\nRoute: ${r.name}`);
    console.log(`  STATUS: File not generated at ${r.file}`);
  }
}
