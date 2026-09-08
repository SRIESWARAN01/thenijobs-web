'use client';

import { useAuth } from '@/hooks/useAuth';
import { PageHeader, PageShell } from '@/components/dashboard';
import AIConnectionSettings from '@/components/ai/AIConnectionSettings';

export default function EmployerAIConnectionPage() {
  const { user } = useAuth();

  return (
    <PageShell>
      <PageHeader
        title="AI Connection"
        description="Connect your own OpenAI or Gemini key for AI features on THENIJOBS. Enterprise-plan companies connect free."
      />
      <AIConnectionSettings userName={user?.displayName} userEmail={user?.email} />
    </PageShell>
  );
}
