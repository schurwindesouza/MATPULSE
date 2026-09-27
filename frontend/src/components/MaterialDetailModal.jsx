import React, { useEffect } from 'react';
import {
  IconX,
  IconBuilding,
  IconTag,
  IconLayers,
  IconCalendar,
  IconFileText,
  IconShieldCheck,
  IconBoxes,
} from './icons/Icons';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div
        className="relative w-full max-w-3xl glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white border border-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between bg-white/[0.03]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {material.cpse}
              </span>
              <span className="text-xs text-white/50 font-mono">ID: #{material.id}</span>
              <StatusBadge status={material.matching_status} />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-1">
              Material Master Record
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* SECTION 1: PROVENANCE MASTER DATA (Original CPSE Code) */}
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <IconBuilding className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80 font-mono">
                  Original CPSE Catalog Master Data
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-medium">
                Provenance Preserved (Immutable)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-white/50 mb-1">
                  Original Internal Material Code
                </p>
                <div className="p-3 rounded-xl bg-white/[0.05] border border-blue-400/30 font-mono text-sm font-bold text-blue-300 flex items-center justify-between">
                  <span>{material.material_code}</span>
                  <span className="text-[10px] text-white/40">{material.cpse} Internal</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-white/50 mb-1">
                  Enterprise Organization (CPSE)
                </p>
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 text-sm font-semibold text-white">
                  {material.cpse}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-white/50 mb-1">
                Original Catalog Description
              </p>
              <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white/80 leading-relaxed font-sans">
                {material.description}
              </div>
            </div>
          </div>

          {/* SECTION 2: STANDARDIZATION & HARMONIZATION (Common Code) */}
          <div className="p-5 rounded-2xl bg-blue-500/[0.06] border border-blue-400/25 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-400/20">
              <div className="flex items-center gap-2">
                <IconLayers className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-200 font-mono">
                  Harmonization &amp; Standardization
                </h3>
              </div>
              <span className="text-[11px] text-white/50">Cross-CPSE Common Code</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-white/60 mb-1">
                  Common National Material Code
                </p>
                {material.common_material_code ? (
                  <div className="p-3 rounded-xl bg-emerald-500/[0.12] border border-emerald-400/40 font-mono text-sm font-bold text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-500/10">
                    <span>{material.common_material_code}</span>
                    <span className="text-[10px] text-emerald-300 font-sans font-medium">Harmonized</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-xs text-white/40 italic">
                    Not Assigned (Pending AI Review)
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] font-medium text-white/60 mb-1">
                  Harmonization Workflow State
                </p>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <StatusBadge status={material.matching_status} />
                  <span className="text-[10px] text-white/50 font-mono">
                    {material.matching_status === 'MATCHED' ? 'Resolved' : 'Candidate'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SPECIFICATIONS & METADATA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Technical Specification */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                <IconFileText className="w-4 h-4 text-blue-400" />
                <span>Technical Specifications &amp; Standards</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/80 leading-relaxed font-mono">
                {material.technical_specification || 'No standards or dimensions recorded.'}
              </div>
            </div>

            {/* Category */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
              <span className="text-[11px] text-white/50 font-medium">Domain Category</span>
              <p className="text-xs font-semibold text-white font-mono">
                {material.category || 'Uncategorized'}
              </p>
            </div>

            {/* UOM */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
              <span className="text-[11px] text-white/50 font-medium">Unit of Measurement (UOM)</span>
              <p className="text-xs font-semibold text-white font-mono">
                {material.uom || 'N/A'}
              </p>
            </div>

            {/* Annual Quantity */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
              <span className="text-[11px] text-white/50 font-medium">Annual Procurement Quantity</span>
              <p className="text-xs font-semibold text-white font-mono">
                {material.annual_quantity ? material.annual_quantity.toLocaleString() : 'N/A'}{' '}
                {material.uom || ''}
              </p>
            </div>

            {/* Estimated Unit Price */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
              <span className="text-[11px] text-white/50 font-medium">Approx. Unit Price (INR)</span>
              <p className="text-xs font-semibold text-white font-mono">
                {material.approx_unit_price ? `₹ ${material.approx_unit_price.toLocaleString()}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-white/50">
          <span className="font-mono">Created: {new Date(material.created_at).toLocaleDateString()}</span>
          <button
            onClick={onClose}
            className="glass-btn-secondary px-5 py-2 rounded-xl text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
