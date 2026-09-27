import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconShieldAlert } from '../components/icons/Icons';

export default function PrivacyPage() {
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
              This document is a technical privacy policy placeholder for MATPULSE. Data handling and
              federated security agreements will be formalized with CPSE enterprise IT custodians.
            </p>
          </div>
        </div>

        <div className="glass-panel border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-white text-shadow-protect">Privacy Policy</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">Enterprise Master Catalog Handling</p>
          </div>

          <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
            <div>
              <h2 className="text-sm font-bold text-white mb-1.5">1. Data Ingestion & Isolation</h2>
              <p className="text-slate-300/90">
                MATPULSE processes material catalog master specifications (material codes, descriptions, units of measurement,
                technical specifications, and standards). Proprietary internal ERP operational logs, commercial vendor bids,
                and confidential purchase orders are segregated from open candidate indexing.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-bold text-white mb-1.5">2. Synthetic Demonstration Notice</h2>
              <p className="text-slate-300/90">
                All demonstration datasets provided within the development prototype are synthetic mock records created
                exclusively for algorithm verification and user interface testing. No real enterprise proprietary catalog data
                has been ingested without explicit administrative authorization.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-bold text-white mb-1.5">3. Audit Trails</h2>
              <p className="text-slate-300/90">
                All reviewer recommendations, approvals, rejections, and code assignments generate immutable timestamped audit
                records to maintain accountability across participating enterprise organizations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
