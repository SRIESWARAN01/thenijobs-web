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

🏢 நிறுவனம் (Company): ${comp}
💼 பதவி (Role): ${job.title}${typeText}
📍 இடம் (Location): ${loc}
💰 சம்பளம் (Salary): ${salaryText}
⏰ காலியிடங்கள்: ${openingsText}
🔥 48 மணி நேர அவசர முன்னுரிமை வேலை (48-Hour Spotlight)!

👇 உடனடியாக விண்ணப்பிக்க (Apply Now in 1-Tap):
https://www.thenijobs.com/jobs/${job.id}

📲 அவசரமாக வேலை தேடும் உங்கள் நண்பர்களுடன் பகிருங்கள்! (Share with Theni Job Seekers)`;
}
