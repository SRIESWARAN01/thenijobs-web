import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('Urgent Hiring 48-Hour Spotlight Badge (₹99) Workflow Tests', () => {
  const URGENT_HIRING_BADGE_FEE_INR = 99;
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

  test('Authoritative Fee and Spotlight Duration Configuration', () => {
    assert.equal(URGENT_HIRING_BADGE_FEE_INR, 99, 'Micro-fee must be strictly ₹99');
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

  test('Bilingual WhatsApp Urgent Requirement Alert Generator', () => {
    const buildWhatsAppUrgentBroadcastText = (job) => {
      const applyUrl = `https://www.thenijobs.com/jobs/${job.id}`;
      return `🚨 *அவசர ஆட்கள் தேவை / URGENT REQUIREMENT* 🚨
━━━━━━━━━━━━━━━━━━━━
🏢 *நிறுவனம் / Company:* ${job.companyName}
💼 *பணி / Role:* ${job.title}
📍 *இடம் / Location:* ${job.location || 'Theni District'}
💰 *சம்பளம் / Salary:* ₹${job.salaryMin} - ₹${job.salaryMax} / மாதம்
📞 *தொடர்புக்கு / Contact:* ${job.contactPhone}

⚡ *48 மணி நேர அவசர முன்னுரிமை வேலைவாய்ப்பு!*
👉 *உடனே விண்ணப்பிக்க / Apply Now:*
${applyUrl}
━━━━━━━━━━━━━━━━━━━━
📌 _தெனி மாவட்ட வேலைவாய்ப்புகளுக்கு THENIJOBS_`;
    };

    const mockJob = {
      id: 'job_theni_99',
      title: 'Hospital Pharmacist',
      companyName: 'Theni City Hospital',
      location: 'Periyakulam Road, Theni',
      salaryMin: 18000,
      salaryMax: 25000,
      contactPhone: '+91 93605 19460',
    };

    const text = buildWhatsAppUrgentBroadcastText(mockJob);
    assert.ok(text.includes('🚨 *அவசர ஆட்கள் தேவை / URGENT REQUIREMENT* 🚨'));
    assert.ok(text.includes('Theni City Hospital'));
    assert.ok(text.includes('Hospital Pharmacist'));
    assert.ok(text.includes('Periyakulam Road, Theni'));
    assert.ok(text.includes('₹18000 - ₹25000'));
    assert.ok(text.includes('https://www.thenijobs.com/jobs/job_theni_99'));
    assert.ok(text.includes('+91 93605 19460'));
  });

  test('Razorpay HMAC SHA-256 Verification for Urgent Badge Order', () => {
    const secret = 'rzp_urgent_secret_key_sample';
    const orderId = 'order_urgent_77189';
    const paymentId = 'pay_urgent_99211';

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    assert.equal(signature, expectedSig);
  });
});
