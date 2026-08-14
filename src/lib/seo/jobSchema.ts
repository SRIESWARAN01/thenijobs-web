/**
 * THENIJOBS — Google Jobs & Schema.org Structured Data Generator
 * Formats JobPosting and BreadcrumbList structured data according to Google Search Guidelines.
 */

export interface JobSchemaInput {
  id: string;
  title: string;
  description: string;
  companyName: string;
  companyWebsite?: string;
  companyLogo?: string;
  location?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  streetAddress?: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string;
  postedDate?: string | Date;
  expiryDate?: string | Date;
  isRemote?: boolean;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  benefits?: string[];
}

/**
 * Standardizes employmentType to Schema.org recognized values
 */
export function normalizeEmploymentType(jobType?: string): string {
  if (!jobType) return 'FULL_TIME';
  const lower = jobType.toLowerCase();
  if (lower.includes('part')) return 'PART_TIME';
  if (lower.includes('contract') || lower.includes('freelance')) return 'CONTRACTOR';
  if (lower.includes('intern')) return 'INTERN';
  if (lower.includes('temp') || lower.includes('daily')) return 'TEMPORARY';
  return 'FULL_TIME';
}

/**
 * Builds HTML description suitable for JobPosting description property
 */
export function buildHtmlDescription(job: JobSchemaInput): string {
  let html = `<p>${job.description.replace(/\n/g, '<br/>')}</p>`;

  if (job.responsibilities && job.responsibilities.length > 0) {
    html += `<h3>Key Responsibilities:</h3><ul>${job.responsibilities.map(r => `<li>${r}</li>`).join('')}</ul>`;
  }

  if (job.requirements && job.requirements.length > 0) {
    html += `<h3>Requirements & Qualifications:</h3><ul>${job.requirements.map(req => `<li>${req}</li>`).join('')}</ul>`;
  }

  if (job.skills && job.skills.length > 0) {
    html += `<h3>Required Skills:</h3><p>${job.skills.join(', ')}</p>`;
  }

  if (job.benefits && job.benefits.length > 0) {
    html += `<h3>Benefits & Perks:</h3><ul>${job.benefits.map(b => `<li>${b}</li>`).join('')}</ul>`;
  }

  html += `<p><strong>Application Process:</strong> Apply directly online through THENIJOBS portal.</p>`;
  return html;
}

/**
 * Creates Schema.org JobPosting JSON-LD object for Google Jobs
 */
export function generateJobPostingSchema(job: JobSchemaInput) {
  // Format Date Posted
  const posted = job.postedDate
    ? (typeof job.postedDate === 'string' ? job.postedDate.slice(0, 10) : job.postedDate.toISOString().slice(0, 10))
    : new Date().toISOString().slice(0, 10);

  // Format Expiry Date (default 30 days from posted date if not provided)
  let validThrough: string;
  if (job.expiryDate) {
    validThrough = typeof job.expiryDate === 'string' ? job.expiryDate : job.expiryDate.toISOString();
  } else {
    const exp = new Date(posted);
    exp.setDate(exp.getDate() + 30);
    validThrough = exp.toISOString();
  }

  const district = job.district || job.location || 'Theni';
  const state = job.state || 'Tamil Nadu';
  const postalCode = job.postalCode || '625531';
  const streetAddress = job.streetAddress || `${district}, ${state}`;

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: buildHtmlDescription(job),
    identifier: {
      '@type': 'PropertyValue',
      name: 'THENIJOBS',
      value: `THENIJOBS-${job.id}`,
    },
    datePosted: posted,
    validThrough: validThrough,
    employmentType: normalizeEmploymentType(job.jobType),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.companyName || 'Verified Theni Employer',
      sameAs: job.companyWebsite || 'https://thenijobs.com',
      logo: job.companyLogo || 'https://thenijobs.com/logo.png',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: streetAddress,
        addressLocality: district,
        addressRegion: state,
        postalCode: postalCode,
        addressCountry: 'IN',
      },
    },
    directApply: true,
  };

  // Base salary structured object if provided
  if (job.salaryMin && job.salaryMin > 0) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salaryMin,
        maxValue: job.salaryMax && job.salaryMax > job.salaryMin ? job.salaryMax : job.salaryMin,
        unitText: 'MONTH',
      },
    };
  }

  // Remote / Telecommute handling
  if (job.isRemote || job.jobType?.toLowerCase().includes('remote') || job.location?.toLowerCase().includes('remote')) {
    schema.jobLocationType = 'TELECOMMUTE';
    schema.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'India',
    };
  }

  return schema;
}

/**
 * Creates Schema.org BreadcrumbList JSON-LD object
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
