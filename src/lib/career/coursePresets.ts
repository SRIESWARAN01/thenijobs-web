import type { Course, CourseDailyMilestone, CourseDifficulty, CourseLanguage, CourseTargetAudience } from '@/lib/types/careerGrowth';

export interface CoursePreset {
  id: string;
  slug: string;
  title: string;
  titleTamil: string;
  categoryName: string;
  categoryTamil: string;
  totalDays: number;
  hoursPerDay: number;
  dailyPercentageTarget: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: 'tamil' | 'english' | 'both';
  targetAudience: CourseTargetAudience;
  salaryRange: string;
  targetRoles: string[];
  instructorName: string;
  shortDescription: string;
  fullDescription: string;
  learningObjectives: string[];
  prerequisites: string[];
  dailySchedule: CourseDailyMilestone[];
}

/**
 * Calculates deterministic daily cumulative percentage milestones.
 * E.g., for a 10-day course: Day 1: 10%, Day 2: 20%, ..., Day 10: 100%.
 */
export function calculateDailyTargets(totalDays: number): number[] {
  const safeDays = Math.max(1, Math.min(180, totalDays || 7));
  const targets: number[] = [];
  for (let day = 1; day <= safeDays; day++) {
    if (day === safeDays) {
      targets.push(100);
    } else {
      targets.push(Math.round((day / safeDays) * 100));
    }
  }
  return targets;
}

/**
 * Generates an empty / default daily schedule for a given total days count.
 */
export function generateDefaultSchedule(totalDays: number, courseTitle = 'Skill Module'): CourseDailyMilestone[] {
  const safeDays = Math.max(1, Math.min(60, totalDays || 7));
  const targets = calculateDailyTargets(safeDays);
  return Array.from({ length: safeDays }, (_, i) => {
    const day = i + 1;
    return {
      dayNumber: day,
      percentageTarget: targets[i],
      title: `Day ${day}: ${courseTitle} — Part ${day}`,
      description: `Complete today's practical exercises and achieve your ${targets[i]}% course milestone.`,
      keyTakeaway: `Hands-on understanding of Day ${day} concepts and practical implementation.`
    };
  });
}

/**
 * Authoritative 1-Click Launch Presets for THENIJOBS Academy.
 * Tailored for high-demand job categories across Theni, Cumbum, Periyakulam,
 * Bodinayakanur, Chinnamanur, Andipatti, and Uthamapalayam.
 */
export const COURSE_LAUNCH_PRESETS: CoursePreset[] = [
  {
    id: 'preset-tally-gst',
    slug: 'tally-prime-gst-billing-mastery',
    title: 'Tally Prime with GST & E-Way Bill Billing Mastery',
    titleTamil: 'டாலி பிரைம் & ஜிஎஸ்டி பில்லிங் முழுமையான பயிற்சி',
    categoryName: 'Accounting & Finance',
    categoryTamil: 'கணக்கியல் மற்றும் ஜிஎஸ்டி',
    totalDays: 10,
    hoursPerDay: 2,
    dailyPercentageTarget: 10,
    difficulty: 'beginner',
    language: 'both',
    targetAudience: 'all',
    salaryRange: '₹15,000 - ₹24,000 / month',
    targetRoles: ['Junior Accountant', 'GST Billing Clerk', 'Store Cashier', 'Audit Assistant'],
    instructorName: 'THENIJOBS Commercial Faculty',
    shortDescription: 'Master company creation, voucher entry, inventory management, CGST/SGST/IGST tax calculation, and GSTR-1/3B filing for retail and wholesale businesses in Theni.',
    fullDescription: 'A practical, 10-day hands-on mastery program for accounting professionals and job seekers. Covers the complete accounting workflow used by traders, distributors, and textile stores across Theni district.',
    learningObjectives: [
      'Create and configure company accounts and chart of ledgers in Tally Prime',
      'Record sales, purchases, payments, receipts, and journal vouchers with correct HSN/SAC codes',
      'Generate GST-compliant tax invoices, credit notes, and e-Way bills',
      'Reconcile bank accounts, extract Trial Balance, Profit & Loss, and Balance Sheet'
    ],
    prerequisites: ['Basic knowledge of accounting principles (Debit & Credit)', 'Comfort with basic computer keyboard shortcuts'],
    dailySchedule: [
      { dayNumber: 1, percentageTarget: 10, title: 'Day 1: Company Creation & Ledger Hierarchy', description: 'Setting up new company files, financial year config, and creating group ledgers for local businesses.', keyTakeaway: 'Mastering chart of accounts and debit/credit grouping.' },
      { dayNumber: 2, percentageTarget: 20, title: 'Day 2: Stock Items, Units & Inventory Groups', description: 'Stock groups, units of measurement (Nos, Kgs, Litres), and HSN code assignment.', keyTakeaway: 'Inventory catalog management.' },
      { dayNumber: 3, percentageTarget: 30, title: 'Day 3: Purchase Vouchers & Vendor Ledgers', description: 'Recording local and inter-state purchase bills with freight and supplier details.', keyTakeaway: 'Supplier billing entry and verification.' },
      { dayNumber: 4, percentageTarget: 40, title: 'Day 4: Sales Invoice & Cash/Credit Transactions', description: 'Generating retail and wholesale tax invoices with instant printing formats.', keyTakeaway: 'Fast customer invoice generation.' },
      { dayNumber: 5, percentageTarget: 50, title: 'Day 5: GST Configuration (CGST, SGST, IGST)', description: 'Tax ledgers, slab rates (5%, 12%, 18%, 28%), and tax invoice calculations.', keyTakeaway: 'Accurate GST auto-computation.' },
      { dayNumber: 6, percentageTarget: 60, title: 'Day 6: Banking & Payment Reconciliation', description: 'Cheque and UPI payment vouchers, contra entries, and monthly bank reconciliation statement (BRS).', keyTakeaway: 'Zero error bank ledger matching.' },
      { dayNumber: 7, percentageTarget: 70, title: 'Day 7: Debit Notes, Credit Notes & Discounts', description: 'Sales returns, purchase returns, trade discounts, and cash discounts handling.', keyTakeaway: 'Adjustment vouchers and customer ledger adjustment.' },
      { dayNumber: 8, percentageTarget: 80, title: 'Day 8: E-Way Bill Generation & Dispatch Docs', description: 'e-Way bill portal thresholds, transporter ID, vehicle numbers, and portal sync.', keyTakeaway: 'Compliance for goods movement across Tamil Nadu.' },
      { dayNumber: 9, percentageTarget: 90, title: 'Day 9: Financial Reports & GST Return Preview', description: 'Day book inspection, P&L analysis, GSTR-1 and GSTR-3B summary reports.', keyTakeaway: 'Tax audit readiness and management reporting.' },
      { dayNumber: 10, percentageTarget: 100, title: 'Day 10: Practical Case Study, Mock Test & Certification', description: 'Complete 1-month simulated transactions for a Theni wholesale shop, final quiz, and verified certificate issuance.', keyTakeaway: '100% job-ready accounting certification.' }
    ]
  },
  {
    id: 'preset-retail-operations',
    slug: 'retail-store-operations-customer-service',
    title: 'Retail Store Operations, Cash Counter & Customer Experience',
    titleTamil: 'ரீடெய்ல் கடை மேலாண்மை மற்றும் வாடிக்கையாளர் சேவை பயிற்சி',
    categoryName: 'Retail & Store Operations',
    categoryTamil: 'சில்லறை வர்த்தகம் & வாடிக்கையாளர் சேவை',
    totalDays: 7,
    hoursPerDay: 1.5,
    dailyPercentageTarget: 14.3,
    difficulty: 'beginner',
    language: 'tamil',
    targetAudience: 'all',
    salaryRange: '₹12,000 - ₹18,000 / month',
    targetRoles: ['Store Supervisor', 'Cash Counter Executive', 'Showroom Sales Assistant', 'Inventory Assistant'],
    instructorName: 'THENIJOBS Retail Operations Team',
    shortDescription: 'Practical training on barcode scanning, POS billing, shelf stocking, Tamil & English greeting etiquette, dispute handling, and daily cash closing.',
    fullDescription: 'Crafted for supermarkets, textile showrooms, mobile outlets, and department stores across Theni district. Learn how to manage counter queues, handle card/UPI payments, and deliver memorable customer care.',
    learningObjectives: [
      'Operate POS cash registers, barcode scanners, and thermal receipt printers with zero mistakes',
      'Apply professional customer greeting, active listening, and up-selling techniques',
      'Manage FIFO shelf replenishment, expiry rotation, and damage audits',
      'Perform daily shift cash register reconciliation and UPI settlement'
    ],
    prerequisites: ['Polite customer communication in Tamil', 'Basic mental arithmetic'],
    dailySchedule: [
      { dayNumber: 1, percentageTarget: 14, title: 'Day 1: Retail Store Landscape & Customer Warmth', description: 'First impressions, smiling reception, body language, and understanding customer expectations.', keyTakeaway: 'Warm Tamil/English customer greeting.' },
      { dayNumber: 2, percentageTarget: 29, title: 'Day 2: POS Systems, Barcode Scanning & Billing', description: 'Operating POS counters, barcode scanning speed, and entering manual weight/rate items.', keyTakeaway: 'Error-free, rapid customer checkout.' },
      { dayNumber: 3, percentageTarget: 43, title: 'Day 3: Digital Payments (UPI, Cards, EMI) & Cash Safety', description: 'GPay/PhonePe soundbox verification, debit/credit swipe machines, and counterfeit note detection.', keyTakeaway: 'Secure payment collection and cash drawer discipline.' },
      { dayNumber: 4, percentageTarget: 57, title: 'Day 4: Merchandising, FIFO & Stock Rotation', description: 'Display arrangement, expiry date checks, promotional offer tagging, and facing products.', keyTakeaway: 'Visual merchandising and product visibility.' },
      { dayNumber: 5, percentageTarget: 71, title: 'Day 5: Handling Customer Complaints & Product Returns', description: 'De-escalation tactics, exchange policy communication, and retaining dissatisfied shoppers.', keyTakeaway: 'Professional resolution under pressure.' },
      { dayNumber: 6, percentageTarget: 86, title: 'Day 6: Cross-Selling, Add-ons & Store Security', description: 'Recommending complementary products, loss prevention, and shoplifting deterrence.', keyTakeaway: 'Increasing average bill value ethically.' },
      { dayNumber: 7, percentageTarget: 100, title: 'Day 7: Daily Store Closing, Cash Count & Final Assessment', description: 'End-of-day Z-Report, discrepancy matching, handover log, and practical certification exam.', keyTakeaway: 'Verified retail operations credential.' }
    ]
  },
  {
    id: 'preset-office-excel',
    slug: 'office-excel-data-entry-typing-pro',
    title: 'Modern Office Excel, Fast Typing & Data Entry Executive',
    titleTamil: 'அலுவலக எக்செல், தமிழ் & ஆங்கில தட்டச்சு மற்றும் டேட்டா என்ட்ரி',
    categoryName: 'Office Administration',
    categoryTamil: 'அலுவலக நிர்வாகம்',
    totalDays: 5,
    hoursPerDay: 2,
    dailyPercentageTarget: 20,
    difficulty: 'beginner',
    language: 'both',
    targetAudience: 'job_seeker',
    salaryRange: '₹12,000 - ₹17,000 / month',
    targetRoles: ['Office Assistant', 'Data Entry Operator', 'Computer Assistant', 'Front Desk Executive'],
    instructorName: 'THENIJOBS Digital Skills Mentor',
    shortDescription: 'Master Microsoft Excel formulas (VLOOKUP, SUMIFS, Pivot Tables), Google Sheets collaborative workflows, and fast bilingual data entry.',
    fullDescription: 'Everything a candidate needs to succeed as an administrative or data entry staff member in clinics, schools, law offices, transport companies, and government tender agencies in Theni.',
    learningObjectives: [
      'Master essential Excel formulas: VLOOKUP, XLOOKUP, IF, SUMIFS, COUNTIF',
      'Build professional Pivot Tables, summary reports, and data validation drop-downs',
      'Format corporate spreadsheets, invoice templates, and PDF exports',
      'Achieve 30+ WPM typing speed with bilingual Tamil & English input tools'
    ],
    prerequisites: ['Basic familiarity with Windows computer and keyboard'],
    dailySchedule: [
      { dayNumber: 1, percentageTarget: 20, title: 'Day 1: Spreadsheet Navigation & Keyboard Shortcuts', description: 'Speed navigation, cell formatting, freeze panes, copy-paste special, and text-to-columns.', keyTakeaway: 'Fast mouse-free spreadsheet navigation.' },
      { dayNumber: 2, percentageTarget: 40, title: 'Day 2: Essential Mathematical & Text Formulas', description: 'SUM, AVERAGE, CONCATENATE, TRIM, UPPER, LOWER, and Date/Time calculations.', keyTakeaway: 'Automating repetitive data cleaning.' },
      { dayNumber: 3, percentageTarget: 60, title: 'Day 3: Advanced Lookups (VLOOKUP, XLOOKUP & IF)', description: 'Matching product codes, employee IDs, customer records across multiple sheets with zero #N/A errors.', keyTakeaway: 'Cross-sheet database searching.' },
      { dayNumber: 4, percentageTarget: 80, title: 'Day 4: Pivot Tables, Charts & Data Validation', description: 'Generating sales summaries by taluk, creating drop-down lists, and conditional formatting alerts.', keyTakeaway: 'Management dashboards and visual reporting.' },
      { dayNumber: 5, percentageTarget: 100, title: 'Day 5: Real-world Office Project, Speed Typing Test & Exam', description: 'Cleaning a 500-row customer database, bilingual data entry verification, and certificate unlock.', keyTakeaway: 'Certified Office Excel & Data Entry Specialist.' }
    ]
  },
  {
    id: 'preset-field-sales',
    slug: 'field-sales-b2b-whatsapp-marketing',
    title: 'Field Sales, B2B Negotiation & WhatsApp Business Marketing',
    titleTamil: 'பீல்ட் சேல்ஸ், வாட்ஸ்அப் பிசினஸ் & மார்க்கெட்டிங் பயிற்சி',
    categoryName: 'Sales & Business Development',
    categoryTamil: 'விற்பனை மற்றும் சந்தைப்படுத்தல்',
    totalDays: 7,
    hoursPerDay: 1.5,
    dailyPercentageTarget: 14.3,
    difficulty: 'intermediate',
    language: 'both',
    targetAudience: 'all',
    salaryRange: '₹16,000 - ₹30,000 / month + Incentives',
    targetRoles: ['Field Sales Executive', 'Business Development Associate', 'Area Sales Officer', 'Marketing Rep'],
    instructorName: 'THENIJOBS Commercial Growth Lead',
    shortDescription: 'Master cold calling, route planning across Theni taluks, WhatsApp Business catalogs, client pitch meetings, and closing high-margin deals.',
    fullDescription: 'Designed for FMCG, agrochemical, solar, telecom, and consumer electronics distributors across Theni district. Learn how to pitch to business owners, overcome price objections, and maintain lasting client trust.',
    learningObjectives: [
      'Plan daily route beats across Theni, Cumbum, and Periyakulam commercial hubs',
      'Deliver persuasive 60-second elevator pitches and structured product demos',
      'Leverage WhatsApp Business tools: quick replies, product catalogs, and broadcast lists',
      'Overcome price resistance and close orders with structured payment terms'
    ],
    prerequisites: ['Confidence in interpersonal communication', 'Valid two-wheeler driving license (preferred)'],
    dailySchedule: [
      { dayNumber: 1, percentageTarget: 14, title: 'Day 1: Sales Mindset & Regional Market Mapping', description: 'Understanding Theni district retail corridors, dealer hierarchies, and sales metrics.', keyTakeaway: 'Commercial orientation and target clarity.' },
      { dayNumber: 2, percentageTarget: 29, title: 'Day 2: Lead Generation & Cold Outreach', description: 'Finding potential shopkeepers, gatekeeper handling, and securing first meetings.', keyTakeaway: 'Opening conversations with business owners.' },
      { dayNumber: 3, percentageTarget: 43, title: 'Day 3: WhatsApp Business Setup & Digital Catalogs', description: 'Business profiles, product collections, interactive ordering links, and automatic greetings.', keyTakeaway: 'Instant mobile sales collateral.' },
      { dayNumber: 4, percentageTarget: 57, title: 'Day 4: The Art of the Pitch & Demonstration', description: 'Features vs Benefits, customer pain points, and presenting clear profit margins for dealers.', keyTakeaway: 'Compelling commercial value propositions.' },
      { dayNumber: 5, percentageTarget: 71, title: 'Day 5: Handling Objections ("Price High", "Stock Already Full")', description: 'Proven reply frameworks, competitor comparison, and consignment trial strategies.', keyTakeaway: 'Converting skepticism into trial orders.' },
      { dayNumber: 6, percentageTarget: 86, title: 'Day 6: Payment Terms, Invoicing & Repeat Reorders', description: 'Securing advance payments, credit period limits, and cultivating monthly order rhythms.', keyTakeaway: 'Healthy cash collections and low default rates.' },
      { dayNumber: 7, percentageTarget: 100, title: 'Day 7: Live Mock Pitch, Sales Plan Submission & Certification', description: 'Simulated dealer pitch presentation, feedback review, and verified certificate issuance.', keyTakeaway: 'Certified Field Sales & Business Development Pro.' }
    ]
  },
  {
    id: 'preset-ev-mechanic',
    slug: 'two-wheeler-ev-diagnostic-technician',
    title: 'Two-Wheeler & Electric Vehicle (EV) Diagnostic Technician',
    titleTamil: 'இருசக்கர வாகனம் & எலக்ட்ரிக் வாகனம் (EV) பழுதுநீக்கும் பயிற்சி',
    categoryName: 'Automobile & Electrical',
    categoryTamil: 'ஆட்டோமொபைல் & எலக்ட்ரிக்கல்',
    totalDays: 10,
    hoursPerDay: 2,
    dailyPercentageTarget: 10,
    difficulty: 'intermediate',
    language: 'tamil',
    targetAudience: 'all',
    salaryRange: '₹15,000 - ₹26,000 / month',
    targetRoles: ['EV Service Technician', 'Workshop Mechanic', 'Battery Assembly Assistant', 'Automotive Electrician'],
    instructorName: 'THENIJOBS Technical Workshop Master',
    shortDescription: 'Hands-on practical understanding of BLDC hub motors, lithium-ion battery management systems (BMS), controller troubleshooting, and wiring diagnostics.',
    fullDescription: 'With rapid EV adoption across Theni and Cumbum valley, certified EV mechanics are in extreme shortage. This 10-day structured syllabus transforms traditional mechanics and young technicians into certified EV specialists.',
    learningObjectives: [
      'Diagnose BLDC hub motor hall sensors and stator windings using digital multimeters',
      'Understand Lithium-Ion (LFP / NMC) battery pack safety, cell balancing, and BMS fault codes',
      'Troubleshoot motor controllers, throttle wiring, brake cut-offs, and DC-DC converters',
      'Follow workshop electrical safety protocols and high-voltage isolation procedures'
    ],
    prerequisites: ['Basic understanding of electrical circuits (Voltage, Current, Resistance)'],
    dailySchedule: [
      { dayNumber: 1, percentageTarget: 10, title: 'Day 1: EV Architecture vs ICE Two-Wheelers', description: 'Key components: battery pack, motor, controller, throttle, and instrument cluster.', keyTakeaway: 'Complete EV drivetrain mental model.' },
      { dayNumber: 2, percentageTarget: 20, title: 'Day 2: Battery Chemistry & BMS Architecture', description: 'LFP vs NMC cells, cell capacity (Ah), C-rates, and BMS protective cutoffs.', keyTakeaway: 'Safe battery pack diagnosis.' },
      { dayNumber: 3, percentageTarget: 30, title: 'Day 3: Multimeter Mastery & Wire Harness Tracing', description: 'Measuring DC voltage drop, continuity testing, and locating short circuits.', keyTakeaway: 'Rapid electrical fault isolation.' },
      { dayNumber: 4, percentageTarget: 40, title: 'Day 4: BLDC Motor Operation & Hall Sensor Testing', description: 'Stator, rotor magnets, three phase wires, and verifying 5V hall sensor pulses.', keyTakeaway: 'Motor inspection without dismantling.' },
      { dayNumber: 5, percentageTarget: 50, title: 'Day 5: Motor Controller Wiring & Pinout Mapping', description: 'Ignition wire, throttle 0-5V rail, brake low/high cut-offs, and reverse function.', keyTakeaway: 'Controller diagnostic testing.' },
      { dayNumber: 6, percentageTarget: 60, title: 'Day 6: Throttle, Speed Sensor & Lighting Circuits', description: 'Hall effect throttles, speed display wiring, horn, indicators, and 12V DC converter.', keyTakeaway: 'Accessory wiring repair.' },
      { dayNumber: 7, percentageTarget: 70, title: 'Day 7: Battery Charging Systems & Smart Chargers', description: 'CC/CV charging curves, charger cut-off voltages, socket heat inspection, and fire safety.', keyTakeaway: 'Safe charging diagnostics.' },
      { dayNumber: 8, percentageTarget: 80, title: 'Day 8: Common Error Symptoms & On-Road Breakdown Repair', description: 'Vehicle not moving, motor jerking, sudden battery percentage drop, and brake switch lock.', keyTakeaway: 'Fast turnaround troubleshooting.' },
      { dayNumber: 9, percentageTarget: 90, title: 'Day 9: Preventive Maintenance & Service Checklists', description: 'Water wash precautions, connector grease, wheel bearing checks, and tyre pressure impact.', keyTakeaway: 'Comprehensive periodic service protocol.' },
      { dayNumber: 10, percentageTarget: 100, title: 'Day 10: Practical Fault Diagnosis Test & Official Certification', description: 'Troubleshoot simulated fault rigs, complete safety assessment, and receive verified certificate.', keyTakeaway: 'Certified Two-Wheeler EV Technician.' }
    ]
  },
  {
    id: 'preset-hospital-reception',
    slug: 'hospital-front-desk-healthcare-coordination',
    title: 'Hospital Front-Desk, Patient Care & Clinic Receptionist',
    titleTamil: 'மருத்துவமனை வரவேற்பு மற்றும் நோயாளி ஒருங்கிணைப்பு பயிற்சி',
    categoryName: 'Healthcare & Nursing',
    categoryTamil: 'மருத்துவம் மற்றும் சுகாதார பராமரிப்பு',
    totalDays: 7,
    hoursPerDay: 1.5,
    dailyPercentageTarget: 14.3,
    difficulty: 'beginner',
    language: 'both',
    targetAudience: 'job_seeker',
    salaryRange: '₹12,000 - ₹19,000 / month',
    targetRoles: ['Hospital Receptionist', 'Clinic Front Desk Executive', 'OPD Coordinator', 'Patient Billing Clerk'],
    instructorName: 'THENIJOBS Healthcare Care Lead',
    shortDescription: 'Master patient registration, appointment scheduling, health insurance coordination, compassionate communication, and confidential record management.',
    fullDescription: 'Clinics, diagnostic labs, and multi-specialty hospitals in Theni, Cumbum, and Periyakulam seek trained front-desk staff who handle anxious patients with calm empathy, polite Tamil, and efficient computer skills.',
    learningObjectives: [
      'Manage Out-Patient (OP) and In-Patient (IP) registration workflows with zero data entry errors',
      'Explain doctor schedules, consultation fees, and diagnostic test preparation to patients',
      'Handle Chief Minister Comprehensive Health Insurance Scheme (CMCHIS) & TPA paperwork basics',
      'Maintain patient confidentiality, emergency triage coordination, and telephone etiquette'
    ],
    prerequisites: ['Empathetic customer communication', 'Basic English reading for medical prescription terms'],
    dailySchedule: [
      { dayNumber: 1, percentageTarget: 14, title: 'Day 1: Healthcare Ethics & Compassionate Reception', description: 'Patient psychology, handling patient anxiety, respectful Tamil greeting, and professional grooming.', keyTakeaway: 'Reassuring first contact for patients.' },
      { dayNumber: 2, percentageTarget: 29, title: 'Day 2: OPD Registration & Doctor Token Systems', description: 'Collecting patient details, generating unique Hospital Identification Numbers (UHID), and token queueing.', keyTakeaway: 'Smooth out-patient flow management.' },
      { dayNumber: 3, percentageTarget: 43, title: 'Day 3: Medical Terminology & Prescription Reading', description: 'Common departments (Cardio, Ortho, Neuro, Gynae, Paediatrics) and reading doctor advice slips.', keyTakeaway: 'Accurate departmental routing.' },
      { dayNumber: 4, percentageTarget: 57, title: 'Day 4: Lab & Diagnostic Test Coordination', description: 'Fasting vs non-fasting blood tests, scan token bookings, and communicating report delivery times.', keyTakeaway: 'Diagnostic appointment coordination.' },
      { dayNumber: 5, percentageTarget: 71, title: 'Day 5: Health Insurance (CMCHIS, TPA) & Cashless Basics', description: 'Government insurance card check, pre-authorization forms, and billing counter guidance.', keyTakeaway: 'Insurance desk support.' },
      { dayNumber: 6, percentageTarget: 86, title: 'Day 6: Emergency Triage & Crisis Communication', description: 'Identifying critical patients (chest pain, trauma, breathlessness) and immediate alert protocols.', keyTakeaway: 'Life-saving emergency coordination.' },
      { dayNumber: 7, percentageTarget: 100, title: 'Day 7: Hospital Reception Simulation & Certification', description: 'Mock phone calls, angry relative de-escalation, final quiz, and verified certificate award.', keyTakeaway: 'Certified Healthcare Front-Desk Specialist.' }
    ]
  }
];

/**
 * Returns a course preset by slug or id, or null.
 */
export function getCoursePreset(slugOrId: string): CoursePreset | null {
  return (
    COURSE_LAUNCH_PRESETS.find(
      (p) => p.slug === slugOrId || p.id === slugOrId
    ) || null
  );
}

/**
 * Converts a CoursePreset into a full Course object suitable for rendering
 * when Firestore or network is in fallback mode.
 */
export function presetToCourse(preset: CoursePreset): Course {
  return {
    id: preset.id,
    title: preset.title,
    titleTamil: preset.titleTamil,
    slug: preset.slug,
    shortDescription: preset.shortDescription,
    fullDescription: preset.fullDescription,
    categoryId: preset.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    categoryName: preset.categoryName,
    thumbnailUrl: '',
    instructorName: preset.instructorName,
    difficulty: preset.difficulty,
    duration: `${preset.totalDays} Days (${preset.totalDays * preset.hoursPerDay} hrs)`,
    durationMinutes: preset.totalDays * preset.hoursPerDay * 60,
    totalDays: preset.totalDays,
    hoursPerDay: preset.hoursPerDay,
    dailyPercentageTarget: preset.dailyPercentageTarget,
    targetAudience: preset.targetAudience,
    dailySchedule: preset.dailySchedule,
    language: preset.language,
    learningObjectives: preset.learningObjectives,
    prerequisites: preset.prerequisites,
    lessonCount: preset.dailySchedule.length,
    quizRequired: true,
    certificateEligible: true,
    visibility: 'public',
    status: 'published',
    enrollmentCount: 142,
    completionCount: 96,
    rating: 4.8,
    reviewCount: 38,
    tags: [preset.categoryName, ...preset.targetRoles],
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Master fallback list of courses for the public catalog and search.
 */
export const FALLBACK_CATALOG_COURSES: Course[] = COURSE_LAUNCH_PRESETS.map(presetToCourse);
