function compactArray<T>(items: T[] | undefined | null): T[] {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

interface PublicResumeRef {
  url?: string;
  isDefault?: boolean;
}

export function buildPublicSeekerProfile(
  uid: string,
  profile: Record<string, any>,
  user?: Record<string, any> | null,
) {
  const photoUrl = cleanString(profile.photoUrl || profile.profilePhotoUrl || user?.photoURL);
  const resumes = compactArray<PublicResumeRef>(profile.resumes);
  const defaultResume = resumes.find((resume) => resume?.isDefault) || resumes[0];
  const portfolioLinks = compactArray<string>(profile.portfolio || profile.portfolioLinks).slice(0, 12);

  return {
    id: uid,
    ownerId: uid,
    type: 'job_seeker',
    name: cleanString(profile.name || user?.displayName),
    displayName: cleanString(profile.name || user?.displayName),
    currentRole: cleanString(profile.currentRole || profile.qualification),
    qualification: cleanString(profile.currentRole || profile.qualification || 'Job Seeker'),
    district: cleanString(profile.district || user?.district),
    email: cleanString(profile.email || user?.email),
    phone: cleanString(profile.phone || user?.phone),
    photoUrl,
    profilePhotoUrl: photoUrl,
    isOpenToWork: profile.isOpenToWork !== false,
    skills: compactArray<string>(profile.skills).slice(0, 20),
    languages: compactArray<string>(profile.languages).slice(0, 10),
    education: compactArray(profile.education).slice(0, 10),
    experience: compactArray(profile.experience).slice(0, 10),
    achievements: compactArray(profile.achievements).slice(0, 10),
    certifications: compactArray(profile.certifications).slice(0, 10),
    portfolio: portfolioLinks,
    portfolioLinks,
    resumeUrl: cleanString(profile.resumeUrl || defaultResume?.url),
    profileStrength: Number(profile.profileStrength || 0),
    candidateId: cleanString(profile.candidateId),
    expectedSalary: cleanString(profile.expectedSalary),
    linkedin: cleanString(profile.linkedin),
    website: cleanString(profile.website),
    updatedAt: profile.updatedAt,
  };
}
