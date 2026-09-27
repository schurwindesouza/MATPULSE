import React from 'react';
import { IconLayers, IconArrowLeft } from '../components/icons/Icons';
import { Link } from 'react-router-dom';

export default function PlaceholderPage({ title, description, phase }) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-400/30 text-blue-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(59,130,246,0.3)]">
        <IconLayers className="w-8 h-8" />
      </div>

      <div className="space-y-2 glass-header-scrim p-6 max-w-xl mx-auto shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-mono border border-white/10">
          <span>Roadmap Target:</span>
          <span className="text-blue-400 font-semibold">{phase || 'Upcoming Phase'}</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight text-shadow-protect">{title}</h1>
        <p className="text-sm text-slate-300/90 max-w-lg mx-auto leading-relaxed text-shadow-protect">
          {description}
        </p>
      </div>

      <div className="p-6 glass-panel border border-white/10 rounded-2xl text-left max-w-xl mx-auto space-y-3 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Backend API Capabilities Ready:
        </p>
        <ul className="text-xs text-slate-300 space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>FastAPI Endpoints tested & operational with 43 passing tests</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>Synthetic CPSE demo dataset ingested in SQLite</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>AI Pairwise & Batch Matching Engine with explainability active</span>
          </li>
        </ul>
      </div>

      <div className="pt-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-btn-primary text-white text-xs font-semibold shadow-[0_0_20px_rgba(59,130,246,0.35)] transition"
        >
          <IconArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
