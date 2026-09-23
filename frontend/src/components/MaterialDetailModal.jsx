import React, { useEffect } from 'react';
import {
  X,
  Building2,
  Tag,
  Layers,
  Hash,
  Scale,
  Calendar,
  IndianRupee,
  FileText,
  ShieldCheck,
  Sparkles,
  Barcode,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function MaterialDetailModal({ material, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!material) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/90">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                {material.cpse}
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: #{material.id}</span>
              <StatusBadge status={material.matching_status} />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-1">
              Material Master Record
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* SECTION 1: PROVENANCE MASTER DATA (Original CPSE Code) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Original CPSE Catalog Master Data
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                Provenance Preserved (Immutable)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-slate-400 mb-1">
                  Original Internal Material Code
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-indigo-500/30 font-mono text-sm font-bold text-indigo-300 flex items-center justify-between">
                  <span>{material.material_code}</span>
                  <span className="text-[10px] text-slate-500">{material.cpse} Internal</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400 mb-1">
                  Enterprise Organization (CPSE)
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm font-semibold text-white">
                  {material.cpse}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-1">
                Original Catalog Description
              </p>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                {material.description}
              </div>
            </div>

            {material.technical_specification && (
              <div>
                <p className="text-[11px] font-medium text-slate-400 mb-1">
                  Technical Specifications & Standards
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
                  {material.technical_specification}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block">Category</span>
                <span className="text-xs font-medium text-slate-200 truncate block mt-0.5">
                  {material.category || '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block">Unit of Measure</span>
                <span className="text-xs font-mono font-medium text-indigo-300 block mt-0.5">
                  {material.uom || '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block">Annual Quantity</span>
                <span className="text-xs font-mono text-slate-200 block mt-0.5">
                  {material.annual_quantity ? material.annual_quantity.toLocaleString() : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block">Approx Unit Price</span>
                <span className="text-xs font-mono text-emerald-400 block mt-0.5">
                  {material.approx_unit_price ? `₹${material.approx_unit_price.toLocaleString()}` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: STANDARDIZATION & HARMONIZATION (Common National Code) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Standardization & National Harmonization
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-400 border border-indigo-800/40">
                SIH Problem Statement 26099
              </span>
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-1">
                Common National Material Code (NMC)
              </p>
              {material.common_material_code ? (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Barcode className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="font-mono text-sm font-bold text-emerald-300 tracking-wider">
                        {material.common_material_code}
                      </span>
                      <p className="text-[10px] text-emerald-400/80">
                        Unified National Standard Code
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                    HARMONIZED
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="italic">No Common National Material Code assigned yet</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/40 text-amber-400 border border-amber-800/40">
                    PENDING HARMONIZATION
                  </span>
                </div>
              )}
            </div>

            {material.normalized_description && (
              <div>
                <p className="text-[11px] font-medium text-slate-400 mb-1">
                  AI Normalized Description (Standardized Token Sequence)
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
                  {material.normalized_description}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: AUDIT TIMESTAMPS */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 px-1">
            <span>Created: {new Date(material.created_at).toLocaleString()}</span>
            <span>Last Updated: {new Date(material.updated_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
