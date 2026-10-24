import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function getLatestToken() {
  const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Firebase CLI credentials not found at ' + configPath);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config.tokens?.access_token;
}

function refreshTokenViaCli() {
  console.log('Refreshing token via Firebase CLI...');
  execSync('firebase projects:list', { stdio: 'pipe' });
  return getLatestToken();
}

const DESCRIPTIONS_UPDATE = {
  ik3pWBDVVUR3Sb51knwK: {
    name: 'Agrimore',
    category: 'Retail, Shop & Supermarket',
    district: 'Chinnamanur',
    location: 'Chinnamanur',
    slug: 'agrimore',
    slugLower: 'agrimore',
    tagline: 'Wholesale முதல் Retail வரை — விவசாயம் முதல் உங்கள் வீடு வரை!',
    description: `Agrimore is a modern hyperlocal marketplace based in Chinnamanur, connecting customers, local retailers, and agricultural producers across Theni district. We bridge farm-to-doorstep convenience with reliable local sourcing, offering quality agricultural produce, groceries, and essential goods at competitive wholesale and retail pricing.`,
  },
  mWWNVrCGounWsmXdaRGL: {
    name: 'Sarvesh Super Market',
    category: 'Retail, Shop & Supermarket',
    district: 'Theni',
    location: 'Theni',
    slug: 'sarvesh-super-market',
    slugLower: 'sarvesh-super-market',
    tagline: 'Your Trusted Neighborhood Supermarket in Theni',
    description: `Sarvesh Super Market is a premier neighborhood supermarket conveniently situated in Theni, dedicated to fulfilling everyday family essentials under one roof. We offer a comprehensive assortment of quality groceries, household products, plasticware, and daily provisions with friendly local service and convenient shopping for the community.`,
  },
  oKDQpFZ3bx9C4S0Z0ti9: {
    name: 'Apex Scholar Publication',
    category: 'Education & Training',
    district: 'Theni',
    location: 'Theni',
    slug: 'apex-scholar-publication',
    slugLower: 'apex-scholar-publication',
    tagline: 'Independent Scholarly Publishing & Academic Excellence',
    description: `Apex Scholar Publication is an independent academic publishing house located in Theni, committed to bringing scholarly research, educational textbooks, academic journals, and inspiring works to educators, students, and readers across Tamil Nadu and beyond.`,
  },
  u9sYSAG9YoGrept1FbSe: {
    name: 'Suruliraj Chemicals',
    category: 'Retail, Shop & Supermarket',
    district: 'Theni',
    location: 'Theni',
    slug: 'suruliraj-chemicals',
    slugLower: 'suruliraj-chemicals',
    tagline: 'Wholesale & Retail Hygiene and Cleaning Solutions',
    description: `Suruliraj Chemicals is a reliable retail and wholesale supplier of quality cleaning and hygiene chemicals in Theni district. Our verified inventory includes detergent bars, dishwash bars, laundry powders, phenyl, floor cleaners, fabric conditioners, toilet cleaners, bleaching agents, multipurpose oils, and specialized stain removers for domestic and commercial cleaning needs.`,
  },
  SDv5CaYdxKRWOXl4ej84: {
    name: 'Chennai Bakes',
    category: 'Hotel, Food & Restaurant',
    district: 'Uthamapalayam',
    location: 'Uthamapalayam',
    slug: 'chennai-bakes',
    slugLower: 'chennai-bakes',
    tagline: 'Fresh Bakes, Pastries, Sweets & Savouries in Uthamapalayam',
    description: `Chennai Bakes is a popular local bakery and food destination situated near the bypass in Uthamapalayam, Theni district. Dedicated to quality and taste, we serve fresh tea, brewed coffee, oven-fresh cakes, pastries, traditional sweets, and crispy evening snacks crafted with authentic culinary care for travelers and local patrons alike.`,
  },
  VG1PwPzKXofu1fLxLIpk: {
    name: 'SVR Heritage Hall',
    category: 'Professional & Business Services',
    district: 'Uthamapalayam',
    location: 'Uthamapalayam',
    slug: 'svr-heritage-hall',
    slugLower: 'svr-heritage-hall',
    tagline: 'Grand Venue for Weddings & Memorable Family Occasions',
    description: `SVR Heritage Hall is a distinguished event and banquet hall located in Uthamapalayam, Theni district. Designed to host elegant weddings, family receptions, corporate gatherings, and cultural functions, the venue offers spacious facilities, comfortable arrangements, and dedicated event management support to ensure memorable celebrations.`,
  },
  vMQgOwNd2fZ4Nm8870Dw: {
    name: 'AGS IT Solutions',
    category: 'IT, Software & Digital',
    district: 'Theni',
    location: 'Theni',
    slug: 'ags-it-solutions',
    slugLower: 'ags-it-solutions',
    tagline: 'Specialized Medical Records Review & Digital Technology Services',
    description: `AGS IT Solutions is a professional technology and healthcare information management firm based in Theni, Tamil Nadu. We specialize in precision medical records review services, digital data management, technical support, and modern software solutions tailored for healthcare organizations and business enterprises.`,
  },
};

async function updateCompanies() {
  console.log('=== UPDATING 7 APPROVED COMPANIES IN FIRESTORE ===');
  let token = getLatestToken();

  for (const [id, data] of Object.entries(DESCRIPTIONS_UPDATE)) {
    const url = `https://firestore.googleapis.com/v1/projects/thenijobs-9f01d/databases/(default)/documents/companies/${id}?updateMask.fieldPaths=name&updateMask.fieldPaths=category&updateMask.fieldPaths=district&updateMask.fieldPaths=location&updateMask.fieldPaths=slug&updateMask.fieldPaths=slugLower&updateMask.fieldPaths=tagline&updateMask.fieldPaths=description`;

    const body = {
      fields: {
        name: { stringValue: data.name },
        category: { stringValue: data.category },
        district: { stringValue: data.district },
        location: { stringValue: data.location },
        slug: { stringValue: data.slug },
        slugLower: { stringValue: data.slugLower },
        tagline: { stringValue: data.tagline },
        description: { stringValue: data.description },
      },
    };

    let res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      token = refreshTokenViaCli();
      res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    if (res.ok) {
      console.log(`[SUCCESS] Updated ${id} (${data.name}) — Slug: ${data.slug}`);
    } else {
      const errText = await res.text();
      console.error(`[FAILED] Update failed for ${id}:`, res.status, errText);
    }
  }

  console.log('\nAll 7 approved companies updated successfully in live Firestore!');
}

updateCompanies().catch(console.error);
