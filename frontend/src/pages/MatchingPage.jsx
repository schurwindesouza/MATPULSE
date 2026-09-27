import React, { useState, useEffect, useCallback } from 'react';
import {
  IconSparkles,
  IconCpu,
  IconRefresh,
  IconArrowRight,
  IconAlertCircle,
  IconCheckCircle,
  IconEye,
  IconFilter,
  IconRotateCcw,
} from '../components/icons/Icons';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import MatchAnalysisModal from '../components/MatchAnalysisModal';
import matchingService from '../services/matchingService';
import materialService from '../services/materialService';

const TOP_K_OPTIONS = [5, 10, 20];
const MIN_CONF_OPTIONS = [70, 80, 90];

export default function MatchingPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generation options
  const [topK, setTopK] = useState(5);
  const [minConfidence, setMinConfidence] = useState(70);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState(null);

  // Filters for review queue
  const [classificationFilter, setClassificationFilter] = useState('');
  const [cpseFilter, setCpseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected match for analysis modal
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  // Pipeline and catalog summary statistics
  const [pipelineStats, setPipelineStats] = useState(null);
  const [materialStats, setMaterialStats] = useState(null);

  const navigate = useNavigate();

  // Fetch matches from review queue
  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (classificationFilter) params.classification = classificationFilter;
      if (cpseFilter) params.cpse = cpseFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await matchingService.getReviewQueue(params);
      setMatches(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch AI match recommendations');
    } finally {
      setLoading(false);
    }
  }, [classificationFilter, cpseFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const [pStats, mStats] = await Promise.all([
        matchingService.getMatchingStats(),
        materialService.getStats(),
      ]);
      setPipelineStats(pStats);
      setMaterialStats(mStats);
    } catch (err) {
      console.error('Failed to load matching and material stats', err);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    fetchStats();
  }, [fetchMatches, fetchStats]);

  // Trigger batch generation
  const handleGenerateMatches = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setGenerationSummary(null);

      const res = await matchingService.generateMatches({
        top_k: topK,
        min_confidence: minConfidence,
      });

      setGenerationSummary(res);
      // Refresh matches list and pipeline stats
      await Promise.all([fetchMatches(), fetchStats()]);
    } catch (err) {
      setError(err.message || 'Failed to execute AI batch matching');
    } finally {
      setIsGenerating(false);
    }
  };

  // Pipeline summary statistics
  const materialsAnalyzed = materialStats?.total_materials ?? 0;
  const candidateMatchesCount = pipelineStats?.total_recommendations ?? matches.length;
  const highConfidenceCount = pipelineStats?.high_confidence_count ?? matches.filter(
    (m) => m.classification === 'HIGH_CONFIDENCE_MATCH'
  ).length;
  const reviewRequiredCount = pipelineStats?.review_required_count ?? matches.filter(
    (m) => m.classification === 'REVIEW_REQUIRED'
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Local Readability Protection */}
      <div className="glass-header-scrim p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight text-shadow-protect">AI Material Matching</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/15 text-blue-300 border border-blue-400/30">
              <IconCpu className="w-3 h-3 text-blue-400" />
              <span>all-MiniLM-L6-v2</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300/90 mt-1 text-shadow-protect">
            Deterministic rule filtering & transformer embedding equivalence detection across CPSE inventories.
          </p>
        </div>

        <button
          onClick={() => fetchMatches()}
          disabled={loading || isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-btn-secondary text-xs font-semibold text-slate-200 transition-all disabled:opacity-50 self-start sm:self-center"
        >
          <IconRefresh className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Generation Control Card */}
      <div className="p-6 rounded-2xl glass-panel border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-400/30">
                <IconSparkles className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-sm font-bold text-white">Execute Cross-CPSE AI Matching</h2>
            </div>
            <p className="text-xs text-slate-300/80 max-w-2xl">
              Evaluates candidate pairs across ingested enterprise catalogs, enforces category boundaries, calculates cosine similarity, and computes explainability scores.
            </p>
          </div>

          {/* Controls & Generate Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Top K Selector */}
            <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-white/15 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400 font-medium">Top K:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                disabled={isGenerating}
                className="bg-transparent font-mono font-bold text-blue-400 focus:outline-none cursor-pointer"
              >
                {TOP_K_OPTIONS.map((k) => (
                  <option key={k} value={k} className="bg-slate-900 text-white">
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Confidence Selector */}
            <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-white/15 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400 font-medium">Min Conf:</span>
              <select
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                disabled={isGenerating}
                className="bg-transparent font-mono font-bold text-blue-400 focus:outline-none cursor-pointer"
              >
                {MIN_CONF_OPTIONS.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}%
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateMatches}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-btn-primary text-white text-xs font-semibold shadow-[0_0_25px_rgba(59,130,246,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <IconRefresh className="w-4 h-4 animate-spin" />
                  <span>PROCESSING...</span>
                </>
              ) : (
                <>
                  <IconSparkles className="w-4 h-4" />
                  <span>Run AI Harmonization</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Harmonization In-Progress Notice */}
        {isGenerating && (
          <div className="p-4 rounded-xl glass-panel bg-blue-500/15 border border-blue-400/30 text-blue-200 flex items-start gap-3 text-xs shadow-lg animate-pulse">
            <IconRefresh className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white">AI Harmonization in Progress</p>
              <p className="text-blue-200/90 leading-relaxed">
                Analyzing material records and generating cross-CPSE match recommendations... Please keep this page open while the matching engine completes.
              </p>
            </div>
          </div>
        )}

        {/* Generation Result Banner */}
        {generationSummary && (
          <div className="p-4 rounded-xl glass-card bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <IconCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>
                Matching complete: <strong className="text-white">{generationSummary.matches_created}</strong> new recommendations created,{' '}
                <strong className="text-white">{generationSummary.matches_skipped}</strong> duplicate pairs skipped ({generationSummary.total_candidates} candidates above {minConfidence}% confidence).
              </span>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => navigate('/reviews')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg glass-btn-primary text-white font-semibold text-xs transition"
              >
                <span>View Review Queue</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGenerationSummary(null)}
                className="text-emerald-300 hover:text-white font-medium text-xs px-2 py-1 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Pipeline Summary Bar (4 KPI Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="p-4 rounded-xl glass-card bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Materials Analyzed</span>
            <span className="font-mono text-white font-bold text-xl mt-1 block">{materialsAnalyzed}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Material records in catalog</span>
          </div>
          <div className="p-4 rounded-xl glass-card bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Candidate Matches</span>
            <span className="font-mono text-blue-400 font-bold text-xl mt-1 block">{candidateMatchesCount}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">AI cross-CPSE recommendations</span>
          </div>
          <div className="p-4 rounded-xl glass-card bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-medium">High-Confidence</span>
            <span className="font-mono text-emerald-400 font-bold text-xl mt-1 block">{highConfidenceCount}</span>
            <span className="text-[10px] text-emerald-300/70 mt-0.5 block">≥ 85% match confidence</span>
          </div>
          <div className="p-4 rounded-xl glass-card bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-medium">Requiring Review</span>
            <span className="font-mono text-amber-400 font-bold text-xl mt-1 block">{reviewRequiredCount}</span>
            <span className="text-[10px] text-amber-300/70 mt-0.5 block">&lt; 85% match confidence</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <IconFilter className="w-3.5 h-3.5 text-blue-400" />
            <span>Filter Queue:</span>
          </span>

          {/* Classification Filter */}
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900/90 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-white">All Classifications</option>
            <option value="HIGH_CONFIDENCE_MATCH" className="bg-slate-900 text-white">High Confidence</option>
            <option value="REVIEW_REQUIRED" className="bg-slate-900 text-white">Review Required</option>
            <option value="LOW_CONFIDENCE" className="bg-slate-900 text-white">Low Confidence</option>
          </select>

          {/* CPSE Filter */}
          <select
            value={cpseFilter}
            onChange={(e) => setCpseFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900/90 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-white">All CPSEs</option>
            <option value="BHEL" className="bg-slate-900 text-white">BHEL</option>
            <option value="NTPC" className="bg-slate-900 text-white">NTPC</option>
            <option value="ONGC" className="bg-slate-900 text-white">ONGC</option>
            <option value="SAIL" className="bg-slate-900 text-white">SAIL</option>
            <option value="IOCL" className="bg-slate-900 text-white">IOCL</option>
            <option value="COAL_INDIA" className="bg-slate-900 text-white">Coal India</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900/90 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-white">All Statuses</option>
            <option value="PENDING" className="bg-slate-900 text-white">Pending Review</option>
            <option value="APPROVED" className="bg-slate-900 text-white">Approved</option>
            <option value="REJECTED" className="bg-slate-900 text-white">Rejected</option>
          </select>

          {(classificationFilter || cpseFilter || statusFilter) && (
            <button
              onClick={() => {
                setClassificationFilter('');
                setCpseFilter('');
                setStatusFilter('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-btn-secondary text-slate-300 transition"
            >
              <IconRotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          Showing top {matches.length} {pipelineStats ? `of ${pipelineStats.total_recommendations.toLocaleString()}` : ''} recommendations
        </span>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl glass-panel bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-start justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-start gap-2.5">
            <IconAlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-100">Matching Operation Failed</p>
              <p className="mt-0.5 text-rose-200/90">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchMatches()}
            className="px-3 py-1 rounded-lg glass-btn-secondary text-rose-200 font-medium transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Matches List / Cards */}
      <div className="space-y-3.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 glass-panel border border-white/10 rounded-2xl animate-pulse h-28 shadow-lg"
            />
          ))
        ) : matches.length > 0 ? (
          matches.map((item) => (
            <div
              key={item.id}
              className="p-5 glass-panel hover:bg-white/[0.06] border border-white/10 hover:border-blue-400/40 rounded-2xl transition-all duration-300 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Pair Information */}
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    Match #{item.id}
                  </span>
                  <StatusBadge status={item.classification} size="xs" />
                  <StatusBadge status={item.status} size="xs" />
                </div>

                {/* Materials Comparison Snippet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Material A */}
                  <div className="p-3.5 rounded-xl glass-card bg-white/[0.02] border border-white/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {item.material_a.cpse}
                      </span>
                      <span className="font-mono text-xs font-semibold text-white">
                        {item.material_a.material_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1 font-sans" title={item.material_a.description}>
                      {item.material_a.description}
                    </p>
                  </div>

                  {/* Material B */}
                  <div className="p-3.5 rounded-xl glass-card bg-white/[0.02] border border-white/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30">
                        {item.material_b.cpse}
                      </span>
                      <span className="font-mono text-xs font-semibold text-white">
                        {item.material_b.material_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1 font-sans" title={item.material_b.description}>
                      {item.material_b.description}
                    </p>
                  </div>
                </div>

                {/* Primary Reason */}
                {item.reasons && item.reasons.length > 0 && (
                  <p className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item.reasons[0]}</span>
                    {item.reasons.length > 1 && (
                      <span className="text-slate-400">+{item.reasons.length - 1} more reasons</span>
                    )}
                  </p>
                )}
              </div>

              {/* Confidence Score & Action */}
              <div className="flex items-center lg:flex-col lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10 flex-shrink-0">
                <div className="text-left lg:text-right">
                  <div className="flex items-baseline gap-1 lg:justify-end">
                    <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                      {item.final_confidence}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                    Confidence
                  </span>
                </div>

                <button
                  onClick={() => setSelectedMatchId(item.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-btn-secondary text-white hover:text-blue-300 hover:border-blue-400/50 text-xs font-semibold shadow-sm transition"
                >
                  <IconEye className="w-3.5 h-3.5 text-blue-400" />
                  <span>View Analysis</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center glass-panel border border-white/10 rounded-2xl space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              <IconCpu className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white">No match recommendations in queue</h3>
            <p className="text-xs text-slate-300/80 max-w-sm mx-auto">
              Execute the AI Matching engine above to discover cross-CPSE candidate pairs across BHEL, NTPC, ONGC, SAIL, IOCL, and Coal India.
            </p>
            <button
              onClick={handleGenerateMatches}
              disabled={isGenerating}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-btn-primary text-white text-xs font-semibold shadow-[0_0_20px_rgba(59,130,246,0.35)] transition"
            >
              <IconSparkles className="w-4 h-4" />
              <span>Generate AI Matches Now</span>
            </button>
          </div>
        )}
      </div>

      {/* Detailed Analysis Modal */}
      {selectedMatchId && (
        <MatchAnalysisModal
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
        />
      )}
    </div>
  );
}
