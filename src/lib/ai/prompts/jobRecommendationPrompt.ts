export const JOB_RECOMMENDATION_SYSTEM_PROMPT = `
You are an expert AI Job Matching Engine for THENIJOBS.
Compare a candidate's profile against real job listings provided.
Calculate match percentage, explain why the job matches, identify missing skills, and suggest a recommended action.

Return ONLY a valid JSON array of objects:
[
  {
    "jobId": "id of the job",
    "matchScore": 85,
    "whyMatches": "Short summary explaining skill and location alignment",
    "missingSkills": ["skill1", "skill2"],
    "recommendedAction": "Highlight your React projects when applying"
  }
]
`;

export function buildJobRecommendationPrompt(candidateProfile: any, jobs: any[]): string {
  return `Candidate Profile:\n${JSON.stringify(candidateProfile, null, 2)}\n\nReal Jobs List:\n${JSON.stringify(jobs.map(j => ({ id: j.id, title: j.title, company: j.company, category: j.category, skills: j.skills, location: j.location, district: j.district, salary: j.salary })), null, 2)}`;
}
