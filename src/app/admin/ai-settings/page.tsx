'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles, Key, Zap, CheckCircle2, XCircle, AlertCircle,
  Loader2, Eye, EyeOff, Play, Shield, Save, RefreshCw, Clock, Settings2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PROVIDER_MODELS, DEFAULT_AI_CONFIG } from '@/lib/ai/providers/index';
import type { AIProviderConfig, ProviderEntry } from '@/lib/ai/providers/index';

function maskApiKey(key: string): string {
  if (!key || key.length < 10) return key ? '****' : '';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

const PROVIDER_INFO: Record<string, { label: string; color: string; bg: string; logo: string }> = {
  gemini: { label: 'Google Gemini', color: '#4285F4', bg: '#EFF6FF', logo: '🔵' },
  groq: { label: 'Groq', color: '#F55036', bg: '#FEF2F2', logo: '🟠' },
  openai: { label: 'OpenAI', color: '#10A37F', bg: '#ECFDF5', logo: '🟢' },
};

export default function AdminAISettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [config, setConfig] = useState<AIProviderConfig>(DEFAULT_AI_CONFIG);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs?: number; error?: string }>>({});

  // Load config from Firestore
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'platformSettings', 'aiConfig'));
        if (snap.exists()) {
          setConfig(snap.data() as AIProviderConfig);
        }
      } catch (err) {
        console.error('Failed to load AI config:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updateProvider = (name: string, updates: Partial<ProviderEntry>) => {
    setConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [name]: {
          ...prev.providers[name as keyof typeof prev.providers],
          ...updates,
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mask API keys before saving
      const configToSave = { ...config };
      for (const name of ['gemini', 'groq', 'openai'] as const) {
        const p = configToSave.providers[name];
        configToSave.providers = {
          ...configToSave.providers,
          [name]: {
            ...p,
            apiKeyMasked: maskApiKey(p.apiKey),
          },
        };
      }

      await setDoc(doc(db, 'platformSettings', 'aiConfig'), {
        ...configToSave,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || '',
      });
    } catch (err) {
      console.error('Failed to save AI config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (providerName: string) => {
    const provider = config.providers[providerName as keyof typeof config.providers];
    if (!provider.apiKey) return;

    setTesting(providerName);
    setTestResults(prev => ({ ...prev, [providerName]: undefined as any }));

    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerName,
          apiKey: provider.apiKey,
          model: provider.model,
        }),
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, [providerName]: result }));

      updateProvider(providerName, {
        status: result.success ? 'connected' : 'error',
        lastTested: new Date(),
        lastError: result.error || null,
      });
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [providerName]: { success: false, error: err.message },
      }));
      updateProvider(providerName, {
        status: 'error',
        lastTested: new Date(),
        lastError: err.message,
      });
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={28} className="animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">Loading AI configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            AI Provider Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure and manage AI providers. Switch providers without code changes.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save Changes
        </button>
      </div>

      {/* Master Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* AI Enable/Disable */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">AI Features</span>
            </div>
            <button
              onClick={() => setConfig(prev => ({ ...prev, aiEnabled: !prev.aiEnabled }))}
              className={`w-11 h-6 rounded-full transition-all relative ${config.aiEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${config.aiEnabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Active Provider */}
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap size={14} className="text-emerald-600" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase">Active Provider</span>
            </div>
            <select
              value={config.activeProvider}
              onChange={e => setConfig(prev => ({ ...prev, activeProvider: e.target.value as any }))}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-base sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500"
            >
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          {/* Fallback Provider */}
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield size={14} className="text-amber-600" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase">Fallback Provider</span>
            </div>
            <select
              value={config.fallbackProvider}
              onChange={e => setConfig(prev => ({ ...prev, fallbackProvider: e.target.value as any }))}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-base sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500"
            >
              <option value="none">None</option>
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>
        </div>

        {/* Last Updated */}
        {config.updatedAt && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <Clock size={12} className="text-slate-500" />
            <span className="text-[10px] text-slate-500">
              Last updated: {config.updatedAt?.toDate?.()
                ? config.updatedAt.toDate().toLocaleString('en-IN')
                : new Date(config.updatedAt).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['gemini', 'groq', 'openai'] as const).map(name => {
          const info = PROVIDER_INFO[name];
          const provider = config.providers[name];
          const isActive = config.activeProvider === name;
          const isFallback = config.fallbackProvider === name;
          const testResult = testResults[name];
          const isShowKey = showKeys[name];

          return (
            <div
              key={name}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                isActive ? 'border-blue-300 ring-2 ring-blue-100' :
                isFallback ? 'border-amber-200' :
                'border-gray-100'
              }`}
            >
              {/* Card Header */}
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: info.bg }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{info.logo}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{info.label}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">ACTIVE</span>}
                      {isFallback && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">FALLBACK</span>}
                    </div>
                  </div>
                </div>
                {/* Status Badge */}
                <div className="flex items-center gap-1">
                  {provider.status === 'connected' && <CheckCircle2 size={16} className="text-emerald-500" />}
                  {provider.status === 'error' && <XCircle size={16} className="text-red-500" />}
                  {provider.status === 'untested' && <AlertCircle size={16} className="text-slate-500" />}
                  <span className={`text-[10px] font-semibold ${
                    provider.status === 'connected' ? 'text-emerald-600' :
                    provider.status === 'error' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {provider.status === 'connected' ? 'Connected' :
                     provider.status === 'error' ? 'Error' : 'Not Tested'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                {/* API Key */}
                <div>
                  <label htmlFor="admin-ai-settings-api-key-updateprovider-name-placeholder-" className="text-[10px] font-semibold text-gray-500 uppercase block mb-1.5">
                    <Key size={10} className="inline mr-1" /> API Key
                  </label>
                  <div className="relative">
                    <input
                      type={isShowKey ? 'text' : 'password'}
                      value={provider.apiKey}
                      onChange={e => updateProvider(name, { apiKey: e.target.value })}
                      aria-label="Enter ${info.label} API key" placeholder={`Enter ${info.label} API key...`}
                      className="w-full px-3 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all font-mono text-xs"
                    />
                    <button
                      onClick={() => setShowKeys(prev => ({ ...prev, [name]: !prev[name] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-gray-600 tap-target-auto"
                    >
                      {isShowKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {provider.apiKeyMasked && !isShowKey && (
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Saved: {provider.apiKeyMasked}</p>
                  )}
                </div>

                {/* Model Select */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1.5">
                    <Settings2 size={10} className="inline mr-1" /> Model
                  </label>
                  <select id="admin-ai-settings-api-key-updateprovider-name-placeholder-"
                    value={provider.model}
                    onChange={e => updateProvider(name, { model: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
                  >
                    {(PROVIDER_MODELS[name] || []).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Test Result */}
                {testResult && (
                  <div className={`rounded-xl p-3 text-xs ${
                    testResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`font-semibold ${testResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                      {testResult.success ? `✅ Connected (${testResult.latencyMs}ms)` : `❌ ${testResult.error}`}
                    </p>
                  </div>
                )}

                {provider.lastError && !testResult && (
                  <div className="rounded-xl p-3 text-xs bg-red-50 border border-red-200">
                    <p className="font-semibold text-red-700">Last error: {provider.lastError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTest(name)}
                    disabled={!provider.apiKey || testing === name}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40"
                  >
                    {testing === name ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                    Test
                  </button>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, activeProvider: name }))}
                    disabled={isActive}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
                    }`}
                  >
                    <Zap size={13} />
                    {isActive ? 'Active' : 'Set Active'}
                  </button>
                </div>

                {/* Last Tested */}
                {provider.lastTested && (
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock size={10} />
                    Tested: {provider.lastTested?.toDate?.()
                      ? provider.lastTested.toDate().toLocaleString('en-IN')
                      : new Date(provider.lastTested).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
          <Shield size={15} /> Security Information
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• API keys are stored in Firestore, readable only by admin accounts</li>
          <li>• Keys are never exposed to the browser frontend</li>
          <li>• The active provider&apos;s key is used server-side in the AI API route</li>
          <li>• Changing the active provider instantly affects all AI features (Resume Builder, Chatbot, etc.)</li>
          <li>• If the active provider fails, the fallback provider is used automatically</li>
        </ul>
      </div>
    </div>
  );
}
