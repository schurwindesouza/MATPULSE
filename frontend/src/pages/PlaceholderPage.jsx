import React from 'react';
import { Layers, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PlaceholderPage({ title, description, phase }) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-950/50">
        <Layers className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
          <span>Roadmap Target:</span>
          <span className="text-indigo-400 font-semibold">{phase || 'Upcoming Phase'}</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-xl text-left max-w-xl mx-auto space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Backend API Capabilities Ready:
        </p>
        <ul className="text-xs text-slate-300 space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>FastAPI Endpoints tested & operational with 32 passing tests</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Synthetic CPSE demo dataset ingested in SQLite</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>AI Pairwise & Batch Matching Engine with explainability active</span>
          </li>
        </ul>
      </div>

      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
