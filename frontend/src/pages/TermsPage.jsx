import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconShieldAlert } from '../components/icons/Icons';

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
        >
          <IconArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>

        <div className="p-4 rounded-2xl glass-panel bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3 shadow-lg">
          <IconShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold uppercase tracking-wider text-amber-300">DRAFT - REQUIRES REVIEW</p>
            <p className="text-amber-200/90 leading-relaxed">
              This document is a technical placeholder for MATPULSE. Official terms and governance
              policies will be established in coordination with participating Central Public Sector Enterprises.
            </p>
          </div>
        </div>

        <div className="glass-panel border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-white text-shadow-protect">Terms of Service</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">Platform Prototype Governance</p>
          </div>

          <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
            <div>
              <h2 className="text-sm font-bold text-white mb-1.5">1. Purpose and Scope</h2>
              <p className="text-slate-300/90">
                MATPULSE is an AI-assisted material master standardization platform. Its purpose is to demonstrate automated
                semantic matching, deterministic rule validation, and human-in-the-loop review of engineering material codes
                across participating CPSEs.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-bold text-white mb-1.5">2. Master Data Provenance</h2>
              <p className="text-slate-300/90">
                Participating CPSE catalog items remain the authentic property of their respective enterprise organizations.
                The assignment of Common National Material Codes constitutes an overlay standardization index and does
                not overwrite or invalidate existing enterprise internal material numbers.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-bold text-white mb-1.5">3. Human-in-the-Loop Validation</h2>
              <p className="text-slate-300/90">
                AI-generated recommendations reflect algorithmic similarity scoring and do not constitute certified physical
                interchangeability without authorization by designated CPSE domain experts and material managers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
