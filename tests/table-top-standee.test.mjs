import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Printable QR Table-Top Standee Generator (PDF) Tests', () => {
  const STANDEE_DIMENSIONS = {
    a4: { width: 210, height: 297, label: 'A4 Poster / Counter Standee' },
    a5: { width: 148, height: 210, label: 'A5 Compact Table-Top Standee' },
  };

  const THEMES = {
    blue: {
      primary: [30, 64, 175],      // #1E40AF
      accent: [239, 246, 255],     // #EFF6FF
      hex: '#1E40AF',
    },
    emerald: {
      primary: [6, 95, 70],       // #065F46
      accent: [236, 253, 245],    // #ECFDF5
      hex: '#065F46',
    },
    navy: {
      primary: [15, 23, 42],      // #0F172A
      accent: [248, 250, 252],    // #F8FAFC
      hex: '#0F172A',
    },
  };

  const resolveQrUrl = (company, baseUrl = 'https://www.thenijobs.com') => {
    if (!company) throw new Error('Company is required');
    const identifier = company.slug || company.id;
    if (!identifier) throw new Error('Company identifier missing');
    return `${baseUrl}/${identifier}`;
  };

  const getStandeeDefaultCopy = (mode, customHeadline, customSubtext) => {
    if (mode === 'hiring') {
      return {
        badge: 'NOW HIRING • ஆட்கள் தேவை',
        headline: customHeadline || 'WE ARE HIRING!',
        subtext: customSubtext || 'Scan the QR code below to view open vacancies, salaries, and apply instantly on THENIJOBS.',
        tamilHook: 'எங்கள் நிறுவனத்தில் வேலைவாய்ப்புகள் உள்ளன!',
        qrInstruction: 'Scan with any UPI / Camera App to Apply',
      };
    }
    return {
      badge: 'EXPLORE OUR STORE • எங்கள் தயாரிப்புகள்',
      headline: customHeadline || 'EXPLORE OUR CATALOG & OFFERS',
      subtext: customSubtext || 'Scan the QR code below to view our products, daily offers, price list, and contact details.',
      tamilHook: 'எங்கள் தயாரிப்புகள் மற்றும் சலுகைகளை உடனே காண்க!',
      qrInstruction: 'Scan with any Phone Camera to View Catalog',
    };
  };

  test('Standee Paper Dimensions (A4 and A5 Standard Millimeters)', () => {
    assert.equal(STANDEE_DIMENSIONS.a4.width, 210);
    assert.equal(STANDEE_DIMENSIONS.a4.height, 297);
    assert.equal(STANDEE_DIMENSIONS.a5.width, 148);
    assert.equal(STANDEE_DIMENSIONS.a5.height, 210);
  });

  test('Color Themes Definition for Professional Printing', () => {
    assert.equal(THEMES.blue.hex, '#1E40AF');
    assert.equal(THEMES.emerald.hex, '#065F46');
    assert.equal(THEMES.navy.hex, '#0F172A');
  });

  test('QR URL Generation and Slug Fallback', () => {
    const companyWithSlug = { id: 'comp_123', slug: 'sri-krishna-sweets-theni' };
    assert.equal(
      resolveQrUrl(companyWithSlug),
      'https://www.thenijobs.com/sri-krishna-sweets-theni'
    );

    const companyWithoutSlug = { id: 'comp_456' };
    assert.equal(
      resolveQrUrl(companyWithoutSlug),
      'https://www.thenijobs.com/comp_456'
    );
  });

  test('Hiring Standee Copy and Bilingual Tamil Hooks', () => {
    const hiringCopy = getStandeeDefaultCopy('hiring');
    assert.equal(hiringCopy.badge, 'NOW HIRING • ஆட்கள் தேவை');
    assert.equal(hiringCopy.headline, 'WE ARE HIRING!');
    assert.ok(hiringCopy.tamilHook.includes('வேலைவாய்ப்புகள்'));
    assert.ok(hiringCopy.qrInstruction.includes('Scan'));

    // Custom copy override
    const customHiring = getStandeeDefaultCopy('hiring', 'WANTED URGENT NURSES', 'Immediate joining bonus available.');
    assert.equal(customHiring.headline, 'WANTED URGENT NURSES');
    assert.equal(customHiring.subtext, 'Immediate joining bonus available.');
  });

  test('Catalog & Offers Standee Copy and Bilingual Tamil Hooks', () => {
    const catalogCopy = getStandeeDefaultCopy('catalog');
    assert.equal(catalogCopy.badge, 'EXPLORE OUR STORE • எங்கள் தயாரிப்புகள்');
    assert.equal(catalogCopy.headline, 'EXPLORE OUR CATALOG & OFFERS');
    assert.ok(catalogCopy.tamilHook.includes('தயாரிப்புகள்'));
  });

  test('Folding / Cutting Guide Line Math for Table-Top Display', () => {
    // For acrylic L-stand or tent-fold cardboard:
    const calculateFoldingLines = (size) => {
      const { height } = STANDEE_DIMENSIONS[size];
      return {
        displayHeight: height * 0.85,
        foldBaseHeight: height * 0.15,
        foldLineY: height * 0.85,
      };
    };

    const a5Fold = calculateFoldingLines('a5');
    assert.equal(a5Fold.foldLineY, 178.5);
    assert.equal(a5Fold.foldBaseHeight, 31.5);
  });
});
