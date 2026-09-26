import React from 'react';
import { IconLayers, IconArrowLeft } from '../components/icons/Icons';
import { Link } from 'react-router-dom';

export default function PlaceholderPage({ title, description, phase }) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
        <IconLayers className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200">
          <span>Roadmap Target:</span>
          <span className="text-blue-700 font-semibold">{phase || 'Upcoming Phase'}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-xl text-left max-w-xl mx-auto space-y-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Backend API Capabilities Ready:
        </p>
        <ul className="text-xs text-slate-700 space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>FastAPI Endpoints tested & operational with 43 passing tests</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Synthetic CPSE demo dataset ingested in SQLite</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>AI Pairwise & Batch Matching Engine with explainability active</span>
          </li>
        </ul>
      </div>

      <div className="pt-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition"
        >
          <IconArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
