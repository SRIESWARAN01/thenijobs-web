'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { PageHeader, PageShell, Card, CardBody, Skeleton } from '@/components/dashboard';
import AIChatbotModal from '@/components/ai/AIChatbotModal';

/**
 * AI-CHAT-1. Grounds the assistant in the requesting seeker's OWN real profile data only --
 * never another user's, never phone/email (they add no career-advice value and needlessly widen
 * what a jailbroken prompt could ever echo back). The chat itself never writes anything: the
 * 'chatbot' AI feature only ever returns text (see AIChatbotModal.tsx), never calls applyToJob or
 * any Firestore write.
 */
export default function SeekerAIChatPage() {
  const { user } = useAuth();
  const { data: profile, loading: profileLoading } = useDocument<any>('seekerProfiles', user?.uid);

  const context = useMemo(() => {
    if (!profile) return undefined;
    return {
      name: profile.name,
      district: profile.district,
      skills: (profile.skills || []).map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean),
      experience: (profile.experience || []).map((e: any) => ({ role: e.role, company: e.company, description: e.description })),
      education: (profile.education || []).map((e: any) => ({ degree: e.degree, field: e.field, institution: e.institution })),
      jobTypePreference: profile.jobTypePreference,
      summary: profile.summary,
    };
  }, [profile]);

  return (
    <PageShell className="max-w-2xl">
      <PageHeader
        title="Ask AI"
        description="Chat with THENIJOBS AI, grounded in your own profile -- never another user's data. Advice only, nothing here ever applies to a job or edits your profile."
        breadcrumbs={[{ label: 'Seeker', href: '/seeker/dashboard' }, { label: 'Ask AI' }]}
      />

      {profileLoading && (
        <Card><CardBody className="space-y-3 py-6"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardBody></Card>
      )}

      {!profileLoading && (
        <AIChatbotModal isOpen embedded context={context} />
      )}
    </PageShell>
  );
}
