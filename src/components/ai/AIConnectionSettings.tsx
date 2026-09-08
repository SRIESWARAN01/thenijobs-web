'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Loader2, Play, Unlink, Shield } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { PROVIDER_MODELS } from '@/lib/ai/providers/index';
import { AI_CONNECTION_FEE_INR } from '@/lib/constants';
import { Card, CardHeader, CardBody, Button, SettingRow } from '@/components/dashboard';
import { useToast } from '@/contexts/ToastContext';
import AIConnectionFeeModal from './AIConnectionFeeModal';

const PROVIDER_LABELS: Record<'openai' | 'gemini', string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
};

interface ConnectionStatus {
  connected: boolean;
  feePaid?: boolean;
  provider?: 'openai' | 'gemini';
  model?: string;
  maskedKey?: string;
  status?: 'connected' | 'error' | 'untested';
  lastTested?: number | null;
  lastError?: string | null;
}

/**
 * AI-CONNECT-1 -- the shared settings surface for connecting a personal OpenAI/Gemini key.
 * Mounted at src/app/seeker/ai/page.tsx and src/app/employer/ai/page.tsx (both wrap it in their
 * own layout guard). Access rules (Rs50 seeker fee / Enterprise employer bypass / non-Enterprise
 * refusal) are enforced entirely server-side (aiConnectionAccess.ts) -- this component never
 * guesses the caller's role or plan, it just surfaces whatever the connect route's own response
 * says, including the fee prompt when that's the reason a connect attempt was refused.
 */
export default function AIConnectionSettings({ userName, userEmail }: { userName?: string; userEmail?: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');
  const [model, setModel] = useState(PROVIDER_MODELS.openai[0]);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const authedFetch = useCallback(async (url: string, init?: RequestInit) => {
    const idToken = await auth.currentUser?.getIdToken();
    return fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}), Authorization: idToken ? `Bearer ${idToken}` : '' },
    });
  }, []);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch('/api/ai/connections/status');
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus(data);
        setShowForm(!data.connected);
      } else {
        // A failed status load (expired token, transient 5xx) must not leave the view showing
        // neither the connected card nor the connect form -- default to the form so there is
        // always a path forward, same as the not-connected state.
        setShowForm(true);
      }
    } catch (err) {
      console.error('[AIConnectionSettings] status load failed:', err);
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setConnectError('Enter your API key.');
      return;
    }
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await authedFetch('/api/ai/connections/connect', {
        method: 'POST',
        body: JSON.stringify({ provider, model, apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 402) {
          setShowFeeModal(true);
        } else {
          setConnectError(data.error || 'Could not connect this key.');
        }
        return;
      }
      setApiKey('');
      toast.success('AI key connected!', `${PROVIDER_LABELS[provider]} is now ready to use.`);
      await loadStatus();
    } catch (err) {
      console.error('[AIConnectionSettings] connect failed:', err);
      setConnectError('Could not connect right now. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await authedFetch('/api/ai/connections/test', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Connection is working', `Responded in ${data.latencyMs}ms.`);
      } else {
        toast.error('Connection test failed', data.error || 'The provider rejected this key.');
      }
      await loadStatus();
    } catch (err) {
      console.error('[AIConnectionSettings] test failed:', err);
      toast.error('Could not test the connection right now.');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await authedFetch('/api/ai/connections/disconnect', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('AI key disconnected.');
        await loadStatus();
      } else {
        toast.error('Could not disconnect right now.');
      }
    } catch (err) {
      console.error('[AIConnectionSettings] disconnect failed:', err);
      toast.error('Could not disconnect right now.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center py-10">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Your Own AI Key"
          description="Connect your own OpenAI or Gemini account instead of using THENIJOBS AI credits."
        />
        <CardBody className="space-y-4">
          {status.connected ? (
            <>
              <SettingRow
                title={`${PROVIDER_LABELS[status.provider || 'openai']} — ${status.model}`}
                description={status.maskedKey}
                control={
                  status.status === 'connected' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={14} /> Connected</span>
                  ) : status.status === 'error' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><XCircle size={14} /> Error</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400"><AlertCircle size={14} /> Untested</span>
                  )
                }
              />
              {status.lastError && (
                <p className="text-xs text-red-600 flex items-start gap-1.5"><AlertCircle size={13} className="mt-0.5 shrink-0" /> {status.lastError}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handleTest} loading={testing}>
                  <Play size={13} /> Test Connection
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowForm(v => !v)}>
                  <Key size={13} /> Replace Key
                </Button>
                <Button variant="danger" size="sm" onClick={handleDisconnect} loading={disconnecting}>
                  <Unlink size={13} /> Disconnect
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-500 flex items-start gap-2">
              <Shield size={14} className="mt-0.5 shrink-0 text-slate-400" />
              <span>No AI key connected yet. Connecting your own key costs a one-time ₹{AI_CONNECTION_FEE_INR} THENIJOBS fee (Enterprise-plan companies connect free) — actual usage is billed by the provider directly to your own account.</span>
            </div>
          )}

          {showForm && (
            <div className="space-y-3 rounded-xl border border-slate-200 p-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="AI provider"
                  value={provider}
                  onChange={e => {
                    const next = e.target.value as 'openai' | 'gemini';
                    setProvider(next);
                    setModel(PROVIDER_MODELS[next][0]);
                  }}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
                >
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                </select>
                <select
                  aria-label="Model"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
                >
                  {PROVIDER_MODELS[provider].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="relative">
                <input
                  aria-label="API key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={provider === 'openai' ? 'sk-...' : 'AIza...'}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 pr-10 text-sm font-mono"
                />
                <button
                  type="button"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {connectError && (
                <p className="text-xs text-red-600 flex items-start gap-1.5"><AlertCircle size={13} className="mt-0.5 shrink-0" /> {connectError}</p>
              )}
              <Button variant="primary" size="sm" onClick={handleConnect} loading={connecting} block>
                <Key size={13} /> Connect Key
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <AIConnectionFeeModal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        userName={userName}
        userEmail={userEmail}
        onActivated={() => {
          setShowFeeModal(false);
          loadStatus();
        }}
      />
    </>
  );
}
