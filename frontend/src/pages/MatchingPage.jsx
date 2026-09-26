import React, { useState, useEffect, useCallback } from 'react';
import {
  IconSparkles,
  IconCpu,
  IconBuilding,
  IconRefresh,
  IconLayers,
  IconArrowRight,
  IconAlertCircle,
  IconCheckCircle,
  IconEye,
  IconFilter,
  IconRotateCcw,
} from '../components/icons/Icons';
import { useNavigate, Link } from 'react-router-dom';
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

  const latestDate = matches[0]?.created_at
    ? new Date(matches[0].created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Material Matching</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
              <IconCpu className="w-3 h-3" />
              <span>all-MiniLM-L6-v2</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Deterministic rule filtering & transformer embedding equivalence detection across CPSE inventories.
          </p>
        </div>

        <button
          onClick={() => fetchMatches()}
          disabled={loading || isGenerating}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700 shadow-sm transition-all disabled:opacity-50 self-start sm:self-center"
        >
          <IconRefresh className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Generation Control Card */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <IconSparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Execute Cross-CPSE AI Matching</h2>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Evaluates candidate pairs across ingested enterprise catalogs, enforces category boundaries, calculates cosine similarity, and computes explainability scores.
            </p>
          </div>

          {/* Controls & Generate Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Top K Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700">
              <span className="text-[11px] text-slate-500 font-medium">Top K:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                disabled={isGenerating}
                className="bg-transparent font-mono font-bold text-blue-700 focus:outline-none"
              >
                {TOP_K_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Confidence Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700">
              <span className="text-[11px] text-slate-500 font-medium">Min Conf:</span>
              <select
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                disabled={isGenerating}
                className="bg-transparent font-mono font-bold text-blue-700 focus:outline-none"
              >
                {MIN_CONF_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}%
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateMatches}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3 text-xs shadow-sm">
            <IconRefresh className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-900">AI Harmonization in Progress</p>
              <p className="text-blue-800 leading-relaxed">
                Analyzing material records and generating cross-CPSE match recommendations... Please keep this page open while the matching engine completes.
              </p>
            </div>
          </div>
        )}

        {/* Generation Result Banner */}
        {generationSummary && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <IconCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>
                Matching complete: <strong>{generationSummary.matches_created}</strong> new recommendations created,{' '}
                <strong>{generationSummary.matches_skipped}</strong> duplicate pairs skipped ({generationSummary.total_candidates} candidates above {minConfidence}% confidence).
              </span>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => navigate('/reviews')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-sm transition"
              >
                <span>View Review Queue</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGenerationSummary(null)}
                className="text-emerald-700 hover:text-emerald-900 font-medium text-xs px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Pipeline Summary Bar (4 KPI Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Materials Analyzed</span>
            <span className="font-mono text-slate-900 font-bold text-lg mt-0.5 block">{materialsAnalyzed}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Material records in catalog</span>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Candidate Matches Generated</span>
            <span className="font-mono text-blue-700 font-bold text-lg mt-0.5 block">{candidateMatchesCount}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">AI cross-CPSE recommendations</span>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">High-Confidence Candidates</span>
            <span className="font-mono text-emerald-700 font-bold text-lg mt-0.5 block">{highConfidenceCount}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">≥ 85% match confidence</span>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Requiring Review</span>
            <span className="font-mono text-amber-700 font-bold text-lg mt-0.5 block">{reviewRequiredCount}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">&lt; 85% match confidence</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-slate-600 font-medium flex items-center gap-1.5">
            <IconFilter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter Queue:</span>
          </span>

          {/* Classification Filter */}
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
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
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
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
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            >
              <IconRotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <span className="text-slate-500 font-mono text-[11px]">
          Showing top {matches.length} {pipelineStats ? `of ${pipelineStats.total_recommendations.toLocaleString()}` : ''} recommendations
        </span>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <IconAlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Matching Operation Failed</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchMatches()}
            className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium transition"
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
              className="p-5 bg-white border border-slate-200 rounded-xl animate-pulse h-28 shadow-sm"
            />
          ))
        ) : matches.length > 0 ? (
          matches.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Pair Information */}
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Match #{item.id}
                  </span>
                  <StatusBadge status={item.classification} size="xs" />
                  <StatusBadge status={item.status} size="xs" />
                </div>

                {/* Materials Comparison Snippet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Material A */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                        {item.material_a.cpse}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {item.material_a.material_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-1 font-sans" title={item.material_a.description}>
                      {item.material_a.description}
                    </p>
                  </div>

                  {/* Material B */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                        {item.material_b.cpse}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {item.material_b.material_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-1 font-sans" title={item.material_b.description}>
                      {item.material_b.description}
                    </p>
                  </div>
                </div>

                {/* Primary Reason */}
                {item.reasons && item.reasons.length > 0 && (
                  <p className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{item.reasons[0]}</span>
                    {item.reasons.length > 1 && (
                      <span className="text-slate-400">+{item.reasons.length - 1} more reasons</span>
                    )}
                  </p>
                )}
              </div>

              {/* Confidence Score & Action */}
              <div className="flex items-center lg:flex-col lg:items-end justify-between gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0">
                <div className="text-left lg:text-right">
                  <div className="flex items-baseline gap-1 lg:justify-end">
                    <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                      {item.final_confidence}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
                    Confidence
                  </span>
                </div>

                <button
                  onClick={() => setSelectedMatchId(item.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 border border-slate-300 text-xs font-semibold shadow-sm transition"
                >
                  <IconEye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Analysis</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
            <IconCpu className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No match recommendations in queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Execute the AI Matching engine above to discover cross-CPSE candidate pairs across BHEL, NTPC, ONGC, SAIL, IOCL, and Coal India.
            </p>
            <button
              onClick={handleGenerateMatches}
              disabled={isGenerating}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition"
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
