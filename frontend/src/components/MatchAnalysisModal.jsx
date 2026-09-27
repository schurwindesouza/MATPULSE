import React, { useState, useEffect } from 'react';
import {
  IconX,
  IconCpu,
  IconBuilding,
  IconCheckCircle,
  IconAlertTriangle,
  IconHelpCircle,
  IconExternalLink,
  IconLayers,
  IconArrowRight,
  IconTrendingUp,
} from './icons/Icons';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import matchingService from '../services/matchingService';

export default function MatchAnalysisModal({ matchId, onClose }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function fetchDetails() {
      try {
        setLoading(true);
        setError(null);
        const data = await matchingService.getMatchDetails(matchId);
        if (isMounted) setMatchData(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load match details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (matchId) {
      fetchDetails();
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [matchId, onClose]);

  const handleOpenReviewQueue = () => {
    onClose();
    navigate(`/review-queue?match_id=${matchId}`);
  };

  if (!matchId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div
        className="relative w-full max-w-5xl glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white border border-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03] sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <IconCpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  AI Match Explainability Analysis
                </h2>
                <span className="font-mono text-xs text-white/70 bg-white/[0.08] px-2.5 py-0.5 rounded-full border border-white/10">
                  Match #{matchId}
                </span>
                {matchData && <StatusBadge status={matchData.status} size="xs" />}
              </div>
              <p className="text-xs text-white/50">
                Cross-CPSE deterministic compatibility and transformer embedding cosine similarity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenReviewQueue}
              className="glass-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer"
              title="Navigate to Review Queue"
            >
              <span>Open in Review Queue</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent animate-spin rounded-full mx-auto" />
              <p className="text-xs text-white/50">Loading AI explainability metrics...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs flex items-center gap-2">
              <IconAlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : matchData ? (
            <>
              {/* Composite Score Banner */}
              <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50 font-mono">
                      Weighted Composite Confidence
                    </span>
                    <StatusBadge status={matchData.classification} size="xs" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-white">
                      {matchData.final_confidence}%
                    </span>
                    <span className="text-xs text-white/50">
                      (High-confidence candidate for human validation)
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Pill Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                    <p className="text-[10px] text-white/50 uppercase font-semibold">Semantic (45%)</p>
                    <p className="text-sm font-bold font-mono text-blue-400 mt-0.5">
                      {matchData.semantic_score}%
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                    <p className="text-[10px] text-white/50 uppercase font-semibold">Technical (40%)</p>
                    <p className="text-sm font-bold font-mono text-indigo-400 mt-0.5">
                      {matchData.technical_score}%
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                    <p className="text-[10px] text-white/50 uppercase font-semibold">Category (10%)</p>
                    <p className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                      {matchData.category_score}%
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                    <p className="text-[10px] text-white/50 uppercase font-semibold">UOM (5%)</p>
                    <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                      {matchData.uom_score}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Material Records */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Material A */}
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {matchData.material_a?.cpse}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {matchData.material_a?.material_code}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">Material A (Ref)</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <p className="text-[10px] font-medium text-white/40 uppercase">Description</p>
                      <p className="text-white/90 font-medium mt-0.5">
                        {matchData.material_a?.description}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-medium text-white/40 uppercase">Technical Specs</p>
                      <p className="text-white/70 font-mono text-[11px] mt-0.5">
                        {matchData.material_a?.technical_specification || 'None'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      <div>
                        <span className="text-[10px] text-white/40">Category: </span>
                        <span className="font-semibold text-white/80">{matchData.material_a?.category}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40">UOM: </span>
                        <span className="font-semibold text-white/80">{matchData.material_a?.uom}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Material B */}
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {matchData.material_b?.cpse}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {matchData.material_b?.material_code}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">Material B (Candidate)</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <p className="text-[10px] font-medium text-white/40 uppercase">Description</p>
                      <p className="text-white/90 font-medium mt-0.5">
                        {matchData.material_b?.description}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-medium text-white/40 uppercase">Technical Specs</p>
                      <p className="text-white/70 font-mono text-[11px] mt-0.5">
                        {matchData.material_b?.technical_specification || 'None'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      <div>
                        <span className="text-[10px] text-white/40">Category: </span>
                        <span className="font-semibold text-white/80">{matchData.material_b?.category}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40">UOM: </span>
                        <span className="font-semibold text-white/80">{matchData.material_b?.uom}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability Reasons & Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supporting Reasons */}
                <div className="p-5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-400/30 space-y-2 shadow-lg shadow-emerald-500/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wide">
                    <IconCheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Supporting Equivalence Factors</span>
                  </div>
                  <ul className="text-xs text-white/80 space-y-1.5 list-disc list-inside">
                    {matchData.reasons && matchData.reasons.length > 0 ? (
                      matchData.reasons.map((r, i) => <li key={i}>{r}</li>)
                    ) : (
                      <li className="text-white/40 italic">No specific reasons generated.</li>
                    )}
                  </ul>
                </div>

                {/* Warnings / Discrepancies */}
                <div className="p-5 rounded-2xl bg-amber-500/[0.08] border border-amber-400/30 space-y-2 shadow-lg shadow-amber-500/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                    <IconAlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Risk Factors &amp; Warnings</span>
                  </div>
                  <ul className="text-xs text-white/80 space-y-1.5 list-disc list-inside">
                    {matchData.warnings && matchData.warnings.length > 0 ? (
                      matchData.warnings.map((w, i) => <li key={i}>{w}</li>)
                    ) : (
                      <li className="text-emerald-300 italic list-none flex items-center gap-1.5">
                        <IconCheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>No critical attribute discrepancies flagged.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Attribute Comparison Matrix */}
              {matchData.attribute_comparison && Object.keys(matchData.attribute_comparison).length > 0 && (
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                    <span className="font-bold uppercase tracking-wider text-white/70 font-mono">
                      Deterministic Attribute Compatibility Matrix
                    </span>
                    <span className="text-[11px] text-white/40 font-mono">
                      {Object.keys(matchData.attribute_comparison).length} Parsed Parameters
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {Object.entries(matchData.attribute_comparison).map(([attr, status]) => {
                      const isMatch = status === 'MATCH';
                      const isMismatch = status === 'MISMATCH';
                      return (
                        <div
                          key={attr}
                          className="p-3 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-between shadow-sm"
                        >
                          <span className="text-xs font-medium text-white/80 capitalize">{attr}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                              isMatch
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                : isMismatch
                                ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                                : 'bg-slate-500/20 text-slate-300 border-slate-400/40'
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-white/50">
          <span className="font-mono">MATPULSE AI Explainability Model</span>
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
