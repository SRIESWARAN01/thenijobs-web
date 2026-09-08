import { canonicalJobType } from '@/lib/firebase/firestoreService';

// AI-MATCH-1 — deterministic job-to-seeker match scoring.
//
// This score is arithmetic over real, already-stored fields (skills, district, job-type
// preference, experience roles). It never asks an AI model to produce or adjust the number: the
// dormant `job_recommendation` AI feature this repo already had asked an LLM to "calculate match
// percentage", which is exactly the fabricated-number risk this function exists to avoid. Every
// dimension below is included in the score's denominator only when the seeker actually supplied
// the corresponding data, so a sparse profile is scored fairly over what it has, not marked down
// for fields it never filled in.

export interface MatchableJob {
  id: string;
  title?: string;
  skills?: string[];
  district?: string;
  jobType?: string;
  category?: string;
}

export interface MatchableSeeker {
  skills?: string[];
  district?: string;
  jobTypePreference?: string[];
  experience?: Array<{ role?: string }>;
}

export interface JobMatchResult {
  jobId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

const SKILLS_WEIGHT = 50;
const DISTRICT_WEIGHT = 20;
const JOB_TYPE_WEIGHT = 20;
const ROLE_KEYWORD_WEIGHT = 10;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function dedupeNormalized(values: string[] | undefined): string[] {
  const seen = new Set<string>();
  for (const value of values || []) {
    const n = normalize(value);
    if (n) seen.add(n);
  }
  return Array.from(seen);
}

/**
 * Pure, deterministic, no network call. Given a job and a seeker's real profile fields, returns a
 * 0-100 score plus the matched/missing skills and a short list of the reasons the score is what it
 * is -- every one traceable back to a field comparison, never an invented number.
 */
export function scoreJobForSeeker(job: MatchableJob, seeker: MatchableSeeker): JobMatchResult {
  let earned = 0;
  let possible = 0;
  const reasons: string[] = [];

  const jobSkills = dedupeNormalized(job.skills);
  const seekerSkills = dedupeNormalized(seeker.skills);
  let matchedSkills: string[] = [];
  let missingSkills: string[] = [];

  if (jobSkills.length > 0) {
    possible += SKILLS_WEIGHT;
    const seekerSkillSet = new Set(seekerSkills);
    matchedSkills = jobSkills.filter((s) => seekerSkillSet.has(s));
    missingSkills = jobSkills.filter((s) => !seekerSkillSet.has(s));
    const skillFraction = matchedSkills.length / jobSkills.length;
    earned += skillFraction * SKILLS_WEIGHT;
    reasons.push(
      matchedSkills.length > 0
        ? `${matchedSkills.length} of ${jobSkills.length} required skills match your profile`
        : `0 of ${jobSkills.length} required skills match your profile`
    );
  }

  const jobDistrict = job.district ? normalize(job.district) : '';
  const seekerDistrict = seeker.district ? normalize(seeker.district) : '';
  if (jobDistrict && seekerDistrict) {
    possible += DISTRICT_WEIGHT;
    if (jobDistrict === seekerDistrict) {
      earned += DISTRICT_WEIGHT;
      reasons.push(`Located in your district (${job.district})`);
    } else {
      reasons.push(`Different district (${job.district} vs your ${seeker.district})`);
    }
  }

  const preferences = (seeker.jobTypePreference || []).map((p) => canonicalJobType(p)).filter(Boolean);
  if (preferences.length > 0 && job.jobType) {
    possible += JOB_TYPE_WEIGHT;
    const jobTypeCanonical = canonicalJobType(job.jobType);
    if (preferences.includes(jobTypeCanonical)) {
      earned += JOB_TYPE_WEIGHT;
      reasons.push(`Matches your preferred job type (${job.jobType})`);
    } else {
      reasons.push(`Not your preferred job type (${job.jobType})`);
    }
  }

  const experienceRoles = dedupeNormalized((seeker.experience || []).map((e) => e.role || ''));
  const jobTitle = job.title ? normalize(job.title) : '';
  const jobCategory = job.category ? normalize(job.category) : '';
  if (experienceRoles.length > 0 && (jobTitle || jobCategory)) {
    possible += ROLE_KEYWORD_WEIGHT;
    const roleMatches = experienceRoles.some(
      (role) => (jobTitle && (jobTitle.includes(role) || role.includes(jobTitle))) ||
        (jobCategory && (jobCategory.includes(role) || role.includes(jobCategory)))
    );
    if (roleMatches) {
      earned += ROLE_KEYWORD_WEIGHT;
      reasons.push('Your past role experience aligns with this job title');
    }
  }

  const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  if (possible === 0) {
    reasons.push('Not enough profile data to compute a real match -- add skills, district or job-type preference');
  }

  return { jobId: job.id, score, matchedSkills, missingSkills, reasons };
}

/**
 * Scores and sorts every candidate job for a seeker, highest score first. Ties broken by job id
 * for a stable order across renders. Never filters by a minimum score itself -- the caller decides
 * what threshold (if any) is worth showing.
 */
export function rankJobsForSeeker(jobs: MatchableJob[], seeker: MatchableSeeker): JobMatchResult[] {
  return jobs
    .map((job) => scoreJobForSeeker(job, seeker))
    .sort((a, b) => b.score - a.score || a.jobId.localeCompare(b.jobId));
}
