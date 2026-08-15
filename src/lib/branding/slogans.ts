/**
 * THENIJOBS — Dynamic Personal & Business Growth Slogans Engine
 * Generates tailored, positive, non-repetitive motivational growth slogans
 * for Job Seekers, Companies/Businesses, and Official Billing Receipts.
 */

// ─── 1. JOB SEEKER CAREER GROWTH SLOGANS ──────────────────────────────────
const SEEKER_ROLE_SLOGANS: Record<string, string[]> = {
  software: [
    "Turning complex logic into seamless, high-impact digital solutions.",
    "Passionate about clean code, scalable architecture, and continuous learning.",
    "Innovating user experiences with precision and modern technology."
  ],
  sales: [
    "Driven by genuine relationships, delivering measurable business growth.",
    "Connecting customer needs with value-driven solutions and trust.",
    "Energetic communicator focused on closing deals and client success."
  ],
  marketing: [
    "Crafting compelling brand narratives that inspire engagement and action.",
    "Data-driven marketing mindset paired with creative storytelling.",
    "Amplifying brand reach across digital and regional channels."
  ],
  accounting: [
    "Precision in financial numbers, unwavering integrity in action.",
    "Transforming fiscal data into clear, strategic business insights.",
    "Meticulous compliance, accurate ledger management, and financial discipline."
  ],
  engineering: [
    "Dedicated to precision engineering, problem solving, and quality craft.",
    "Designing robust systems that stand the test of time and performance.",
    "Applying technical ingenuity to solve real-world industrial challenges."
  ],
  agriculture: [
    "Grounded in hard work, cultivating sustainable prosperity from the soil.",
    "Bringing modern agricultural practices to regional farm productivity.",
    "Passionate about farming excellence, agro-management, and high yields."
  ],
  healthcare: [
    "Dedicated to patient well-being, driven by clinical empathy and care.",
    "Upholding the highest standards of healthcare support and compassionate service.",
    "Committed to community wellness, rapid response, and healing."
  ],
  education: [
    "Inspiring curious minds and nurturing future leaders with patience.",
    "Fostering knowledge, critical thinking, and character in learners.",
    "Dedicated to educational excellence and lifelong mentorship."
  ],
  hospitality: [
    "Delivering warm hospitality, impeccable service, and memorable guest experiences.",
    "Creating welcoming environments with culinary and service excellence.",
    "Attentive to every detail for superior customer satisfaction."
  ],
  driving: [
    "Committed to safe transit, timely logistics, and road discipline.",
    "Reliable transport management with safety-first priority across routes.",
    "Navigating with vigilance, punctuality, and vehicle care."
  ],
  management: [
    "Empowering high-performing teams to achieve shared organizational milestones.",
    "Strategic leadership focused on operational efficiency and sustainable growth.",
    "Fostering collaborative culture, accountability, and excellence."
  ],
  default: [
    "Committed to professional excellence, integrity, and continuous career growth.",
    "Turning ambition into measurable achievement through dedicated hard work.",
    "Passionate learner and proactive contributor ready to deliver results.",
    "Dedicated to mastering skills and adding tangible value to organizational goals.",
    "Bridging capability with dedication to build a successful career path."
  ]
};

// ─── 2. COMPANY & BUSINESS GROWTH SLOGANS ─────────────────────────────────
const COMPANY_CATEGORY_SLOGANS: Record<string, string[]> = {
  agriculture: [
    "Nurturing the soil, empowering Tamil Nadu's agricultural prosperity.",
    "Delivering farm-fresh quality and modern agricultural services.",
    "Sustainable agro-solutions supporting farmers and food security."
  ],
  textiles: [
    "Weaving quality, craftsmanship, and textile excellence for every home.",
    "Premium cotton fabrics and garments crafted with regional mastery.",
    "Blending traditional textile heritage with modern garment innovation."
  ],
  it: [
    "Innovating digital frontiers from regional roots to global reach.",
    "Empowering businesses with custom software and reliable digital solutions.",
    "Accelerating enterprise digital transformation through smart technology."
  ],
  retail: [
    "Trusted local retail, bringing quality products and value to every family.",
    "Your neighborhood marketplace for authentic quality, savings, and service.",
    "Serving our community with integrity, wide variety, and customer satisfaction."
  ],
  healthcare: [
    "Compassionate medical care and trusted wellness services for the region.",
    "Advanced diagnostics, healing touch, and accessible healthcare for all.",
    "Dedicated to healthier families and clinical excellence in Theni."
  ],
  manufacturing: [
    "Precision industrial engineering, powering Tamil Nadu's manufacturing backbone.",
    "High-grade production, stringent quality control, and dependable supply.",
    "Building industrial strength through innovation, efficiency, and skilled labor."
  ],
  construction: [
    "Constructing durable foundations and modern infrastructure for tomorrow.",
    "Engineering excellence in civil construction, safety, and architectural quality.",
    "Transforming blueprints into enduring landmarks and vibrant spaces."
  ],
  education: [
    "Illuminating young minds and nurturing academic excellence.",
    "Empowering students with practical skills, knowledge, and career readiness.",
    "A legacy of quality learning, character building, and future leadership."
  ],
  hotel: [
    "Authentic regional flavors, welcoming stays, and celebrated hospitality.",
    "Serving memorable culinary delights with hygiene, taste, and tradition.",
    "Your preferred destination for comfort, celebration, and taste in Theni."
  ],
  automobile: [
    "Reliable mobility, expert automotive care, and smooth journeys.",
    "Keeping commerce moving with dependable fleet and vehicle services.",
    "Precision automotive mechanics, genuine spares, and trusted road safety."
  ],
  finance: [
    "Securing financial prosperity and empowering enterprise dreams.",
    "Trusted financial guidance, accessible credit, and wealth protection.",
    "Partnering in your financial security and regional business expansion."
  ],
  default: [
    "Empowering local commerce, driving sustainable economic growth across Theni.",
    "Committed to quality service, ethical business practices, and customer trust.",
    "Building community prosperity through dependable services and local hiring.",
    "Dedicated to operational excellence, client satisfaction, and local talent growth."
  ]
};

// ─── 3. BILLING & PAYMENT RECEIPT SLOGANS ─────────────────────────────────
const RECEIPT_PLAN_SLOGANS: Record<string, string[]> = {
  standard: [
    "Empowering Your Local Hiring — Connecting Verified Talent with Growing Businesses.",
    "Fueling Business Momentum — Building Stronger Teams in Tamil Nadu.",
    "Your Growth Partner — Unlocking Verified Local Candidates for Your Workforce."
  ],
  premium: [
    "Accelerating Enterprise Expansion — Building Exceptional Teams Across Tamil Nadu.",
    "Strategic Workforce Partnership — Scaling Your Business with Top Tier Local Talent.",
    "Empowering Regional Industry Leadership with Advanced Candidate Reach."
  ],
  enterprise: [
    "Workforce Excellence & Market Leadership — Powering Large-Scale Regional Growth.",
    "Premier Enterprise Partner — Seamless Hiring, Verified Credibility, and Maximum Reach.",
    "Building the Future of Regional Commerce with Unmatched Candidate Sourcing."
  ],
  default: [
    "Thank You for Partnering with THENIJOBS — Empowering Regional Growth and Local Employment.",
    "Investing in Verified Local Talent — Driving Enterprise Success Across Tamil Nadu.",
    "Your Verified Recruitment Partner — Building Opportunities, Transforming Careers."
  ]
};

// Deterministic string hash helper to ensure the same user/company always gets a consistent, unique slogan
function getStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a unique, positive personal growth slogan for a Job Seeker
 */
export function getSeekerGrowthSlogan(seeker: { name?: string; currentRole?: string; skills?: string[]; uid?: string }): string {
  const roleText = `${seeker.currentRole || ''} ${(seeker.skills || []).join(' ')}`.toLowerCase();
  let pool = SEEKER_ROLE_SLOGANS.default;

  if (roleText.includes('developer') || roleText.includes('software') || roleText.includes('it') || roleText.includes('web') || roleText.includes('code') || roleText.includes('computer')) {
    pool = SEEKER_ROLE_SLOGANS.software;
  } else if (roleText.includes('sales') || roleText.includes('business development') || roleText.includes('telecaller')) {
    pool = SEEKER_ROLE_SLOGANS.sales;
  } else if (roleText.includes('market') || roleText.includes('digital') || roleText.includes('content') || roleText.includes('seo')) {
    pool = SEEKER_ROLE_SLOGANS.marketing;
  } else if (roleText.includes('account') || roleText.includes('tally') || roleText.includes('gst') || roleText.includes('finance') || roleText.includes('audit')) {
    pool = SEEKER_ROLE_SLOGANS.accounting;
  } else if (roleText.includes('engineer') || roleText.includes('mechanical') || roleText.includes('electrical') || roleText.includes('civil') || roleText.includes('autocad')) {
    pool = SEEKER_ROLE_SLOGANS.engineering;
  } else if (roleText.includes('farm') || roleText.includes('agri') || roleText.includes('plantation')) {
    pool = SEEKER_ROLE_SLOGANS.agriculture;
  } else if (roleText.includes('nurse') || roleText.includes('health') || roleText.includes('doctor') || roleText.includes('clinic') || roleText.includes('pharmacy')) {
    pool = SEEKER_ROLE_SLOGANS.healthcare;
  } else if (roleText.includes('teach') || roleText.includes('educat') || roleText.includes('professor') || roleText.includes('tutor') || roleText.includes('school')) {
    pool = SEEKER_ROLE_SLOGANS.education;
  } else if (roleText.includes('hotel') || roleText.includes('cook') || roleText.includes('chef') || roleText.includes('food') || roleText.includes('restaurant') || roleText.includes('hospitality')) {
    pool = SEEKER_ROLE_SLOGANS.hospitality;
  } else if (roleText.includes('driver') || roleText.includes('driving') || roleText.includes('tractor') || roleText.includes('transport') || roleText.includes('logistics')) {
    pool = SEEKER_ROLE_SLOGANS.driving;
  } else if (roleText.includes('manage') || roleText.includes('supervisor') || roleText.includes('lead') || roleText.includes('officer')) {
    pool = SEEKER_ROLE_SLOGANS.management;
  }

  const seed = seeker.uid || seeker.name || 'seeker';
  const idx = getStringHash(seed) % pool.length;
  return pool[idx];
}

/**
 * Returns a unique, positive business growth slogan for a Company
 */
export function getCompanyGrowthSlogan(company: { name?: string; category?: string; services?: string[]; id?: string; slug?: string }): string {
  const catText = `${company.category || ''} ${(company.services || []).join(' ')}`.toLowerCase();
  let pool = COMPANY_CATEGORY_SLOGANS.default;

  if (catText.includes('agri') || catText.includes('farm')) {
    pool = COMPANY_CATEGORY_SLOGANS.agriculture;
  } else if (catText.includes('textile') || catText.includes('garment') || catText.includes('cotton') || catText.includes('cloth') || catText.includes('spinning')) {
    pool = COMPANY_CATEGORY_SLOGANS.textiles;
  } else if (catText.includes('it') || catText.includes('software') || catText.includes('digital') || catText.includes('tech')) {
    pool = COMPANY_CATEGORY_SLOGANS.it;
  } else if (catText.includes('retail') || catText.includes('shop') || catText.includes('store') || catText.includes('supermarket') || catText.includes('wholesale')) {
    pool = COMPANY_CATEGORY_SLOGANS.retail;
  } else if (catText.includes('health') || catText.includes('hospital') || catText.includes('clinic') || catText.includes('medical') || catText.includes('pharma')) {
    pool = COMPANY_CATEGORY_SLOGANS.healthcare;
  } else if (catText.includes('manufactur') || catText.includes('industry') || catText.includes('factory')) {
    pool = COMPANY_CATEGORY_SLOGANS.manufacturing;
  } else if (catText.includes('construct') || catText.includes('real estate') || catText.includes('builder')) {
    pool = COMPANY_CATEGORY_SLOGANS.construction;
  } else if (catText.includes('educat') || catText.includes('school') || catText.includes('college') || catText.includes('training')) {
    pool = COMPANY_CATEGORY_SLOGANS.education;
  } else if (catText.includes('hotel') || catText.includes('food') || catText.includes('restaurant') || catText.includes('catering') || catText.includes('bakery')) {
    pool = COMPANY_CATEGORY_SLOGANS.hotel;
  } else if (catText.includes('auto') || catText.includes('transport') || catText.includes('vehicle') || catText.includes('travels') || catText.includes('logistics')) {
    pool = COMPANY_CATEGORY_SLOGANS.automobile;
  } else if (catText.includes('bank') || catText.includes('finance') || catText.includes('insurance') || catText.includes('loan')) {
    pool = COMPANY_CATEGORY_SLOGANS.finance;
  }

  const seed = company.id || company.slug || company.name || 'company';
  const idx = getStringHash(seed) % pool.length;
  return pool[idx];
}

/**
 * Returns a tailored enterprise growth & support slogan for Payment Invoices & Receipts
 */
export function getReceiptGrowthSlogan(planSlug?: string, orderId?: string): string {
  const slug = (planSlug || 'standard').toLowerCase();
  let pool = RECEIPT_PLAN_SLOGANS.default;

  if (slug.includes('standard') || slug.includes('basic')) {
    pool = RECEIPT_PLAN_SLOGANS.standard;
  } else if (slug.includes('premium')) {
    pool = RECEIPT_PLAN_SLOGANS.premium;
  } else if (slug.includes('enterprise')) {
    pool = RECEIPT_PLAN_SLOGANS.enterprise;
  }

  const seed = orderId || slug || 'receipt';
  const idx = getStringHash(seed) % pool.length;
  return pool[idx];
}
