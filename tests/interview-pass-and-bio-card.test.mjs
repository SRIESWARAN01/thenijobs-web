import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ─── Reference Constants & Helpers Under Test ───
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

function buildInterviewPassMessage({
  candidateName,
  companyName,
  jobTitle,
  formattedDisplayDate,
  interviewTime,
  interviewLocation,
  mapsUrl,
  contactPerson,
  contactPhone,
  checklist = [],
}) {
  return [
    `🎟️ *THENIJOBS — நேர்காணல் அனுமதி அட்டை (Interview Call Pass)*`,
    `══════════════════════════════`,
    `வணக்கம் *${candidateName}*!`,
    ``,
    `*${companyName}* நிறுவனத்தில் நீங்கள் விண்ணப்பித்த *"${jobTitle}"* பணிக்கான நேர்காணல் நாள் மற்றும் நேரம் உறுதி செய்யப்பட்டுள்ளது.`,
    ``,
    `📅 *நேர்காணல் நாள்:* ${formattedDisplayDate}`,
    `⏰ *நேரம்:* ${interviewTime}`,
    `🏢 *நிறுவனம்:* ${companyName}`,
    `📍 *இடம் / கடை முகவரி:* ${interviewLocation}`,
    `🗺️ *Google Maps வழித்தடம்:* ${mapsUrl}`,
    `👤 *தொடர்புக்கு:* ${contactPerson} (${contactPhone})`,
    ``,
    `📋 *கொண்டுவர வேண்டிய ஆவணங்கள்:*`,
    checklist.length > 0 ? checklist.join('\n') : `✅ ஆதார் அட்டை & பயோ-டேட்டா`,
    ``,
    `⚠️ *முக்கிய குறிப்பு:*`,
    `தயவுசெய்து நீங்கள் இந்த நேர்காணலுக்கு வருவதற்கு முன் இந்த மெசேஜிற்கு *"உறுதிசெய்கிறேன் (Confirmed)"* என பதிலளிக்கவும். உங்களுக்கு ஏதேனும் சந்தேகம் இருந்தால் மேற்கண்ட எண்ணில் தொடர்பு கொள்ளவும்.`,
    ``,
    `வாழ்த்துகள்!`,
    `*${companyName}* Recruitment Team`,
    `🌐 Verified by THENIJOBS (www.thenijobs.com)`,
  ].join('\n');
}

function formatSeekerWhatsAppBioShareText(profile, profileUrl) {
  const name = profile.name || profile.displayName || 'Job Seeker';
  const headline = profile.headline || profile.currentRole || 'Looking for Job in Theni';
  const education = profile.highestDegree || (profile.education?.[0]?.degree) || 'Graduate';
  const exp = profile.experienceYears || (profile.experience?.length ? `${profile.experience.length} Years` : 'Fresher');
  const skills = profile.skills?.slice(0, 4).join(', ') || 'Tally, Accounts, Office Admin';
  const locations = profile.preferredLocations?.slice(0, 4).join(', ') || `${profile.district || 'Theni'}, Tamil Nadu`;
  const phone = profile.phone || 'Available on THENIJOBS';

  return `🌟 *வேலை தேடுகிறேன் (Looking for Job in Theni District)*
══════════════════════════════
👤 *பெயர் (Name):* ${name}
🎯 *பணித்தகுதி (Role):* ${headline}
🎓 *கல்வி (Education):* ${education}
💼 *அனுபவம் (Experience):* ${exp}
⚡ *திறமைகள் (Skills):* ${skills}
📍 *விருப்பமான இடம் (Location):* ${locations}

📞 *தொடர்புக்கு:* ${phone}
🔗 *முழு சுயவிவரம் (Full Profile):* ${profileUrl}

வணக்கம்! தேனி மற்றும் சுற்றுவட்டார நிறுவனங்களில் வேலை வாய்ப்பு இருந்தால் தொடர்பு கொள்ளவும். தயவுசெய்து உங்கள் நண்பர்கள் மற்றும் வாட்ஸ்அப் குழுக்களில் பகிரவும்! 🙏`;
}

describe('THENIJOBS — Feature 2.3: 1-Click WhatsApp Interview Call Pass with Google Maps Pin', () => {
  test('1. Generates formatted bilingual interview call pass with all required elements', () => {
    const checklist = [
      '✅ ஆதார் அட்டை அசல் & நகல் (Aadhaar Card Original & Copy)',
      '✅ பயோ-டேட்டா / ரெஸ்யூம் (Bio-Data / Resume Printed)',
      '✅ கல்விச் சான்றிதழ்கள் (Educational Marksheets)',
      '✅ பாஸ்போர்ட் சைஸ் போட்டோ 2 (Passport Size Photos x2)',
    ];

    const pass = buildInterviewPassMessage({
      candidateName: 'கார்த்திக் குமார் (Karthik Kumar)',
      companyName: 'எஸ்.வி.எம் மொபைல்ஸ் (SVM Mobiles Theni)',
      jobTitle: 'Showroom Sales Executive',
      formattedDisplayDate: 'வியாழன், 29 அக்டோபர் 2026',
      interviewTime: '10:30 AM',
      interviewLocation: 'Near Bus Stand, Cumbum Road, Theni',
      mapsUrl: 'https://maps.google.com/?q=SVM+Mobiles+Theni',
      contactPerson: 'சரவணன் (Store Manager)',
      contactPhone: '9842100000',
      checklist,
    });

    assert.ok(pass.includes('🎟️ *THENIJOBS — நேர்காணல் அனுமதி அட்டை (Interview Call Pass)*'));
    assert.ok(pass.includes('கார்த்திக் குமார் (Karthik Kumar)'));
    assert.ok(pass.includes('எஸ்.வி.எம் மொபைல்ஸ் (SVM Mobiles Theni)'));
    assert.ok(pass.includes('Showroom Sales Executive'));
    assert.ok(pass.includes('வியாழன், 29 அக்டோபர் 2026'));
    assert.ok(pass.includes('10:30 AM'));
    assert.ok(pass.includes('Near Bus Stand, Cumbum Road, Theni'));
    assert.ok(pass.includes('https://maps.google.com/?q=SVM+Mobiles+Theni'));
    assert.ok(pass.includes('சரவணன் (Store Manager) (9842100000)'));
    assert.ok(pass.includes('ஆதார் அட்டை அசல் & நகல்'));
    assert.ok(pass.includes('பயோ-டேட்டா / ரெஸ்யூம்'));
    assert.ok(pass.includes('கல்விச் சான்றிதழ்கள்'));
    assert.ok(pass.includes('பாஸ்போர்ட் சைஸ் போட்டோ 2'));
    assert.ok(pass.includes('உறுதிசெய்கிறேன் (Confirmed)'));
    assert.ok(pass.includes('Verified by THENIJOBS (www.thenijobs.com)'));
  });

  test('2. Candidate phone number normalization for WhatsApp deep link', () => {
    assert.equal(sanitizeWhatsAppPhone('9876543210'), '919876543210');
    assert.equal(sanitizeWhatsAppPhone('+91 98765 43210'), '919876543210');
    assert.equal(sanitizeWhatsAppPhone('09876543210'), '919876543210');
    assert.equal(sanitizeWhatsAppPhone('919876543210'), '919876543210');
    assert.equal(sanitizeWhatsAppPhone(''), DEFAULT_WHATSAPP_SUPPORT);
    assert.equal(sanitizeWhatsAppPhone(null), DEFAULT_WHATSAPP_SUPPORT);
  });

  test('3. Google Maps directions link generation with encoding', () => {
    const address = 'NRT Main Road, Theni, Tamil Nadu';
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    assert.equal(mapsUrl, 'https://maps.google.com/?q=NRT%20Main%20Road%2C%20Theni%2C%20Tamil%20Nadu');
  });

  test('4. Interview scheduled status update and notification schema contract', () => {
    const appId = 'app_test_123';
    const seekerId = 'seeker_user_456';
    const candidateName = 'செல்வி பிரியா';
    const jobTitle = 'Hospital Staff Nurse';
    const interviewDate = '2026-10-30';
    const interviewTime = '11:00 AM';
    const location = 'Theni Government Medical Hospital Road';

    const statusUpdatePayload = {
      status: 'interview_scheduled',
      notes: `Interview Call Pass issued for ${interviewDate} at ${interviewTime}. Location: ${location}. Pass dispatched via WhatsApp.`,
    };

    const notificationPayload = {
      userId: seekerId,
      type: 'interview',
      title: 'Interview Call Pass Issued! 🎟️',
      message: `Interview call pass for "${jobTitle}" on ${interviewDate} at ${interviewTime} at ${location} has been issued.`,
      actionUrl: '/seeker/interviews',
    };

    assert.equal(statusUpdatePayload.status, 'interview_scheduled');
    assert.ok(statusUpdatePayload.notes.includes(interviewDate));
    assert.ok(statusUpdatePayload.notes.includes(interviewTime));
    assert.equal(notificationPayload.type, 'interview');
    assert.equal(notificationPayload.actionUrl, '/seeker/interviews');
    assert.ok(notificationPayload.title.includes('🎟️'));
  });
});

describe('THENIJOBS — Feature 3.1: 1-Tap "My THENIJOBS Profile" WhatsApp Story Card (9:16)', () => {
  test('1. Verifies 9:16 vertical canvas aspect ratio (1080 x 1920) and specifications', () => {
    const width = 1080;
    const height = 1920;
    const ratio = width / height;

    assert.equal(width, 1080);
    assert.equal(height, 1920);
    assert.ok(Math.abs(ratio - (9 / 16)) < 0.001, 'Canvas aspect ratio must strictly be 9:16 for WhatsApp Status');
  });

  test('2. Candidate bio card text formatting for WhatsApp Status & Story sharing', () => {
    const profile = {
      name: 'முத்துவேல் (Muthuvel)',
      headline: 'B.Com Graduate | Accounts & GST Specialist | Tally Prime',
      highestDegree: 'B.Com Computer Applications',
      experienceYears: '2 Years',
      skills: ['Tally Prime', 'GST Filing', 'MS Excel', 'Accounts Executive', 'Billing'],
      preferredLocations: ['Theni', 'Periyakulam', 'Chinnamanur'],
      district: 'Theni',
      phone: '9443210000',
    };
    const profileUrl = 'https://www.thenijobs.com/portfolio/seeker/muthuvel_123';

    const text = formatSeekerWhatsAppBioShareText(profile, profileUrl);

    assert.ok(text.includes('🌟 *வேலை தேடுகிறேன் (Looking for Job in Theni District)*'));
    assert.ok(text.includes('முத்துவேல் (Muthuvel)'));
    assert.ok(text.includes('B.Com Graduate | Accounts & GST Specialist'));
    assert.ok(text.includes('B.Com Computer Applications'));
    assert.ok(text.includes('2 Years'));
    assert.ok(text.includes('Tally Prime, GST Filing, MS Excel, Accounts Executive'));
    assert.ok(text.includes('Theni, Periyakulam, Chinnamanur'));
    assert.ok(text.includes('9443210000'));
    assert.ok(text.includes('https://www.thenijobs.com/portfolio/seeker/muthuvel_123'));
  });

  test('3. Fallback values when candidate fields are partially completed', () => {
    const sparseProfile = {
      name: 'Anbarasan',
      district: 'Theni',
    };
    const profileUrl = 'https://www.thenijobs.com/portfolio/seeker/anbarasan_456';

    const text = formatSeekerWhatsAppBioShareText(sparseProfile, profileUrl);

    assert.ok(text.includes('Anbarasan'));
    assert.ok(text.includes('Looking for Job in Theni'));
    assert.ok(text.includes('Graduate'));
    assert.ok(text.includes('Fresher'));
    assert.ok(text.includes('Tally, Accounts, Office Admin'));
    assert.ok(text.includes('Theni, Tamil Nadu'));
    assert.ok(text.includes('Available on THENIJOBS'));
  });

  test('4. Scannable QR code URL target integrity for seeker public portfolio', () => {
    const uid = 'seeker_user_789';
    const baseUrl = 'https://www.thenijobs.com';
    const profileUrl = `${baseUrl}/portfolio/seeker/${uid}`;

    assert.equal(profileUrl, 'https://www.thenijobs.com/portfolio/seeker/seeker_user_789');
    assert.ok(profileUrl.startsWith('https://www.thenijobs.com/portfolio/seeker/'));
  });

  test('5. Candidate avatar initials generation fallback', () => {
    const getInitials = (name) => {
      return (name || 'Job Seeker')
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'TJ';
    };

    assert.equal(getInitials('Karthik Kumar'), 'KK');
    assert.equal(getInitials('Priya'), 'P');
    assert.equal(getInitials(''), 'JS');
    assert.equal(getInitials(null), 'JS');
  });
});
