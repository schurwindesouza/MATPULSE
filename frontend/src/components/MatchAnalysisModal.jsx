import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Cpu,
  Building2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
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
    navigate('/review-queue');
  };

  if (!matchId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/40">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  AI Match Explainability Analysis
                </h2>
                <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Match #{matchId}
                </span>
                {matchData && <StatusBadge status={matchData.status} size="xs" />}
              </div>
              <p className="text-xs text-slate-400">
                Cross-CPSE deterministic compatibility and transformer embedding cosine similarity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenReviewQueue}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow-sm"
              title="Navigate to Review Queue"
            >
              <span>Open in Review Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full" />
              <p className="text-xs text-slate-400">Loading AI score breakdown & catalog specifications...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              <p className="font-semibold text-rose-200">Failed to load match analysis</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : matchData ? (
            <>
              {/* COMPOSITE AI SCORE BANNER */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Combined Match Confidence
                  </span>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                      {matchData.final_confidence}%
                    </span>
                    <StatusBadge status={matchData.classification} />
                  </div>
                  <p className="text-xs text-slate-400">
                    Classification determined by weighted multi-criteria decision algorithm.
                  </p>
                </div>

                {/* Score Breakdown Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
                  {/* Semantic */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 min-w-[120px]">
                    <span className="text-[10px] text-slate-400 block font-medium">Semantic Similarity</span>
                    <span className="text-base font-bold text-indigo-400 font-mono">
                      {matchData.semantic_score}%
                    </span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, matchData.semantic_score)}%` }}
                      />
                    </div>
                  </div>

                  {/* Technical */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 min-w-[120px]">
                    <span className="text-[10px] text-slate-400 block font-medium">Technical Rules</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      {matchData.technical_score}%
                    </span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, matchData.technical_score)}%` }}
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 min-w-[120px]">
                    <span className="text-[10px] text-slate-400 block font-medium">Category Group</span>
                    <span className="text-base font-bold text-cyan-400 font-mono">
                      {matchData.category_score}%
                    </span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, matchData.category_score)}%` }}
                      />
                    </div>
                  </div>

                  {/* UOM */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 min-w-[120px]">
                    <span className="text-[10px] text-slate-400 block font-medium">UOM Compatibility</span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {matchData.uom_score}%
                    </span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, matchData.uom_score)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SIDE-BY-SIDE MATERIAL PROVENANCE CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Material A (Source CPSE) */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-xs text-white">Source Material A</span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/60">
                      {matchData.material_a.cpse}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Original CPSE Material Code (Immutable)
                    </span>
                    <div className="p-2 rounded bg-slate-900 border border-indigo-500/30 font-mono text-xs font-bold text-indigo-300">
                      {matchData.material_a.material_code}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Original Description
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800 font-sans">
                      {matchData.material_a.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Technical Specification
                    </span>
                    <p className="text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded border border-slate-800 leading-relaxed">
                      {matchData.material_a.technical_specification || 'No explicit spec string'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Category</span>
                      <span className="font-medium text-slate-300 truncate block mt-0.5">
                        {matchData.material_a.category || '—'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Unit of Measure</span>
                      <span className="font-mono font-medium text-indigo-300 block mt-0.5">
                        {matchData.material_a.uom || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Material B (Matched Candidate CPSE) */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-xs text-white">Matched Material B</span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/60">
                      {matchData.material_b.cpse}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Original CPSE Material Code (Immutable)
                    </span>
                    <div className="p-2 rounded bg-slate-900 border border-indigo-500/30 font-mono text-xs font-bold text-indigo-300">
                      {matchData.material_b.material_code}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Original Description
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800 font-sans">
                      {matchData.material_b.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Technical Specification
                    </span>
                    <p className="text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded border border-slate-800 leading-relaxed">
                      {matchData.material_b.technical_specification || 'No explicit spec string'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Category</span>
                      <span className="font-medium text-slate-300 truncate block mt-0.5">
                        {matchData.material_b.category || '—'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Unit of Measure</span>
                      <span className="font-mono font-medium text-indigo-300 block mt-0.5">
                        {matchData.material_b.uom || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TECHNICAL ATTRIBUTE COMPARISON MATRIX */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Deterministic Attribute Verification Matrix
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Extracted via Domain Regular Expression Rules
                  </span>
                </div>

                {matchData.attribute_comparison && Object.keys(matchData.attribute_comparison).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {Object.entries(matchData.attribute_comparison).map(([attr, status]) => {
                      const isMatch = status === 'MATCH';
                      const isMismatch = status === 'MISMATCH';

                      return (
                        <div
                          key={attr}
                          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                            isMatch
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                              : isMismatch
                              ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="font-mono text-[11px] capitalize truncate mr-2">
                            {attr.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isMatch
                                ? 'bg-emerald-900/40 text-emerald-400'
                                : isMismatch
                                ? 'bg-rose-900/40 text-rose-400'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isMatch && <CheckCircle2 className="w-3 h-3" />}
                            {isMismatch && <AlertTriangle className="w-3 h-3" />}
                            {!isMatch && !isMismatch && <HelpCircle className="w-3 h-3" />}
                            <span>{status}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No attribute comparison map available.</p>
                )}
              </div>

              {/* REASONS AND WARNINGS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Positive Match Reasons */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-800/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Match Affirmations ({matchData.reasons?.length || 0})
                    </h3>
                  </div>
                  {matchData.reasons && matchData.reasons.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {matchData.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No specific affirmative reasons recorded.</p>
                  )}
                </div>

                {/* Warnings / Discrepancy Notices */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-800/60">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                      Discrepancies & Warnings ({matchData.warnings?.length || 0})
                    </h3>
                  </div>
                  {matchData.warnings && matchData.warnings.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-amber-200">
                      {matchData.warnings.map((warning, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-amber-950/20 p-1.5 rounded border border-amber-900/30">
                          <span className="text-amber-400 font-bold mt-0.5">!</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No technical discrepancies or warnings flagged.</p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            Model: all-MiniLM-L6-v2 • Cosine Similarity Metric
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenReviewQueue}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
            >
              Open in Review Queue
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
