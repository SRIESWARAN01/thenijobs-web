'use client';

import { useState } from 'react';
import { Cpu, Zap, Activity, AlertCircle, DollarSign, BarChart3, TrendingUp, RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { orderBy, limit } from 'firebase/firestore';

export default function AdminAIAnalyticsPage() {
  const { data: rawLogs, loading } = useCollection<any>('aiUsageLogs', [
    orderBy('createdAt', 'desc'),
    limit(200)
  ]);

  const totalRequests = rawLogs.length;
  const successfulRequests = rawLogs.filter(l => l.success).length;
  const failedRequests = rawLogs.filter(l => !l.success).length;
  const totalCreditsConsumed = rawLogs.reduce((sum, l) => sum + (l.creditsUsed || 0), 0);

  // Estimate cost ($0.0005 per request on average with Groq Llama 3.3 70B)
  const estimatedCostUSD = (totalRequests * 0.0005).toFixed(4);

  // Group by feature
  const featureCounts: Record<string, number> = {};
  rawLogs.forEach(l => {
    const feat = l.feature || 'unknown';
    featureCounts[feat] = (featureCounts[feat] || 0) + 1;
  });

  return (
    <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto font-outfit text-gray-900 py-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
              Groq Architecture Monitoring
            </span>
            <span className="text-xs text-indigo-200">Production AI Metrics</span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            Admin AI System Analytics <Cpu size={22} className="text-emerald-400" />
          </h1>
          <p className="text-xs text-indigo-100/80">
            Real-time server-side tracking of Groq API requests, credit deductions, error rates, &amp; estimated cost.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-right">
            <p className="text-[10px] uppercase font-bold text-indigo-200">Active Model</p>
            <p className="text-xs font-black text-emerald-400">llama-3.3-70b-versatile</p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-bold text-gray-500">Total AI Requests</span>
            <Activity size={18} />
          </div>
          <p className="text-2xl font-black text-gray-900">{loading ? '...' : totalRequests.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">{successfulRequests} Successful ({totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 100}%)</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold text-gray-500">AI Credits Consumed</span>
            <Zap size={18} />
          </div>
          <p className="text-2xl font-black text-gray-900">{loading ? '...' : totalCreditsConsumed.toLocaleString()}</p>
          <p className="text-[11px] text-gray-500 font-medium">Credits deducted on success</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs font-bold text-gray-500">Failed AI Requests</span>
            <AlertCircle size={18} />
          </div>
          <p className="text-2xl font-black text-gray-900">{loading ? '...' : failedRequests}</p>
          <p className="text-[11px] text-gray-500 font-medium">No credits charged on failure</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-cyan-600">
            <span className="text-xs font-bold text-gray-500">Est. Groq Usage Cost</span>
            <DollarSign size={18} />
          </div>
          <p className="text-2xl font-black text-gray-900">${loading ? '...' : estimatedCostUSD}</p>
          <p className="text-[11px] text-cyan-700 font-semibold">High Efficiency Llama-3.3 Model</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Breakdown Chart / List */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-600" /> Usage by AI Feature
          </h3>

          <div className="space-y-3">
            {Object.keys(featureCounts).length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4 text-center">No logged requests yet.</p>
            ) : (
              Object.entries(featureCounts).map(([feat, count]) => {
                const percent = Math.round((count / Math.max(1, totalRequests)) * 100);
                return (
                  <div key={feat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                      <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                      <span>{count} req ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Logs Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Activity size={16} className="text-emerald-600" /> Recent Server-Side Execution Logs
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Feature</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Credits</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">Loading logs...</td>
                  </tr>
                ) : rawLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">No logs found</td>
                  </tr>
                ) : (
                  rawLogs.slice(0, 8).map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 font-bold text-gray-800 capitalize">
                        {(log.feature || '').replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 text-gray-600 font-semibold">{log.role || 'SEEKER'}</td>
                      <td className="py-2.5 text-emerald-700 font-bold">-{log.creditsUsed || 1}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
