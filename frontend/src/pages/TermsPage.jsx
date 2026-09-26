import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconShieldAlert } from '../components/icons/Icons';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-800 transition"
        >
          <IconArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <IconShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold uppercase tracking-wider">DRAFT - REQUIRES REVIEW</p>
            <p className="text-amber-800">
              This document is a technical placeholder for SIH Problem Statement 26099. Official terms and governance
              policies will be established in coordination with participating Central Public Sector Enterprises.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
            <p className="text-xs text-slate-500 mt-1">Platform Prototype Governance • SIH 26099</p>
          </div>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <h2 className="text-sm font-semibold text-slate-900">1. Purpose and Scope</h2>
            <p>
              MATPULSE is an AI-assisted material master standardization prototype developed for Smart India Hackathon
              Problem Statement 26099. Its purpose is to demonstrate automated semantic matching, deterministic rule
              validation, and human-in-the-loop review of engineering material codes across participating CPSEs.
            </p>

            <h2 className="text-sm font-semibold text-slate-900">2. Master Data Provenance</h2>
            <p>
              Participating CPSE catalog items remain the authentic property of their respective enterprise organizations.
              The assignment of Common National Material Codes constitutes an overlay standardization index and does
              not overwrite or invalidate existing enterprise internal material numbers.
            </p>

            <h2 className="text-sm font-semibold text-slate-900">3. Human-in-the-Loop Validation</h2>
            <p>
              AI-generated recommendations reflect algorithmic similarity scoring and do not constitute certified physical
              interchangeability without authorization by designated CPSE domain experts and material managers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
