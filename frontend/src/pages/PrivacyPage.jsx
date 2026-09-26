import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconShieldAlert } from '../components/icons/Icons';

export default function PrivacyPage() {
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
              This document is a technical privacy policy placeholder for SIH Problem Statement 26099. Data handling and
              federated security agreements will be formalized with CPSE enterprise IT custodians.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
            <p className="text-xs text-slate-500 mt-1">Enterprise Master Catalog Handling • SIH 26099</p>
          </div>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <h2 className="text-sm font-semibold text-slate-900">1. Data Ingestion & Isolation</h2>
            <p>
              MATPULSE processes material catalog master specifications (material codes, descriptions, units of measurement,
              technical specifications, and standards). Proprietary internal ERP operational logs, commercial vendor bids,
              and confidential purchase orders are segregated from open candidate indexing.
            </p>

            <h2 className="text-sm font-semibold text-slate-900">2. Synthetic Demonstration Notice</h2>
            <p>
              All demonstration datasets provided within the development prototype are synthetic mock records created
              exclusively for algorithm verification and user interface testing. No real enterprise proprietary catalog data
              has been ingested without explicit administrative authorization.
            </p>

            <h2 className="text-sm font-semibold text-slate-900">3. Audit Trails</h2>
            <p>
              All reviewer recommendations, approvals, rejections, and code assignments generate immutable timestamped audit
              records to maintain accountability across participating enterprise organizations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
