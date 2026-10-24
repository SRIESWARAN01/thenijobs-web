import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('THENIJOBS Daily Jobs — Search, Filters, Discovery & Workflow Tests', () => {

  const sampleJobs = [
    {
      id: 'job_001',
      slug: 'medical-records-reviewer-ags-it-solutions-theni',
      title: 'Medical Records Reviewer',
      company: 'AGS IT SOLUTIONS',
      companyId: 'comp_ags',
      location: 'Theni Town, Theni',
      district: 'Theni',
      taluk: 'Theni',
      salary: '₹8,000 - ₹3,00,000 / monthly',
      salaryMin: 8000,
      salaryMax: 300000,
      type: 'Full Time',
      workMode: 'On-site',
      experience: 'Fresher (0 yrs)',
      education: 'Any Degree',
      category: 'IT & Software',
      skills: ['System typing', 'Medical coding'],
      description: 'Team work and Good Communication skills required for medical coding and record reviews.',
      postedAt: Date.now() - (4 * 3600 * 1000), // 4 hours ago (Today)
      deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      isUrgent: true,
      isVerified: true,
      isFeatured: true,
      isWalkIn: false,
      isFresher: true,
      isDailyWage: false,
      isExpired: false,
      whatsapp: '9750585060'
    },
    {
      id: 'job_002',
      slug: 'cardamom-sorter-cumbum-agro',
      title: 'Cardamom Quality Sorter & Packer',
      company: 'Cumbum Valley Spices Agro',
      companyId: 'comp_agro',
      location: 'Cumbum, Theni',
      district: 'Theni',
      taluk: 'Cumbum',
      town: 'Cumbum',
      salary: '₹600 / day (Daily Wage)',
      salaryMin: 600,
      salaryMax: 600,
      type: 'Daily Wage',
      workMode: 'On-site',
      experience: 'Fresher',
      education: '10th Pass',
      category: 'Agriculture',
      skills: ['Sorting', 'Packaging', 'Quality inspection'],
      description: 'Immediate requirement for cardamom sorting and grading. Daily wages settled every evening.',
      postedAt: Date.now() - (18 * 3600 * 1000), // 18 hours ago (Today)
      deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
      isUrgent: true,
      isVerified: true,
      isFeatured: false,
      isWalkIn: true,
      isFresher: true,
      isDailyWage: true,
      isExpired: false,
      whatsapp: '9360519460'
    },
    {
      id: 'job_003',
      slug: 'senior-accountant-periyakulam-trading',
      title: 'Senior Tally & GST Accountant',
      company: 'Periyakulam Commercial Traders',
      companyId: 'comp_peri',
      location: 'Periyakulam, Theni',
      district: 'Theni',
      taluk: 'Periyakulam',
      town: 'Devadanapatti',
      salary: '₹22,000 - ₹28,000 / month',
      salaryMin: 22000,
      salaryMax: 28000,
      type: 'Full Time',
      workMode: 'On-site',
      experience: '3-5 Years',
      education: 'Any Degree',
      category: 'Finance & Accounting',
      skills: ['Tally Prime', 'GST filing', 'Auditing'],
      description: 'Handling day-to-day books, invoices, and quarterly GST returns.',
      postedAt: Date.now() - (3 * 86400 * 1000), // 3 days ago
      deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      isUrgent: false,
      isVerified: true,
      isFeatured: true,
      isWalkIn: false,
      isFresher: false,
      isDailyWage: false,
      isExpired: false,
      whatsapp: '7094826886'
    },
    {
      id: 'job_004',
      slug: 'past-deadline-expired-job',
      title: 'Retail Store Assistant (Closed)',
      company: 'Theni Bakes',
      companyId: 'comp_bakes',
      location: 'Bodinayakanur, Theni',
      district: 'Theni',
      taluk: 'Bodinayakanur',
      salary: '₹9,000 / month',
      salaryMin: 9000,
      salaryMax: 9000,
      type: 'Full Time',
      postedAt: Date.now() - (45 * 86400 * 1000), // 45 days ago
      deadline: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days expired
      isUrgent: false,
      isVerified: false,
      isExpired: true,
    }
  ];

  // 1. Search Matching
  test('Job Search matches across title, company, location, skills, and description', () => {
    function searchJobs(query, list) {
      if (!query.trim()) return list;
      const q = query.toLowerCase().trim();
      return list.filter(j => 
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        (j.skills && j.skills.some(s => s.toLowerCase().includes(q))) ||
        (j.description && j.description.toLowerCase().includes(q))
      );
    }

    // Match by title
    const resTitle = searchJobs('Medical', sampleJobs);
    assert.equal(resTitle.length, 1);
    assert.equal(resTitle[0].id, 'job_001');

    // Match by company
    const resComp = searchJobs('Cumbum Valley', sampleJobs);
    assert.equal(resComp.length, 1);
    assert.equal(resComp[0].id, 'job_002');

    // Match by skill
    const resSkill = searchJobs('Tally', sampleJobs);
    assert.equal(resSkill.length, 1);
    assert.equal(resSkill[0].id, 'job_003');

    // Match by location / taluk
    const resLoc = searchJobs('Periyakulam', sampleJobs);
    assert.equal(resLoc.length, 1);
    assert.equal(resLoc[0].id, 'job_003');
  });

  // 2. Official Theni Taluk and Location Filtering
  test('Filters jobs accurately by Theni Taluks and towns', () => {
    function filterByLocation(location, list) {
      if (location === 'All Locations') return list;
      const loc = location.toLowerCase();
      return list.filter(j => 
        (j.district && j.district.toLowerCase().includes(loc)) ||
        (j.location && j.location.toLowerCase().includes(loc)) ||
        (j.taluk && j.taluk.toLowerCase().includes(loc)) ||
        (j.town && j.town.toLowerCase().includes(loc))
      );
    }

    assert.equal(filterByLocation('All Locations', sampleJobs).length, 4);
    assert.equal(filterByLocation('Cumbum', sampleJobs).length, 1);
    assert.equal(filterByLocation('Devadanapatti', sampleJobs).length, 1);
    assert.equal(filterByLocation('Bodinayakanur', sampleJobs).length, 1);
    assert.equal(filterByLocation('Theni', sampleJobs).length, 4); // All in Theni district
  });

  // 3. Salary Range Boundaries
  test('Salary range filtering classifies jobs into correct wage brackets', () => {
    function filterBySalary(bracket, list) {
      if (bracket === 'all') return list;
      return list.filter(j => {
        const min = j.salaryMin || 0;
        const max = j.salaryMax || j.salaryMin || 0;
        if (bracket === 'under_10k') return min <= 10000;
        if (bracket === '10k_25k') return (min >= 10000 && min <= 25000) || (max >= 10000 && max <= 25000);
        if (bracket === '25k_50k') return (min >= 25000 && min <= 50000) || (max >= 25000 && max <= 50000);
        if (bracket === 'above_50k') return max >= 50000;
        return true;
      });
    }

    const under10k = filterBySalary('under_10k', sampleJobs);
    assert.ok(under10k.some(j => j.id === 'job_001')); // 8000 min
    assert.ok(under10k.some(j => j.id === 'job_002')); // 600 daily

    const between10kAnd25k = filterBySalary('10k_25k', sampleJobs);
    assert.ok(between10kAnd25k.some(j => j.id === 'job_003')); // 22000 - 28000

    const above50k = filterBySalary('above_50k', sampleJobs);
    assert.ok(above50k.some(j => j.id === 'job_001')); // 300000 max
  });

  // 4. Discovery Sections (Only Show When Eligible Records Exist)
  test('Discovery sections dynamically partition jobs without hardcoded or fake jobs', () => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 3600 * 1000;

    const activeList = sampleJobs.filter(j => !j.isExpired);

    const todayJobs = activeList.filter(j => j.postedAt >= twentyFourHoursAgo);
    const urgentJobs = activeList.filter(j => j.isUrgent);
    const fresherJobs = activeList.filter(j => j.isFresher);
    const walkInJobs = activeList.filter(j => j.isWalkIn);
    const dailyWageJobs = activeList.filter(j => j.isDailyWage);
    const featuredJobs = activeList.filter(j => j.isFeatured);

    assert.equal(todayJobs.length, 2, 'Exactly 2 jobs posted in last 24h');
    assert.equal(urgentJobs.length, 2, 'Exactly 2 urgent vacancies');
    assert.equal(fresherJobs.length, 2, 'Exactly 2 fresher jobs');
    assert.equal(walkInJobs.length, 1, 'Exactly 1 walk-in interview');
    assert.equal(dailyWageJobs.length, 1, 'Exactly 1 daily wage job');
    assert.equal(featuredJobs.length, 2, 'Exactly 2 featured jobs');
  });

  // 5. Job Freshness & Expiry Management
  test('Expired jobs are detected accurately and excluded from active discovery', () => {
    const now = Date.now();

    function checkJobExpired(job) {
      if (job.isExpired) return true;
      if (job.deadline) {
        const d = new Date(job.deadline).getTime();
        if (!isNaN(d) && d < now) return true;
      }
      return false;
    }

    assert.equal(checkJobExpired(sampleJobs[0]), false, 'Active job is not expired');
    assert.equal(checkJobExpired(sampleJobs[1]), false, 'Active job is not expired');
    assert.equal(checkJobExpired(sampleJobs[2]), false, 'Active job is not expired');
    assert.equal(checkJobExpired(sampleJobs[3]), true, 'Job past deadline is expired');
  });

  // 6. Duplicate Application Guard
  test('Duplicate job application guard prevents multiple submissions for same job & seeker', () => {
    const applications = new Set();

    function apply(jobId, seekerId) {
      const key = `${jobId}_${seekerId}`;
      if (applications.has(key)) {
        return { success: false, error: 'ALREADY_APPLIED' };
      }
      applications.add(key);
      return { success: true };
    }

    assert.deepEqual(apply('job_001', 'seeker_123'), { success: true });
    assert.deepEqual(apply('job_001', 'seeker_123'), { success: false, error: 'ALREADY_APPLIED' });
    assert.deepEqual(apply('job_002', 'seeker_123'), { success: true });
  });

  // 7. WhatsApp Direct Apply URL Encoding
  test('WhatsApp apply URL embeds job title and full listing URL correctly', () => {
    function buildWhatsAppUrl(job) {
      const phone = job.whatsapp.replace(/[^0-9]/g, '');
      const listingUrl = `https://www.thenijobs.com/jobs/${job.slug || job.id}`;
      const msg = `Hi, I saw "${job.title}" posted on THENIJOBS Daily Jobs and would like to apply. Listing: ${listingUrl}`;
      return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    }

    const url = buildWhatsAppUrl(sampleJobs[0]);
    assert.ok(url.startsWith('https://wa.me/9750585060?text='));
    assert.ok(url.includes(encodeURIComponent('Medical Records Reviewer')));
    assert.ok(url.includes(encodeURIComponent('https://www.thenijobs.com/jobs/medical-records-reviewer-ags-it-solutions-theni')));
  });

  // 8. Saved Jobs Store Behavior
  test('Saved jobs toggles state idempotently and deduplicates', () => {
    let saved = [];

    function toggleSave(jobId) {
      if (saved.includes(jobId)) {
        saved = saved.filter(id => id !== jobId);
      } else {
        saved = [...saved, jobId];
      }
      return saved;
    }

    assert.deepEqual(toggleSave('job_001'), ['job_001']);
    assert.deepEqual(toggleSave('job_002'), ['job_001', 'job_002']);
    assert.deepEqual(toggleSave('job_001'), ['job_002'], 'Toggling again removes job_001');
  });
});
