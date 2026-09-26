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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div
        className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                {material.cpse}
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: #{material.id}</span>
              <StatusBadge status={material.matching_status} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
              Material Master Record
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* SECTION 1: PROVENANCE MASTER DATA (Original CPSE Code) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <IconBuilding className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Original CPSE Catalog Master Data
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                Provenance Preserved (Immutable)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-slate-500 mb-1">
                  Original Internal Material Code
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-blue-200 font-mono text-sm font-bold text-blue-800 flex items-center justify-between shadow-sm">
                  <span>{material.material_code}</span>
                  <span className="text-[10px] text-slate-500">{material.cpse} Internal</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-500 mb-1">
                  Enterprise Organization (CPSE)
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-900 shadow-sm">
                  {material.cpse}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-500 mb-1">
                Original Catalog Description
              </p>
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans shadow-sm">
                {material.description}
              </div>
            </div>
          </div>

          {/* SECTION 2: STANDARDIZATION & HARMONIZATION (Common Code) */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
              <div className="flex items-center gap-2">
                <IconLayers className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-950">
                  Harmonization &amp; Standardization
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">Cross-CPSE Common Code</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-slate-600 mb-1">
                  Common National Material Code
                </p>
                {material.common_material_code ? (
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-300 font-mono text-sm font-bold text-emerald-800 flex items-center justify-between shadow-sm">
                    <span>{material.common_material_code}</span>
                    <span className="text-[10px] text-emerald-700 font-sans">Harmonized</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-xs text-slate-400 italic">
                    Not Assigned (Pending AI Review)
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-600 mb-1">
                  Harmonization Workflow State
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                  <StatusBadge status={material.matching_status} />
                  <span className="text-[10px] text-slate-500 font-mono">
                    {material.matching_status === 'MATCHED' ? 'Resolved' : 'Candidate'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SPECIFICATIONS & METADATA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Technical Specification */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <IconFileText className="w-4 h-4 text-blue-700" />
                <span>Technical Specifications &amp; Standards</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed font-mono shadow-sm">
                {material.technical_specification || 'No standards or dimensions recorded.'}
              </div>
            </div>

            {/* Category */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Domain Category</span>
              <p className="text-xs font-semibold text-slate-800 font-mono">
                {material.category || 'Uncategorized'}
              </p>
            </div>

            {/* UOM */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Unit of Measurement (UOM)</span>
              <p className="text-xs font-semibold text-slate-800 font-mono">
                {material.uom || 'N/A'}
              </p>
            </div>

            {/* Annual Quantity */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Annual Procurement Quantity</span>
              <p className="text-xs font-semibold text-slate-800 font-mono">
                {material.annual_quantity ? material.annual_quantity.toLocaleString() : 'N/A'}{' '}
                {material.uom || ''}
              </p>
            </div>

            {/* Estimated Unit Price */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Approx. Unit Price (INR)</span>
              <p className="text-xs font-semibold text-slate-800 font-mono">
                {material.approx_unit_price ? `₹ ${material.approx_unit_price.toLocaleString()}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono">Created: {new Date(material.created_at).toLocaleDateString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
