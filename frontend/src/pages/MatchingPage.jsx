import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Cpu,
  Building2,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  Filter,
  RotateCcw,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MatchAnalysisModal from '../components/MatchAnalysisModal';
import matchingService from '../services/matchingService';

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

  // Pipeline summary statistics
  const [pipelineStats, setPipelineStats] = useState(null);

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
      const data = await matchingService.getMatchingStats();
      setPipelineStats(data);
    } catch (err) {
      console.error('Failed to load matching stats', err);
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
  const totalCount = pipelineStats?.total_recommendations ?? matches.length;
  const highConfidenceCount = pipelineStats?.high_confidence_count ?? matches.filter(
    (m) => m.classification === 'HIGH_CONFIDENCE_MATCH'
  ).length;
  const reviewRequiredCount = pipelineStats?.review_required_count ?? matches.filter(
    (m) => m.classification === 'REVIEW_REQUIRED'
  ).length;

  const latestDate = matches[0]?.created_at
    ? new Date(matches[0].created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Material Matching</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/50">
              <Cpu className="w-3 h-3" />
              <span>all-MiniLM-L6-v2</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            AI-powered cross-CPSE material equivalence detection & technical compatibility validation.
          </p>
        </div>

        <button
          onClick={() => fetchMatches()}
          disabled={loading || isGenerating}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all disabled:opacity-50 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Generation Control Card */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Execute Cross-CPSE AI Matching</h2>
            </div>
            <p className="text-xs text-slate-400">
              Evaluates plausible candidate pairs across all ingested CPSE master catalogs, applies domain filters, calculates sentence embeddings, and validates deterministic attributes.
            </p>
          </div>

          {/* Controls & Generate Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Top K Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400 font-medium">Top K:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                disabled={isGenerating}
                className="bg-transparent font-mono font-bold text-indigo-300 focus:outline-none"
              >
                {TOP_K_OPTIONS.map((k) => (
                  <option key={k} value={k} className="bg-slate-900 text-white">
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Confidence Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400 font-medium">Min Conf:</span>
              <select
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                disabled={isGenerating}
                className="bg-transparent font-mono font-bold text-indigo-300 focus:outline-none"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing CPSE material catalogs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Matches</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generation Result Banner */}
        {generationSummary && (
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Matching complete: <strong>{generationSummary.matches_created}</strong> new recommendations created,{' '}
                <strong>{generationSummary.matches_skipped}</strong> duplicate pairs skipped ({generationSummary.total_candidates} candidates above {minConfidence}% confidence).
              </span>
            </div>
            <button
              onClick={() => setGenerationSummary(null)}
              className="text-emerald-400 hover:text-emerald-200 font-mono text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Pipeline Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Last Analysis</span>
            <span className="font-mono text-slate-200 font-semibold mt-0.5 block">{latestDate}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Recommendations</span>
            <span className="font-mono text-indigo-400 font-bold text-sm mt-0.5 block">{totalCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">High Confidence</span>
            <span className="font-mono text-emerald-400 font-bold text-sm mt-0.5 block">{highConfidenceCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Review Required</span>
            <span className="font-mono text-amber-400 font-bold text-sm mt-0.5 block">{reviewRequiredCount}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Filter Queue:</span>
          </span>

          {/* Classification Filter */}
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500/70"
          >
            <option value="">All Classifications</option>
            <option value="HIGH_CONFIDENCE_MATCH">High Confidence</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="LOW_CONFIDENCE">Low Confidence</option>
          </select>

          {/* CPSE Filter */}
          <select
            value={cpseFilter}
            onChange={(e) => setCpseFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500/70"
          >
            <option value="">All CPSEs</option>
            <option value="BHEL">BHEL</option>
            <option value="NTPC">NTPC</option>
            <option value="ONGC">ONGC</option>
            <option value="SAIL">SAIL</option>
            <option value="IOCL">IOCL</option>
            <option value="COAL_INDIA">Coal India</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500/70"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {(classificationFilter || cpseFilter || statusFilter) && (
            <button
              onClick={() => {
                setClassificationFilter('');
                setCpseFilter('');
                setStatusFilter('');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <RotateCcw className="w-3 h-3" />
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
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Matching Operation Failed</p>
              <p className="mt-0.5 text-rose-300/80">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchMatches()}
            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-medium transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Matches List / Cards */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 bg-slate-900/80 border border-slate-800/80 rounded-xl animate-pulse h-28"
            />
          ))
        ) : matches.length > 0 ? (
          matches.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Pair Information */}
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Match #{item.id}
                  </span>
                  <StatusBadge status={item.classification} size="xs" />
                  <StatusBadge status={item.status} size="xs" />
                </div>

                {/* Materials Comparison Snippet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Material A */}
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        {item.material_a.cpse}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-200">
                        {item.material_a.material_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1 font-sans" title={item.material_a.description}>
                      {item.material_a.description}
                    </p>
                  </div>

                  {/* Material B */}
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        {item.material_b.cpse}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-200">
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
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item.reasons[0]}</span>
                    {item.reasons.length > 1 && (
                      <span className="text-slate-500">+{item.reasons.length - 1} more reasons</span>
                    )}
                  </p>
                )}
              </div>

              {/* Confidence Score & Action */}
              <div className="flex items-center lg:flex-col lg:items-end justify-between gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60 flex-shrink-0">
                <div className="text-left lg:text-right">
                  <div className="flex items-baseline gap-1 lg:justify-end">
                    <span className="text-2xl font-bold font-mono text-white tracking-tight">
                      {item.final_confidence}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Confidence
                  </span>
                </div>

                <button
                  onClick={() => setSelectedMatchId(item.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-200 hover:text-indigo-200 border border-slate-700 hover:border-indigo-500/40 text-xs font-semibold transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Analysis</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3">
            <Cpu className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No match recommendations in queue</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Execute the AI Matching engine above to discover cross-CPSE candidate pairs across BHEL, NTPC, ONGC, SAIL, IOCL, and Coal India.
            </p>
            <button
              onClick={handleGenerateMatches}
              disabled={isGenerating}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              <Sparkles className="w-4 h-4" />
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
