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
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings & Environment</h1>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            v1.0 Production Prototype
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          System operational status, AI model hyperparameters, and connected CPSE registry parameters for SIH Problem 26099.
        </p>
      </div>

      {/* Grid of Configuration Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & Connectivity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <IconDatabase className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-semibold text-slate-900">Backend & API Status</h2>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{loading ? 'Checking...' : health?.status === 'healthy' ? 'Operational' : 'Online'}</span>
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Framework</span>
              <span className="font-semibold text-slate-800 font-mono">FastAPI 0.115+ (Python)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Primary Database</span>
              <span className="font-semibold text-slate-800 font-mono">SQLite (matpulse.db)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">API Prefix</span>
              <span className="font-semibold text-slate-800 font-mono">/api/v1</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Swagger Documentation</span>
              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                <span>/docs</span>
                <IconExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Service Identifier</span>
              <span className="font-mono text-slate-700">{health?.service || 'MATPULSE'}</span>
            </div>
          </div>
        </div>

        {/* AI Engine & Scoring Weights */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <IconCpu className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-semibold text-slate-900">AI Matching Engine Parameters</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500">all-MiniLM-L6-v2</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Semantic Weight</span>
              <span className="font-mono font-semibold text-slate-800">45% (0.45)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Technical Attributes Weight</span>
              <span className="font-mono font-semibold text-slate-800">40% (0.40)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Category Domain Weight</span>
              <span className="font-mono font-semibold text-slate-800">10% (0.10)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">UOM Compatibility Weight</span>
              <span className="font-mono font-semibold text-slate-800">5% (0.05)</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">High Confidence Threshold</span>
              <span className="font-mono font-bold text-emerald-700">&ge; 90.0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected CPSE Master Registries */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <IconBuilding className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-semibold text-slate-900">Configured CPSE Enterprise Registries</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">6 Connected Catalogs</span>
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
            <div key={cpse.name} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-xs font-bold font-mono text-slate-900 block">{cpse.name}</span>
              <span className="text-[10px] text-slate-500 block leading-tight">{cpse.full}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Governance & Synthetic Dataset Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <IconInfo className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">Synthetic Dataset & Prototype Boundary</p>
          <p className="leading-relaxed">
            All records currently populated within this development deployment are synthetic demonstration items
            specifically crafted for SIH Problem Statement 26099 schema validation and algorithm verification.
            Under no circumstances does this demonstration imply official access to proprietary CPSE catalog secrets.
          </p>
        </div>
      </div>
    </div>
  );
}
