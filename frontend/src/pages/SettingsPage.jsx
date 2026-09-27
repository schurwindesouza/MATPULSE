import React, { useState, useEffect } from 'react';
import {
  IconSettings,
  IconShieldCheck,
  IconDatabase,
  IconCpu,
  IconBuilding,
  IconExternalLink,
  IconRefresh,
  IconCheckCircle,
  IconInfo,
} from '../components/icons/Icons';
import materialService from '../services/materialService';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        setLoading(true);
        const res = await materialService.checkHealth();
        setHealth(res);
      } catch (err) {
        setHealth({ status: 'error', detail: err.message });
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header with Local Readability Protection */}
      <div className="glass-header-scrim p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight text-shadow-protect">Platform Settings & Environment</h1>
            <span className="px-3 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/15 text-blue-300 border border-blue-400/30 font-semibold">
              v1.0 Production Prototype
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300/90 mt-1 text-shadow-protect">
            System operational status, AI model hyperparameters, and connected CPSE registry parameters.
          </p>
        </div>
      </div>

      {/* Grid of Configuration Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & Connectivity */}
        <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-400/30">
                <IconDatabase className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white">Backend & API Status</h2>
            </div>
            <span className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              <span>{loading ? 'Checking...' : health?.status === 'healthy' ? 'Operational' : 'Online'}</span>
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Framework</span>
              <span className="font-semibold text-white font-mono">FastAPI 0.115+ (Python)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Primary Database</span>
              <span className="font-semibold text-white font-mono">SQLite (matpulse.db)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">API Prefix</span>
              <span className="font-semibold text-white font-mono">/api/v1</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Swagger Documentation</span>
              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
              >
                <span>/docs</span>
                <IconExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Service Identifier</span>
              <span className="font-mono text-slate-300">{health?.service || 'MATPULSE'}</span>
            </div>
          </div>
        </div>

        {/* AI Engine & Scoring Weights */}
        <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-400/30">
                <IconCpu className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white">AI Matching Engine Parameters</h2>
            </div>
            <span className="text-[11px] font-mono text-blue-300 bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-400/30">
              all-MiniLM-L6-v2
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Semantic Weight</span>
              <span className="font-mono font-semibold text-white">45% (0.45)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Technical Attributes Weight</span>
              <span className="font-mono font-semibold text-white">40% (0.40)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Category Domain Weight</span>
              <span className="font-mono font-semibold text-white">10% (0.10)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">UOM Compatibility Weight</span>
              <span className="font-mono font-semibold text-white">5% (0.05)</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">High Confidence Threshold</span>
              <span className="font-mono font-bold text-emerald-400">&ge; 90.0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected CPSE Master Registries */}
      <div className="glass-panel border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-400/30">
              <IconBuilding className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Configured CPSE Enterprise Registries</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">6 Connected Catalogs</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'BHEL', full: 'Bharat Heavy Electricals Ltd' },
            { name: 'NTPC', full: 'NTPC Limited' },
            { name: 'ONGC', full: 'Oil & Natural Gas Corp' },
            { name: 'SAIL', full: 'Steel Authority of India' },
            { name: 'IOCL', full: 'Indian Oil Corporation' },
            { name: 'COAL_INDIA', full: 'Coal India Limited' },
          ].map((cpse) => (
            <div key={cpse.name} className="p-3.5 rounded-xl glass-card bg-white/[0.02] border border-white/10 text-center space-y-1.5">
              <span className="text-xs font-bold font-mono text-white block">{cpse.name}</span>
              <span className="text-[10px] text-slate-400 block leading-tight">{cpse.full}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Governance & Synthetic Dataset Notice */}
      <div className="p-4 rounded-xl glass-panel bg-blue-500/10 border border-blue-400/20 flex items-start gap-3 text-xs text-slate-300 shadow-md">
        <IconInfo className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Synthetic Dataset & Prototype Boundary</p>
          <p className="leading-relaxed text-slate-300/90">
            All records currently populated within this development deployment are synthetic demonstration items
            specifically crafted for cross-CPSE schema validation and algorithm verification.
            Under no circumstances does this demonstration imply official access to proprietary CPSE catalog secrets.
          </p>
        </div>
      </div>
    </div>
  );
}
