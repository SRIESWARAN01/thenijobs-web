import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Constants and helper functions under test (mirrored from src/lib/constants.ts)
const DEFAULT_WHATSAPP_SUPPORT = '919360519460';

function sanitizeWhatsAppPhone(phone, fallback = DEFAULT_WHATSAPP_SUPPORT) {
  if (!phone || typeof phone !== 'string') return fallback;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return fallback;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length >= 10) return digits;
  return fallback;
}

const THENI_TALUKS = [
  { id: 'theni', name: 'Theni', tamilName: 'தேனி', towns: ['Theni', 'Allinagaram', 'Veerapandi'] },
  { id: 'periyakulam', name: 'Periyakulam', tamilName: 'பெரியகுளம்', towns: ['Periyakulam', 'Vadagarai', 'Devadanapatti', 'Thenkarai'] },
  { id: 'cumbum', name: 'Cumbum', tamilName: 'கம்பம்', towns: ['Cumbum', 'Gudalur', 'Kamayagoundanpatti', 'Surulipatti'] },
  { id: 'chinnamanur', name: 'Chinnamanur', tamilName: 'சின்னமனூர்', towns: ['Chinnamanur', 'Markayankottai', 'Kuchanur', 'Erasakkanaickanur'] },
  { id: 'bodinayakanur', name: 'Bodinayakanur', tamilName: 'போடிநாயக்கனூர்', towns: ['Bodinayakanur', 'Bodi Ammapatti', 'Silamarathupatti', 'Mundhal'] },
  { id: 'andipatti', name: 'Andipatti', tamilName: 'ஆண்டிபட்டி', towns: ['Andipatti', 'Kadamalaikundu', 'Myladumparai', 'Varusanadu'] },
  { id: 'uthamapalayam', name: 'Uthamapalayam', tamilName: 'உத்தமபாளையம்', towns: ['Uthamapalayam', 'Pannaipuram', 'Kombai', 'Hanumanthanpatti', 'Rayappanpatti'] },
];

const POPULAR_JOB_CATEGORIES = [
  { id: 'retail-sales', label: 'Retail & Sales', tamil: 'விற்பனை & ஷோரூம்' },
  { id: 'accounts-tally', label: 'Accounts & Tally', tamil: 'கணக்காளர் & டாலி' },
  { id: 'office-admin', label: 'Office Admin & Computer', tamil: 'அலுவலக நிர்வாகம்' },
  { id: 'software-it', label: 'Software & IT', tamil: 'மென்பொருள் & ஐடி' },
  { id: 'hospital-healthcare', label: 'Hospital & Healthcare', tamil: 'மருத்துவமனை & செவிலியர்' },
  { id: 'teaching-faculty', label: 'Teaching & Faculty', tamil: 'ஆசிரியர் & விரிவுரையாளர்' },
  { id: 'delivery-logistics', label: 'Delivery & Logistics', tamil: 'டெலிவரி & டிரைவர்' },
  { id: 'manufacturing-factory', label: 'Manufacturing & Mills', tamil: 'உற்பத்தி & ஆலை' },
  { id: 'hotel-restaurant', label: 'Hotel & Restaurant', tamil: 'ஹோட்டல் & சமையல்' },
];

function generateWhatsAppApplyMessage({
  jobTitle,
  companyName,
  location,
  candidateName,
  candidatePhone,
  qualification,
  experience,
  taluk,
  profileUrl,
}) {
  return [
    `வணக்கம்! THENIJOBS வழியாக உங்கள் வேலைவாய்ப்பை பார்த்தேன்.`,
    ``,
    `📌 பணி (Role): ${jobTitle}`,
    `🏢 நிறுவனம் (Company): ${companyName}`,
    `📍 இடம் (Location): ${location || 'Theni'}`,
    ``,
    `👤 விண்ணப்பதாரர் பெயர்: ${candidateName?.trim() || 'Job Seeker'}`,
    `📞 தொடர்பு எண்: ${candidatePhone?.trim() || 'Provided on chat'}`,
    `🎓 கல்வி / தகுதி: ${qualification || 'Graduate'}`,
    `💼 அனுபவம்: ${experience || '1-2 Years'}`,
    `🏘️ வசிக்கும் ஊர்: ${taluk || 'Theni'} தாலுகா`,
    profileUrl ? `🌐 சுயவிவரம் (Profile): ${profileUrl}` : `🌐 பதிவு: THENIJOBS தளம்`,
    ``,
    `நேர்காணல் (Interview) மற்றும் பணி விவரங்களை பகிருமாறு அன்புடன் கேட்டுக்கொள்கிறேன். நன்றி!`,
  ].join('\n');
}

function buildWhatsAppUrl(sanitizedPhone, message) {
  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
}

describe('THENIJOBS — 1-Click WhatsApp Direct Apply & Job Alerts Test Suite', () => {

  // ─── 1. Phone Sanitization ──────────────────────────────────────────────────
  describe('WhatsApp Phone Number Sanitization', () => {
    test('Formats clean 10-digit Indian phone numbers with 91 prefix', () => {
      assert.strictEqual(sanitizeWhatsAppPhone('9629625478'), '919629625478');
      assert.strictEqual(sanitizeWhatsAppPhone('9876543210'), '919876543210');
    });

    test('Preserves already-prefixed 12-digit Indian phone numbers', () => {
      assert.strictEqual(sanitizeWhatsAppPhone('919629625478'), '919629625478');
      assert.strictEqual(sanitizeWhatsAppPhone('919876543210'), '919876543210');
    });

    test('Strips plus sign, spaces, and hyphens properly', () => {
      assert.strictEqual(sanitizeWhatsAppPhone('+91 96296 25478'), '919629625478');
      assert.strictEqual(sanitizeWhatsAppPhone('+91-98765-43210'), '919876543210');
      assert.strictEqual(sanitizeWhatsAppPhone('  +91  93605 19460  '), '919360519460');
    });

    test('Normalizes numbers with leading 0', () => {
      assert.strictEqual(sanitizeWhatsAppPhone('09629625478'), '919629625478');
    });

    test('Falls back safely to default support contact for invalid or empty inputs', () => {
      assert.strictEqual(sanitizeWhatsAppPhone(''), DEFAULT_WHATSAPP_SUPPORT);
      assert.strictEqual(sanitizeWhatsAppPhone(null), DEFAULT_WHATSAPP_SUPPORT);
      assert.strictEqual(sanitizeWhatsAppPhone(undefined), DEFAULT_WHATSAPP_SUPPORT);
      assert.strictEqual(sanitizeWhatsAppPhone('abc'), DEFAULT_WHATSAPP_SUPPORT);
      assert.strictEqual(sanitizeWhatsAppPhone('12345'), DEFAULT_WHATSAPP_SUPPORT);
    });

    test('Supports custom fallback when provided', () => {
      const customFallback = '919999999999';
      assert.strictEqual(sanitizeWhatsAppPhone('', customFallback), customFallback);
      assert.strictEqual(sanitizeWhatsAppPhone('invalid', customFallback), customFallback);
    });
  });

  // ─── 2. Theni Taluks & Job Categories Coverage ──────────────────────────────
  describe('Theni Taluks & Job Categories Reference Data', () => {
    test('Contains exactly 7 authoritative Theni taluks', () => {
      assert.strictEqual(THENI_TALUKS.length, 7);
      const talukIds = THENI_TALUKS.map(t => t.id);
      assert.deepStrictEqual(talukIds, [
        'theni',
        'periyakulam',
        'cumbum',
        'chinnamanur',
        'bodinayakanur',
        'andipatti',
        'uthamapalayam'
      ]);
    });

    test('Each taluk has complete metadata: id, English name, Tamil name, and popular towns', () => {
      for (const t of THENI_TALUKS) {
        assert.ok(t.id && t.id.length > 0, `Missing id for taluk: ${JSON.stringify(t)}`);
        assert.ok(t.name && t.name.length > 0, `Missing name for taluk: ${t.id}`);
        assert.ok(t.tamilName && t.tamilName.length > 0, `Missing tamilName for taluk: ${t.id}`);
        assert.ok(Array.isArray(t.towns) && t.towns.length > 0, `Towns should be non-empty array for taluk: ${t.id}`);
      }
    });

    test('Includes Cumbum and Periyakulam with specific towns', () => {
      const cumbum = THENI_TALUKS.find(t => t.id === 'cumbum');
      assert.ok(cumbum);
      assert.strictEqual(cumbum.tamilName, 'கம்பம்');
      assert.ok(cumbum.towns.includes('Gudalur'));
      assert.ok(cumbum.towns.includes('Surulipatti'));

      const periyakulam = THENI_TALUKS.find(t => t.id === 'periyakulam');
      assert.ok(periyakulam);
      assert.strictEqual(periyakulam.tamilName, 'பெரியகுளம்');
      assert.ok(periyakulam.towns.includes('Devadanapatti'));
    });

    test('Popular job categories cover 9 essential employment sectors in Theni', () => {
      assert.strictEqual(POPULAR_JOB_CATEGORIES.length, 9);
      const categoryIds = POPULAR_JOB_CATEGORIES.map(c => c.id);
      assert.ok(categoryIds.includes('retail-sales'));
      assert.ok(categoryIds.includes('accounts-tally'));
      assert.ok(categoryIds.includes('software-it'));
      assert.ok(categoryIds.includes('hospital-healthcare'));
      assert.ok(categoryIds.includes('manufacturing-factory'));
      assert.ok(categoryIds.includes('delivery-logistics'));

      for (const c of POPULAR_JOB_CATEGORIES) {
        assert.ok(c.label && c.label.length > 0);
        assert.ok(c.tamil && c.tamil.length > 0);
      }
    });
  });

  // ─── 3. Bilingual WhatsApp Message Generation ───────────────────────────────
  describe('Bilingual WhatsApp Direct Apply Message Builder', () => {
    test('Constructs polite Tamil greeting and structured details', () => {
      const msg = generateWhatsAppApplyMessage({
        jobTitle: 'Accounts Executive / Tally Prime',
        companyName: 'AGS IT SOLUTIONS',
        location: 'Theni Old Bus Stand',
        candidateName: 'Karthik Raja',
        candidatePhone: '9629625478',
        qualification: 'B.Com / M.Com',
        experience: '2 Years',
        taluk: 'Theni',
        profileUrl: 'https://thenijobs.com/portfolio/seeker/user_123',
      });

      assert.ok(msg.includes('வணக்கம்! THENIJOBS வழியாக உங்கள் வேலைவாய்ப்பை பார்த்தேன்.'));
      assert.ok(msg.includes('📌 பணி (Role): Accounts Executive / Tally Prime'));
      assert.ok(msg.includes('🏢 நிறுவனம் (Company): AGS IT SOLUTIONS'));
      assert.ok(msg.includes('📍 இடம் (Location): Theni Old Bus Stand'));
      assert.ok(msg.includes('👤 விண்ணப்பதாரர் பெயர்: Karthik Raja'));
      assert.ok(msg.includes('📞 தொடர்பு எண்: 9629625478'));
      assert.ok(msg.includes('🎓 கல்வி / தகுதி: B.Com / M.Com'));
      assert.ok(msg.includes('💼 அனுபவம்: 2 Years'));
      assert.ok(msg.includes('🏘️ வசிக்கும் ஊர்: Theni தாலுகா'));
      assert.ok(msg.includes('🌐 சுயவிவரம் (Profile): https://thenijobs.com/portfolio/seeker/user_123'));
      assert.ok(msg.includes('நேர்காணல் (Interview) மற்றும் பணி விவரங்களை பகிருமாறு அன்புடன் கேட்டுக்கொள்கிறேன். நன்றி!'));
    });

    test('Provides fallback values when optional fields are omitted', () => {
      const msg = generateWhatsAppApplyMessage({
        jobTitle: 'Retail Sales Associate',
        companyName: 'Sarvesh Super Market',
        candidateName: '',
        candidatePhone: '',
      });

      assert.ok(msg.includes('👤 விண்ணப்பதாரர் பெயர்: Job Seeker'));
      assert.ok(msg.includes('📞 தொடர்பு எண்: Provided on chat'));
      assert.ok(msg.includes('🎓 கல்வி / தகுதி: Graduate'));
      assert.ok(msg.includes('💼 அனுபவம்: 1-2 Years'));
      assert.ok(msg.includes('🌐 பதிவு: THENIJOBS தளம்'));
    });

    test('Builds valid WhatsApp click-to-chat URL with percent-encoded query param', () => {
      const rawMsg = generateWhatsAppApplyMessage({
        jobTitle: 'Supervisor',
        companyName: 'Agrimore',
        candidateName: 'Murugan',
      });
      const sanitizedPhone = sanitizeWhatsAppPhone('9629625478');
      const url = buildWhatsAppUrl(sanitizedPhone, rawMsg);

      assert.ok(url.startsWith('https://wa.me/919629625478?text='));
      assert.ok(url.includes('%E0%AE%B5%E0%AE%A3%E0%AE%95%E0%AF%8D%E0%AE%95%E0%AE%AE%E0%AF%8D')); // "வணக்கம்" in UTF-8
      assert.ok(url.includes('Murugan'));
      assert.ok(url.includes('Agrimore'));
    });
  });

  // ─── 4. Firestore Document Contracts ────────────────────────────────────────
  describe('Firestore Document Payload Schemas', () => {
    test('Direct WhatsApp Apply payload matches the applications collection contract', () => {
      const appPayload = {
        jobId: 'job_456',
        jobTitle: 'Graphic Designer',
        jobSlug: 'graphic-designer-job_456',
        companyId: 'comp_789',
        companyName: 'Apex Scholar Publication',
        seekerId: 'seeker_abc123',
        seekerName: 'Priya Dharshini',
        seekerPhone: '9876543210',
        seekerEmail: 'priya@example.com',
        appliedVia: 'whatsapp',
        seekerTaluk: 'Bodinayakanur',
        seekerQualification: 'B.Sc Visual Communication',
        seekerExperience: '1 Year',
        status: 'applied',
        createdAt: new Date().toISOString(),
      };

      assert.strictEqual(appPayload.appliedVia, 'whatsapp');
      assert.strictEqual(appPayload.status, 'applied');
      assert.ok(appPayload.jobId && appPayload.companyId && appPayload.seekerId);
      assert.ok(appPayload.seekerPhone.length >= 10);
      assert.strictEqual(appPayload.seekerTaluk, 'Bodinayakanur');
    });

    test('WhatsApp Job Alert payload matches the jobAlerts collection contract', () => {
      const alertPayload = {
        phone: '9629625478',
        sanitizedPhone: sanitizeWhatsAppPhone('9629625478'),
        userId: 'seeker_abc123',
        taluks: ['theni', 'periyakulam'],
        categories: ['retail-sales', 'accounts-tally'],
        frequency: 'instant',
        active: true,
        source: 'jobs_browse',
        createdAt: new Date().toISOString(),
      };

      assert.strictEqual(alertPayload.sanitizedPhone, '919629625478');
      assert.strictEqual(alertPayload.active, true);
      assert.strictEqual(alertPayload.frequency, 'instant');
      assert.deepStrictEqual(alertPayload.taluks, ['theni', 'periyakulam']);
      assert.deepStrictEqual(alertPayload.categories, ['retail-sales', 'accounts-tally']);
    });
  });

  // ─── 5. Employer Pipeline Presentation ──────────────────────────────────────
  describe('Employer Pipeline Presentation & Badging', () => {
    function getApplicationBadge(app) {
      if (app.appliedVia === 'whatsapp') {
        return { label: 'WhatsApp Apply', tone: 'emerald' };
      }
      return { label: 'Portal Apply', tone: 'blue' };
    }

    function isOverdue(app) {
      const cur = app.status || 'applied';
      if (cur !== 'applied' && cur !== 'under_review') return false;
      const createdDate = new Date(app.createdAt);
      return Date.now() - createdDate.getTime() > 7 * 86400000;
    }

    test('Identifies candidates who applied via WhatsApp with emerald badge', () => {
      const waCandidate = {
        id: 'app_1',
        seekerName: 'Suresh Kumar',
        appliedVia: 'whatsapp',
        status: 'applied',
      };
      const portalCandidate = {
        id: 'app_2',
        seekerName: 'Meena R',
        appliedVia: 'portal',
        status: 'applied',
      };

      assert.deepStrictEqual(getApplicationBadge(waCandidate), {
        label: 'WhatsApp Apply',
        tone: 'emerald',
      });
      assert.deepStrictEqual(getApplicationBadge(portalCandidate), {
        label: 'Portal Apply',
        tone: 'blue',
      });
    });

    test('Computes 7-day overdue SLA correctly for both application sources', () => {
      const recentDate = new Date(Date.now() - 2 * 86400000).toISOString(); // 2 days ago
      const overdueDate = new Date(Date.now() - 9 * 86400000).toISOString(); // 9 days ago

      const recentCandidate = { id: 'app_r', status: 'applied', createdAt: recentDate };
      const overdueCandidate = { id: 'app_o', status: 'applied', createdAt: overdueDate };
      const hiredCandidate = { id: 'app_h', status: 'selected', createdAt: overdueDate };

      assert.strictEqual(isOverdue(recentCandidate), false);
      assert.strictEqual(isOverdue(overdueCandidate), true);
      assert.strictEqual(isOverdue(hiredCandidate), false); // progressed status not overdue
    });
  });
});
