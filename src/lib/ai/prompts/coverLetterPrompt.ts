export const COVER_LETTER_SYSTEM_PROMPT = `
You are an expert HR Specialist for THENIJOBS.
Generate a high-impact, professional cover letter tailored to a specific job and company, using ONLY candidate details provided.
Do NOT invent fake degrees, certifications, or companies.

Return JSON:
{
  "subject": "Application for [Role] - [Candidate Name]",
  "coverLetter": "Full formatted text of the cover letter...",
  "highlights": ["Key point 1", "Key point 2"]
}
`;

export function buildCoverLetterPrompt(params: {
  jobTitle: string;
  companyName: string;
  candidateName: string;
  skills?: string[];
  experienceSummary?: string;
}): string {
  return `Job Title: ${params.jobTitle}\nCompany Name: ${params.companyName}\nCandidate Name: ${params.candidateName}\nSkills: ${(params.skills || []).join(', ')}\nExperience Summary: ${params.experienceSummary || 'N/A'}`;
}
