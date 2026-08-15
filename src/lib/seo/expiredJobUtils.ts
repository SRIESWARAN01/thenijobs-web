/**
 * THENIJOBS — Expired Job Utilities
 * Handles detection and proper response for expired job postings.
 * Critical for Google Jobs compliance — expired jobs must be handled properly.
 */

import type { ServerJobData } from '@/lib/firebase/firestoreServer';

export interface ExpiredJobInfo {
  isExpired: boolean;
  reason?: 'status_inactive' | 'status_expired' | 'past_deadline' | 'not_found';
  message: string;
}

/**
 * Determines if a job is expired based on multiple criteria:
 * 1. isActive === false
 * 2. status !== 'active'  
 * 3. expiryDate has passed
 */
export function isJobExpired(job: ServerJobData | null): ExpiredJobInfo {
  if (!job) {
    return {
      isExpired: true,
      reason: 'not_found',
      message: 'This job posting could not be found.',
    };
  }

  if (!job.isActive) {
    return {
      isExpired: true,
      reason: 'status_inactive',
      message: 'This job is no longer accepting applications.',
    };
  }

  if (job.status && job.status !== 'active') {
    return {
      isExpired: true,
      reason: 'status_expired',
      message: 'This job posting has been closed by the employer.',
    };
  }

  // Check if expiry date has passed
  if (job.expiryDate) {
    try {
      const expiryDate = new Date(job.expiryDate);
      if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
        return {
          isExpired: true,
          reason: 'past_deadline',
          message: 'The application deadline for this job has passed.',
        };
      }
    } catch {
      // Invalid date format — skip this check
    }
  }

  return { isExpired: false, message: '' };
}

/**
 * Formats salary display string from min/max values
 */
export function formatSalaryDisplay(salaryMin: number, salaryMax: number): string {
  if (!salaryMin && !salaryMax) return 'Salary Negotiable';
  if (salaryMin && salaryMax && salaryMax > salaryMin) {
    return `₹${salaryMin.toLocaleString('en-IN')} – ₹${salaryMax.toLocaleString('en-IN')} per month`;
  }
  if (salaryMin) {
    return `₹${salaryMin.toLocaleString('en-IN')} per month`;
  }
  return 'Salary Negotiable';
}

/**
 * Generates a URL-friendly slug from job title + location + id
 * Used for display purposes without requiring DB migration
 */
export function generateJobSlug(title: string, location: string, id: string): string {
  const slugParts = [title, location]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  return `${slugParts}-${id}`;
}

/**
 * Formats a date string to ISO 8601 date only (YYYY-MM-DD)
 * Google requires datePosted in this format
 */
export function toISODateString(dateValue: string | Date | undefined): string {
  if (!dateValue) return new Date().toISOString().slice(0, 10);

  try {
    if (typeof dateValue === 'string') {
      // Handle Firestore timestamp format (ISO string)
      const d = new Date(dateValue);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue.toISOString().slice(0, 10);
    }
  } catch {
    // Fall through
  }

  return new Date().toISOString().slice(0, 10);
}

/**
 * Formats a date string to full ISO 8601 with timezone for validThrough
 */
export function toISOExpiryString(dateValue: string | Date | undefined): string {
  if (!dateValue) {
    // Default: 30 days from now
    const exp = new Date();
    exp.setDate(exp.getDate() + 30);
    return exp.toISOString();
  }

  try {
    if (typeof dateValue === 'string') {
      const d = new Date(dateValue);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue.toISOString();
    }
  } catch {
    // Fall through
  }

  const exp = new Date();
  exp.setDate(exp.getDate() + 30);
  return exp.toISOString();
}
