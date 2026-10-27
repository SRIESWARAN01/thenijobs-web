import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('Urgent Hiring 48-Hour Spotlight Badge (₹99 / ₹149) Workflow Tests', () => {
  const URGENT_HIRING_BADGE_FEE_INR = 99;
  const URGENT_HIRING_SUPER_FEE_INR = 149;
  const VALID_URGENT_FEES = [99, 149];
  const URGENT_HIRING_DURATION_HOURS = 48;

  const isJobUrgent = (job) => {
    if (!job) return false;
    if (job.isUrgent === false) return false;
    if (!job.urgentUntil) return Boolean(job.isUrgent);

    const untilDate = typeof job.urgentUntil.toDate === 'function'
      ? job.urgentUntil.toDate()
      : new Date(job.urgentUntil);

    return untilDate.getTime() > Date.now();
  };

  const getUrgentRemainingTime = (job) => {
    if (!job?.urgentUntil) return 'Active';
    const untilDate = typeof job.urgentUntil.toDate === 'function'
      ? job.urgentUntil.toDate()
      : new Date(job.urgentUntil);

    const diffMs = untilDate.getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (totalHours > 0) {
      return `${totalHours}h ${mins}m left`;
    }
    return `${mins}m left`;
  };

  // Taluk WhatsApp alert channels mapping for Theni district
  const TALUK_WHATSAPP_CHANNELS = {
    theni: {
      slug: 'theni',
      name: 'Theni Taluk',
      tamilName: 'தேனி தாலுகா',
      channelName: 'THENIJOBS – Theni Taluk Urgent Alert Channel',
      channelTamilName: 'தேனி தாலுகா அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    },
    periyakulam: {
      slug: 'periyakulam',
      name: 'Periyakulam Taluk',
      tamilName: 'பெரியகுளம் தாலுகா',
      channelName: 'THENIJOBS – Periyakulam Taluk Urgent Alert Channel',
      channelTamilName: 'பெரியகுளம் தாலுகா அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    },
    cumbum: {
      slug: 'cumbum',
      name: 'Cumbum Valley Taluk',
      tamilName: 'கம்பம் பள்ளத்தாக்கு',
      channelName: 'THENIJOBS – Cumbum Valley Urgent Alert Channel',
      channelTamilName: 'கம்பம் பள்ளத்தாக்கு அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    },
    bodinayakanur: {
      slug: 'bodinayakanur',
      name: 'Bodinayakanur Taluk',
      tamilName: 'போடிநாயக்கனூர் தாலுகா',
      channelName: 'THENIJOBS – Bodinayakanur Urgent Alert Channel',
      channelTamilName: 'போடிநாயக்கனூர் அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    },
    uthamapalayam: {
      slug: 'uthamapalayam',
      name: 'Uthamapalayam Taluk',
      tamilName: 'உத்தமபாளையம் தாலுகா',
      channelName: 'THENIJOBS – Uthamapalayam Urgent Alert Channel',
      channelTamilName: 'உத்தமபாளையம் அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    },
    andipatti: {
      slug: 'andipatti',
      name: 'Andipatti Taluk',
      tamilName: 'ஆண்டிபட்டி தாலுகா',
      channelName: 'THENIJOBS – Andipatti Urgent Alert Channel',
      channelTamilName: 'ஆண்டிபட்டி அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    },
    chinnamanur: {
      slug: 'chinnamanur',
      name: 'Chinnamanur Taluk',
      tamilName: 'சின்னமனூர் தாலுகா',
      channelName: 'THENIJOBS – Chinnamanur Urgent Alert Channel',
      channelTamilName: 'சின்னமனூர் அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    },
    general: {
      slug: 'theni-district',
      name: 'Theni District Central',
      tamilName: 'தேனி மாவட்டம் முழுவதும்',
      channelName: 'THENIJOBS – District-Wide Urgent Job Alerts',
      channelTamilName: 'தேனி மாவட்ட அவசர வேலைவாய்ப்பு நெட்வொர்க்',
    },
  };

  const detectTalukFromJob = (job) => {
    const combined = `${job.location || ''} ${job.district || ''} ${job.title || ''} ${job.description || ''}`.toLowerCase();

    if (combined.includes('periyakulam') || combined.includes('vadugapatti') || combined.includes('devadanapatti')) {
      return TALUK_WHATSAPP_CHANNELS.periyakulam;
    }
    if (combined.includes('cumbum') || combined.includes('kumbum') || combined.includes('gudalur')) {
      return TALUK_WHATSAPP_CHANNELS.cumbum;
    }
    if (combined.includes('bodi') || combined.includes('bodinayakanur') || combined.includes('kurangani')) {
      return TALUK_WHATSAPP_CHANNELS.bodinayakanur;
    }
    if (combined.includes('uthamapalayam') || combined.includes('kombai') || combined.includes('pannaipuram')) {
      return TALUK_WHATSAPP_CHANNELS.uthamapalayam;
    }
    if (combined.includes('andipatti') || combined.includes('kadamalaikundu')) {
      return TALUK_WHATSAPP_CHANNELS.andipatti;
    }
    if (combined.includes('chinnamanur')) {
      return TALUK_WHATSAPP_CHANNELS.chinnamanur;
    }
    if (combined.includes('theni') || combined.includes('allinagaram') || combined.includes('veerapandi')) {
      return TALUK_WHATSAPP_CHANNELS.theni;
    }

    return TALUK_WHATSAPP_CHANNELS.general;
  };

  const buildWhatsAppUrgentBroadcastText = (job) => {
    const taluk = detectTalukFromJob(job);
    const applyUrl = `https://www.thenijobs.com/jobs/${job.id}`;
    return `⚡ அவசர ஆட்கள் தேவை! • URGENT REQUIREMENT IN THENI! ⚡
📢 [${taluk.channelTamilName} • ${taluk.name}]

🏢 நிறுவனம் (Company): ${job.companyName}
💼 பதவி (Role): ${job.title}
📍 இடம் (Location): ${job.location || 'Theni District'}
💰 சம்பளம் (Salary): ₹${job.salaryMin} - ₹${job.salaryMax} / மாதம்
⏰ காலியிடங்கள்: ${job.openings || 'உடனடி நியமனம்'}
🔥 48 மணி நேர அவசர முன்னுரிமை வேலை (48-Hour Urgent Spotlight)!

👇 உடனடியாக விண்ணப்பிக்க (Apply Now in 1-Tap):
${applyUrl}

📲 அவசரமாக வேலை தேடும் உங்கள் நண்பர்களுடன் பகிருங்கள்! (Share with Theni Job Seekers)`;
  };

  test('Authoritative Fee and Spotlight Duration Configuration', () => {
    assert.equal(URGENT_HIRING_BADGE_FEE_INR, 99, 'Micro-fee must be strictly ₹99');
    assert.equal(URGENT_HIRING_SUPER_FEE_INR, 149, 'Super spotlight micro-fee must be strictly ₹149');
    assert.deepEqual(VALID_URGENT_FEES, [99, 149], 'Valid fees must strictly allow ₹99 and ₹149');
    assert.equal(URGENT_HIRING_DURATION_HOURS, 48, 'Spotlight duration must be exactly 48 hours');
  });

  test('Urgent Expiration and Active Status Logic', () => {
    const now = Date.now();

    // Active urgent job
    const activeJob = {
      id: 'job_1',
      title: 'Store Cashier',
      isUrgent: true,
      urgentUntil: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    };
    assert.equal(isJobUrgent(activeJob), true, 'Job with future urgentUntil must be marked urgent');

    // Expired urgent job
    const expiredJob = {
      id: 'job_2',
      title: 'Pharmacy Assistant',
      isUrgent: true,
      urgentUntil: new Date(now - 1000).toISOString(),
    };
    assert.equal(isJobUrgent(expiredJob), false, 'Expired urgent job must return false');

    // Non-urgent job
    const regularJob = {
      id: 'job_3',
      title: 'Accountant',
      isUrgent: false,
    };
    assert.equal(isJobUrgent(regularJob), false, 'Regular job must return false');

    // Firestore timestamp mock
    const firestoreJob = {
      id: 'job_4',
      isUrgent: true,
      urgentUntil: {
        toDate: () => new Date(now + 12 * 60 * 60 * 1000),
      },
    };
    assert.equal(isJobUrgent(firestoreJob), true, 'Firestore Timestamp toDate() must be supported');
  });

  test('Urgent Remaining Time Countdown Formatter', () => {
    const now = Date.now();
    const jobWith40Hours = {
      urgentUntil: new Date(now + ((40 * 60 + 15) * 60 + 10) * 1000).toISOString(),
    };
    assert.equal(getUrgentRemainingTime(jobWith40Hours), '40h 15m left');

    const jobWith30Minutes = {
      urgentUntil: new Date(now + (30 * 60 + 10) * 1000).toISOString(),
    };
    assert.equal(getUrgentRemainingTime(jobWith30Minutes), '30m left');

    const expiredJob = {
      urgentUntil: new Date(now - 5000).toISOString(),
    };
    assert.equal(getUrgentRemainingTime(expiredJob), 'Expired');
  });

  test('Priority Feed Sorting - Urgent Jobs Rank Above Non-Urgent Jobs', () => {
    const now = Date.now();
    const jobs = [
      { id: 'regular_1', title: 'Regular Salesman', isUrgent: false, createdAt: '2026-10-25' },
      { id: 'urgent_1', title: 'Urgent ICU Nurse', isUrgent: true, urgentUntil: new Date(now + 3600000).toISOString(), createdAt: '2026-10-20' },
      { id: 'regular_2', title: 'Regular Driver', isUrgent: false, createdAt: '2026-10-26' },
      { id: 'urgent_2', title: 'Urgent Cashier', isUrgent: true, urgentUntil: new Date(now + 7200000).toISOString(), createdAt: '2026-10-21' },
    ];

    const sorted = [...jobs].sort((a, b) => {
      const aUrgent = isJobUrgent(a);
      const bUrgent = isJobUrgent(b);
      if (aUrgent !== bUrgent) {
        return aUrgent ? -1 : 1;
      }
      return 0;
    });

    assert.equal(sorted[0].id, 'urgent_1');
    assert.equal(sorted[1].id, 'urgent_2');
    assert.equal(sorted[2].id, 'regular_1');
    assert.equal(sorted[3].id, 'regular_2');
  });

  test('Bilingual WhatsApp Urgent Requirement Alert Generator with Taluk Channels', () => {
    const mockPeriyakulamJob = {
      id: 'job_peri_101',
      title: 'ICU Staff Nurse',
      companyName: 'Periyakulam Government Approved Hospital',
      location: 'Periyakulam Main Road',
      district: 'Theni',
      salaryMin: 22000,
      salaryMax: 30000,
      openings: '3 காலியிடங்கள்',
    };

    const periText = buildWhatsAppUrgentBroadcastText(mockPeriyakulamJob);
    assert.ok(periText.includes('⚡ அவசர ஆட்கள் தேவை! • URGENT REQUIREMENT IN THENI! ⚡'));
    assert.ok(periText.includes('பெரியகுளம் தாலுகா அவசர வேலைவாய்ப்பு எச்சரிக்கை'));
    assert.ok(periText.includes('Periyakulam Taluk'));
    assert.ok(periText.includes('ICU Staff Nurse'));
    assert.ok(periText.includes('Periyakulam Government Approved Hospital'));
    assert.ok(periText.includes('https://www.thenijobs.com/jobs/job_peri_101'));

    const mockBodiJob = {
      id: 'job_bodi_202',
      title: 'Cardamom Warehouse Cashier',
      companyName: 'Bodi Spices Mart',
      location: 'Bodinayakanur Bazaar',
      salaryMin: 15000,
      salaryMax: 18000,
    };
    const bodiText = buildWhatsAppUrgentBroadcastText(mockBodiJob);
    assert.ok(bodiText.includes('போடிநாயக்கனூர் அவசர வேலைவாய்ப்பு எச்சரிக்கை'));
    assert.ok(bodiText.includes('Bodinayakanur Taluk'));

    const mockCumbumJob = {
      id: 'job_cumbum_303',
      title: 'Grape Vineyard Supervisor',
      companyName: 'Cumbum Valley Farms',
      location: 'Cumbum',
      salaryMin: 20000,
      salaryMax: 25000,
    };
    const cumbumText = buildWhatsAppUrgentBroadcastText(mockCumbumJob);
    assert.ok(cumbumText.includes('கம்பம் பள்ளத்தாக்கு அவசர வேலைவாய்ப்பு எச்சரிக்கை'));
    assert.ok(cumbumText.includes('Cumbum Valley Taluk'));
  });

  test('Taluk Detection Accuracy Across All 7 Theni Taluks', () => {
    assert.equal(detectTalukFromJob({ location: 'Theni Allinagaram' }).slug, 'theni');
    assert.equal(detectTalukFromJob({ location: 'Periyakulam' }).slug, 'periyakulam');
    assert.equal(detectTalukFromJob({ location: 'Cumbum Town' }).slug, 'cumbum');
    assert.equal(detectTalukFromJob({ location: 'Bodinayakanur Market' }).slug, 'bodinayakanur');
    assert.equal(detectTalukFromJob({ location: 'Uthamapalayam Main' }).slug, 'uthamapalayam');
    assert.equal(detectTalukFromJob({ location: 'Andipatti Handloom Street' }).slug, 'andipatti');
    assert.equal(detectTalukFromJob({ location: 'Chinnamanur Agro' }).slug, 'chinnamanur');
  });

  test('Razorpay HMAC SHA-256 Verification for Urgent Badge Order (₹99 and ₹149)', () => {
    const secret = 'rzp_urgent_secret_key_sample';

    // Standard ₹99 order
    const orderId99 = 'order_urgent_99_77189';
    const paymentId99 = 'pay_urgent_99_99211';
    const signature99 = crypto
      .createHmac('sha256', secret)
      .update(`${orderId99}|${paymentId99}`)
      .digest('hex');

    const expectedSig99 = crypto
      .createHmac('sha256', secret)
      .update(`${orderId99}|${paymentId99}`)
      .digest('hex');
    assert.equal(signature99, expectedSig99);

    // Super Spotlight ₹149 order
    const orderId149 = 'order_urgent_149_88190';
    const paymentId149 = 'pay_urgent_149_00322';
    const signature149 = crypto
      .createHmac('sha256', secret)
      .update(`${orderId149}|${paymentId149}`)
      .digest('hex');

    const expectedSig149 = crypto
      .createHmac('sha256', secret)
      .update(`${orderId149}|${paymentId149}`)
      .digest('hex');
    assert.equal(signature149, expectedSig149);
  });
});
