'use client';

import { useAuth } from '@/hooks/useAuth';
import { PageHeader, PageShell } from '@/components/dashboard';
import AIConnectionSettings from '@/components/ai/AIConnectionSettings';

export default function SeekerAIConnectionPage() {
  const { user } = useAuth();

  return (
    <PageShell>
      <PageHeader
        title="AI Connection"
        description="Connect your own OpenAI or Gemini key for AI features on THENIJOBS."
      />
      <AIConnectionSettings userName={user?.displayName} userEmail={user?.email} />
    </PageShell>
  );
}
