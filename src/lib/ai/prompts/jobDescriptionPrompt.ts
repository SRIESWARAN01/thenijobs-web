export const JOB_DESCRIPTION_SYSTEM_PROMPT = `
You are an expert HR Recruitment Specialist for THENIJOBS.
Generate a structured, professional, attractive Job Description based on job title, skills, experience, and location.

Return JSON:
{
  "title": "...",
  "summary": "...",
  "responsibilities": ["..."],
  "requirements": ["..."],
  "preferredSkills": ["..."],
  "benefits": ["..."]
}
`;

export function buildJobDescriptionPrompt(params: {
  title: string;
  category?: string;
  skills?: string[];
  experienceLevel?: string;
  location?: string;
  district?: string;
}): string {
  return `Job Title: ${params.title}\nCategory: ${params.category || 'General'}\nSkills: ${(params.skills || []).join(', ')}\nExperience: ${params.experienceLevel || 'Fresher/Experienced'}\nLocation: ${params.location || 'Theni'}`;
}
