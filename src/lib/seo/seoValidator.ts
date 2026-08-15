/**
 * THENIJOBS — SEO Validation Layer
 * Validates job data completeness before publishing.
 * Ensures all required fields for Google Jobs / JobPosting schema are present.
 */

export interface SEOValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface JobValidationInput {
  title?: string;
  description?: string;
  companyName?: string;
  companyId?: string;
  location?: string;
  district?: string;
  state?: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string;
  postedDate?: string | Date;
  expiryDate?: string | Date;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  experience?: string;
  education?: string;
  openings?: number;
}

/**
 * Validates job data before publishing for SEO/Google Jobs compliance.
 * Returns a list of critical errors (must fix) and warnings (should fix).
 */
export function validateJobForPublishing(job: JobValidationInput): SEOValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── 🔴 CRITICAL (Required by Google JobPosting) ──────────────────────────

  // Title (required)
  if (!job.title || job.title.trim().length < 3) {
    errors.push('Job title is required and must be at least 3 characters.');
  } else if (job.title.trim().length > 200) {
    warnings.push('Job title is very long. Consider keeping it under 200 characters.');
  }

  // Description (required, must be substantial)
  if (!job.description || job.description.trim().length < 50) {
    errors.push('Job description is required and must be at least 50 characters. Include responsibilities, qualifications, and skills.');
  } else if (job.description.trim().length < 200) {
    warnings.push('Job description is short. A detailed description (200+ characters) improves Google Jobs ranking.');
  }

  // Company Name (required — hiringOrganization.name)
  if (!job.companyName || job.companyName.trim().length < 2) {
    errors.push('Company name is required for Google Jobs eligibility.');
  }

  // Location (required — jobLocation)
  if (!job.location && !job.district) {
    errors.push('Job location is required. Specify at least the city/district.');
  }

  // Date Posted (required)
  if (!job.postedDate) {
    warnings.push('Posted date is missing. Current date will be used automatically.');
  }

  // ── 🟠 IMPORTANT (Strongly recommended) ──────────────────────────────────

  // Salary
  if (!job.salaryMin || job.salaryMin <= 0) {
    warnings.push('Salary information is missing. Adding salary significantly improves Google Jobs visibility and click-through.');
  } else {
    // Validate salary range consistency
    if (job.salaryMax && job.salaryMax < job.salaryMin) {
      errors.push('Maximum salary cannot be less than minimum salary.');
    }
    // Sanity check: salary too low (potential error)
    if (job.salaryMin < 1000) {
      warnings.push('Minimum salary seems very low (< ₹1,000). Verify this is correct monthly salary.');
    }
    // Sanity check: salary unrealistically high
    if (job.salaryMin > 10000000) {
      warnings.push('Minimum salary seems unusually high (> ₹1 Crore). Verify this is correct.');
    }
  }

  // Employment Type
  if (!job.jobType) {
    warnings.push('Employment type (Full Time, Part Time, etc.) is missing. This helps Google categorize the listing.');
  }

  // Expiry Date
  if (!job.expiryDate) {
    warnings.push('Application deadline / expiry date is missing. A 30-day default will be used.');
  }

  // ── 🟢 NICE TO HAVE (Improves listing quality) ───────────────────────────

  // Responsibilities
  if (!job.responsibilities || job.responsibilities.length === 0) {
    warnings.push('Key responsibilities not listed. Adding them improves description quality.');
  }

  // Requirements
  if (!job.requirements || job.requirements.length === 0) {
    warnings.push('Qualification requirements not listed.');
  }

  // Skills
  if (!job.skills || job.skills.length === 0) {
    warnings.push('Required skills not listed.');
  }

  // Experience
  if (!job.experience) {
    warnings.push('Experience requirement not specified.');
  }

  // Education
  if (!job.education) {
    warnings.push('Education requirement not specified.');
  }

  // State
  if (!job.state) {
    warnings.push('State is not specified. "Tamil Nadu" will be used as default.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Quick check: is job data sufficient for Google Jobs eligibility?
 * Returns true only if all critical fields are present.
 */
export function isGoogleJobsEligible(job: JobValidationInput): boolean {
  return validateJobForPublishing(job).valid;
}
