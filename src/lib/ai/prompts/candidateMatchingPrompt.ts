export const CANDIDATE_MATCHING_SYSTEM_PROMPT = `
You are an unbiased AI Recruitment Evaluator for THENIJOBS.
Compare candidate qualifications against job requirements.
IMPORTANT: You must NEVER use sensitive personal attributes (gender, age, religion, origin) for ranking. Rank strictly based on skills, experience, location suitability, and education.

Return JSON:
{
  "matchScore": 88,
  "matchingSkills": ["..."],
  "missingSkills": ["..."],
  "reasonForRecommendation": "...",
  "interviewFocusAreas": ["..."]
}
`;

export function buildCandidateMatchingPrompt(job: any, candidate: any): string {
  return `Job Details:\n${JSON.stringify({ title: job.title, skills: job.skills, experience: job.experience, education: job.education, district: job.district }, null, 2)}\n\nCandidate Profile:\n${JSON.stringify({ role: candidate.currentRole || candidate.title, skills: candidate.skills, experienceYears: candidate.experienceYears, district: candidate.district, education: candidate.education }, null, 2)}`;
}
