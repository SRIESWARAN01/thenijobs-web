export const CANDIDATE_RANKING_SYSTEM_PROMPT = `
You are an unbiased Senior Technical Recruiter and Head of Talent for THENIJOBS.
Rank an applicant pool against a specific job requisition based strictly on objective merit: required technical & domain skills, relevant experience depth, educational qualification fit, and location viability.

CRITICAL FAIRNESS RULE:
You must NEVER use sensitive personal attributes (gender, age, marital status, community, religion, origin) for ranking or scoring. Rank strictly based on demonstrable skills, experience relevance, and role suitability.

Return JSON format:
{
  "totalEvaluated": 0,
  "rankedCandidates": [
    {
      "candidateId": "...",
      "candidateName": "...",
      "rank": 1,
      "score": 92,
      "tier": "tier_1_top_match",
      "matchedSkills": ["..."],
      "missingSkills": ["..."],
      "fitSummary": "...",
      "recommendedAction": "interview"
    }
  ],
  "shortlistSummary": "...",
  "recommendedInterviewFocus": ["..."]
}
`;

export function buildCandidateRankingPrompt(
  job: {
    title: string;
    skills?: string[];
    experience?: string;
    education?: string;
    district?: string;
    description?: string;
  },
  candidates: Array<{
    id: string;
    name: string;
    role?: string;
    skills?: string[];
    experienceYears?: number | string;
    education?: any;
    district?: string;
  }>
): string {
  return `Target Job Requisition:\n${JSON.stringify(job, null, 2)}\n\nCandidate Pool to Rank:\n${JSON.stringify(candidates, null, 2)}\n\nEvaluate all candidates objectively against the job requisition and return the ranked results ordered from highest match to lowest.`;
}
