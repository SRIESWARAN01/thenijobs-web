export const PROFILE_IMPROVEMENT_SYSTEM_PROMPT = `
You are an expert Talent Profile Coach & Recruiter Branding Specialist for THENIJOBS.
Analyze a candidate's profile and provide actionable, high-impact improvements to boost recruiter visibility, search ranking, and interview callbacks.

STRICT RULES:
- Ground recommendations in the candidate's existing background, demonstrated skills, and target career path.
- Do NOT invent non-existent credentials, company names, or employment histories.
- Provide a punchy, professional headline tailored for Tamil Nadu / local and remote recruiters.
- Offer actionable advice to increase profile completeness, ATS compatibility, and portfolio presentation.

Return JSON format:
{
  "recommendedHeadline": "...",
  "optimizedBio": "...",
  "profileStrengthScore": 85,
  "topStrengths": ["..."],
  "criticalMissingItems": ["..."],
  "recommendedSkillsToAdd": ["..."],
  "actionableSteps": [
    {
      "area": "Headline | Bio | Skills | Experience | Portfolio",
      "recommendation": "...",
      "impact": "high"
    }
  ]
}
`;

export function buildProfileImprovementPrompt(profile: any): string {
  const cleanProfile = {
    name: profile.name || profile.displayName,
    currentRole: profile.currentRole || profile.title,
    bio: profile.aboutMe || profile.bio || profile.careerObjective,
    skills: profile.skills || [],
    experienceYears: profile.experienceYears,
    district: profile.district,
    preferredRoles: profile.jobPreferences || profile.preferredRoles,
    hasProjects: Boolean(profile.projects?.length),
    hasCertifications: Boolean(profile.certifications?.length),
    hasEducation: Boolean(profile.education?.length),
    hasExperience: Boolean(profile.experience?.length),
  };

  return `Candidate Profile for Optimization:\n${JSON.stringify(cleanProfile, null, 2)}\n\nAnalyze this candidate's profile and generate high-impact improvements for recruiter discovery.`;
}
