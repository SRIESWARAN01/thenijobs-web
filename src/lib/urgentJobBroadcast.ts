import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

export interface TalukChannelInfo {
  slug: string;
  name: string;
  tamilName: string;
  channelName: string;
  channelTamilName: string;
  channelUrl: string;
}

export const TALUK_WHATSAPP_CHANNELS: Record<string, TalukChannelInfo> = {
  theni: {
    slug: 'theni',
    name: 'Theni Taluk',
    tamilName: 'தேனி தாலுகா',
    channelName: 'THENIJOBS – Theni Taluk Urgent Alert Channel',
    channelTamilName: 'தேனி தாலுகா அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    channelUrl: 'https://whatsapp.com/channel/theni-taluk-alerts',
  },
  periyakulam: {
    slug: 'periyakulam',
    name: 'Periyakulam Taluk',
    tamilName: 'பெரியகுளம் தாலுகா',
    channelName: 'THENIJOBS – Periyakulam Taluk Urgent Alert Channel',
    channelTamilName: 'பெரியகுளம் தாலுகா அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    channelUrl: 'https://whatsapp.com/channel/periyakulam-taluk-alerts',
  },
  cumbum: {
    slug: 'cumbum',
    name: 'Cumbum Valley Taluk',
    tamilName: 'கம்பம் பள்ளத்தாக்கு',
    channelName: 'THENIJOBS – Cumbum Valley Urgent Alert Channel',
    channelTamilName: 'கம்பம் பள்ளத்தாக்கு அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    channelUrl: 'https://whatsapp.com/channel/cumbum-taluk-alerts',
  },
  bodinayakanur: {
    slug: 'bodinayakanur',
    name: 'Bodinayakanur Taluk',
    tamilName: 'போடிநாயக்கனூர் தாலுகா',
    channelName: 'THENIJOBS – Bodinayakanur Urgent Alert Channel',
    channelTamilName: 'போடிநாயக்கனூர் அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    channelUrl: 'https://whatsapp.com/channel/bodi-taluk-alerts',
  },
  uthamapalayam: {
    slug: 'uthamapalayam',
    name: 'Uthamapalayam Taluk',
    tamilName: 'உத்தமபாளையம் தாலுகா',
    channelName: 'THENIJOBS – Uthamapalayam Urgent Alert Channel',
    channelTamilName: 'உத்தமபாளையம் அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    channelUrl: 'https://whatsapp.com/channel/uthamapalayam-taluk-alerts',
  },
  andipatti: {
    slug: 'andipatti',
    name: 'Andipatti Taluk',
    tamilName: 'ஆண்டிபட்டி தாலுகா',
    channelName: 'THENIJOBS – Andipatti Urgent Alert Channel',
    channelTamilName: 'ஆண்டிபட்டி அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    channelUrl: 'https://whatsapp.com/channel/andipatti-taluk-alerts',
  },
  chinnamanur: {
    slug: 'chinnamanur',
    name: 'Chinnamanur Taluk',
    tamilName: 'சின்னமனூர் தாலுகா',
    channelName: 'THENIJOBS – Chinnamanur Urgent Alert Channel',
    channelTamilName: 'சின்னமனூர் அவசர வேலைவாய்ப்பு எச்சரிக்கை',
    channelUrl: 'https://whatsapp.com/channel/chinnamanur-taluk-alerts',
  },
  general: {
    slug: 'theni-district',
    name: 'Theni District Central',
    tamilName: 'தேனி மாவட்டம் முழுவதும்',
    channelName: 'THENIJOBS – District-Wide Urgent Job Alerts',
    channelTamilName: 'தேனி மாவட்ட அவசர வேலைவாய்ப்பு நெட்வொர்க்',
    channelUrl: 'https://whatsapp.com/channel/thenijobs-official-alerts',
  },
};

/**
 * Detects the specific Theni taluk from a job's location, district, title or description
 */
export function detectTalukFromJob(job: {
  location?: string;
  district?: string;
  title?: string;
  description?: string;
}): TalukChannelInfo {
  const combined = `${job.location || ''} ${job.district || ''} ${job.title || ''} ${job.description || ''}`.toLowerCase();

  if (combined.includes('periyakulam') || combined.includes('vadugapatti') || combined.includes('devadanapatti')) {
    return TALUK_WHATSAPP_CHANNELS.periyakulam;
  }
  if (combined.includes('cumbum') || combined.includes('kumbum') || combined.includes('gudalur') || combined.includes('surulipatti')) {
    return TALUK_WHATSAPP_CHANNELS.cumbum;
  }
  if (combined.includes('bodi') || combined.includes('bodinayakanur') || combined.includes('kurangani') || combined.includes('silamarathupatti')) {
    return TALUK_WHATSAPP_CHANNELS.bodinayakanur;
  }
  if (combined.includes('uthamapalayam') || combined.includes('kombai') || combined.includes('pannaipuram') || combined.includes('kohanur')) {
    return TALUK_WHATSAPP_CHANNELS.uthamapalayam;
  }
  if (combined.includes('andipatti') || combined.includes('kadamalaikundu') || combined.includes('myladumparai')) {
    return TALUK_WHATSAPP_CHANNELS.andipatti;
  }
  if (combined.includes('chinnamanur') || combined.includes('seepalakottai') || combined.includes('markayankottai')) {
    return TALUK_WHATSAPP_CHANNELS.chinnamanur;
  }
  if (combined.includes('theni') || combined.includes('allinagaram') || combined.includes('veerapandi')) {
    return TALUK_WHATSAPP_CHANNELS.theni;
  }

  return TALUK_WHATSAPP_CHANNELS.general;
}

/**
 * Generates an authoritative, pre-formatted bilingual WhatsApp broadcast message
 * for 48-Hour Urgent Hiring vacancies on THENIJOBS.
 */
export function generateUrgentJobWhatsAppBroadcast(job: {
  id: string;
  title: string;
  companyName?: string;
  company?: { name?: string };
  location: string;
  district?: string;
  salaryMin?: number;
  salaryMax?: number;
  salary?: string;
  openings?: number;
  jobType?: string;
}): string {
  const comp = job.companyName || job.company?.name || 'Local Company';
  const loc = job.location ? `${job.location}, ${job.district || 'Theni'} District` : 'Theni District';
  const taluk = detectTalukFromJob(job);
  
  let salaryText = 'திறமைக்கேற்ற ஊதியம் (Best in Industry)';
  if (job.salary) {
    salaryText = job.salary;
  } else if (job.salaryMin && job.salaryMax) {
    salaryText = `₹${job.salaryMin.toLocaleString('en-IN')} - ₹${job.salaryMax.toLocaleString('en-IN')} / மாதம்`;
  } else if (job.salaryMin) {
    salaryText = `₹${job.salaryMin.toLocaleString('en-IN')}+ / மாதம்`;
  }

  const openingsText = job.openings ? `${job.openings} காலியிடங்கள் (Openings)` : 'உடனடி நியமனம் (Immediate)';
  const typeText = job.jobType ? ` (${job.jobType.replace(/_/g, ' ').toUpperCase()})` : '';

  return `⚡ அவசர ஆட்கள் தேவை! • URGENT REQUIREMENT IN THENI! ⚡
📢 [${taluk.channelTamilName} • ${taluk.name}]

🏢 நிறுவனம் (Company): ${comp}
💼 பதவி (Role): ${job.title}${typeText}
📍 இடம் (Location): ${loc}
💰 சம்பளம் (Salary): ${salaryText}
⏰ காலியிடங்கள்: ${openingsText}
🔥 48 மணி நேர அவசர முன்னுரிமை வேலை (48-Hour Urgent Spotlight)!

👇 உடனடியாக விண்ணப்பிக்க (Apply Now in 1-Tap):
https://www.thenijobs.com/jobs/${job.id}

📲 அவசரமாக வேலை தேடும் உங்கள் நண்பர்களுடன் பகிருங்கள்! (Share with Theni Job Seekers)`;
}

/**
 * Instant auto-broadcasts the 48-hour urgent job to the relevant Taluk WhatsApp Alert Channel
 */
export async function dispatchTalukWhatsAppBroadcast(
  job: {
    id: string;
    title: string;
    companyName?: string;
    company?: { name?: string };
    location: string;
    district?: string;
    salaryMin?: number;
    salaryMax?: number;
    salary?: string;
    openings?: number;
    jobType?: string;
    description?: string;
  },
  options: {
    feePaid: number;
    userId: string;
    paymentId?: string;
  }
) {
  const taluk = detectTalukFromJob(job);
  const broadcastText = generateUrgentJobWhatsAppBroadcast(job);
  const now = new Date();

  const broadcastRecord = {
    jobId: job.id,
    jobTitle: job.title,
    companyName: job.companyName || job.company?.name || 'Local Company',
    location: job.location || 'Theni',
    talukSlug: taluk.slug,
    talukName: taluk.name,
    talukTamilName: taluk.tamilName,
    channelName: taluk.channelName,
    channelUrl: taluk.channelUrl,
    broadcastText,
    feePaid: options.feePaid,
    userId: options.userId,
    paymentId: options.paymentId || '',
    broadcastAt: now.toISOString(),
    status: 'auto_broadcast_dispatched',
    webhookSent: false,
    webhookResponse: null as any,
  };

  // Optional: Trigger external WhatsApp webhook if configured (e.g., Cloud API, Gupshup, Wati)
  const webhookUrl = process.env.TALUK_WHATSAPP_WEBHOOK_URL || process.env.WHATSAPP_ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: taluk.slug,
          channelName: taluk.channelName,
          text: broadcastText,
          jobId: job.id,
          applyUrl: `https://www.thenijobs.com/jobs/${job.id}`,
        }),
      });
      broadcastRecord.webhookSent = resp.ok;
      broadcastRecord.webhookResponse = { status: resp.status, ok: resp.ok };
    } catch (whErr: any) {
      console.warn('[Taluk WhatsApp Webhook Warning]:', whErr.message);
      broadcastRecord.webhookResponse = { error: whErr.message };
    }
  }

  // Record broadcast event in Admin Firestore
  try {
    const db = getAdminFirestore();
    const broadcastRef = db.collection('talukWhatsAppBroadcasts').doc(`${job.id}_${now.getTime()}`);
    await broadcastRef.set(broadcastRecord, { merge: true });
  } catch (fsErr: any) {
    console.error('[Taluk WhatsApp Broadcast Firestore Save Error]:', fsErr.message);
  }

  return {
    success: true,
    taluk,
    broadcastText,
    channelName: taluk.channelName,
    channelTamilName: taluk.channelTamilName,
    channelUrl: taluk.channelUrl,
    directWhatsAppShareUrl: `https://wa.me/?text=${encodeURIComponent(broadcastText)}`,
  };
}
