import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  IconCheckSquare,
  IconSparkles,
  IconCpu,
  IconCheckCircle,
  IconXCircle,
  IconAlertTriangle,
  IconRotateCcw,
  IconSearch,
  IconEye,
  IconCheck,
  IconX,
  IconFileCheck,
  IconShieldAlert,
  IconTag,
  IconClock,
  IconDownload,
  IconInfo,
} from '../components/icons/Icons';
import StatusBadge from '../components/StatusBadge';
import MatchAnalysisModal from '../components/MatchAnalysisModal';
import matchingService from '../services/matchingService';
import materialService from '../services/materialService';
import { exportToCsv, getDateStamp } from '../utils/csvExport';

const CPSE_OPTIONS = ['All CPSEs', 'BHEL', 'NTPC', 'ONGC', 'SAIL', 'IOCL', 'Coal India'];

const REJECTION_PRESETS = [
  'Different physical dimensions or pressure class',
  'Different material grade / chemical metallurgy',
  'Non-interchangeable standard or specification',
  'Different application or operational category',
  'Incompatible unit of measurement or packing',
];

function generateSuggestedCommonCode(item) {
  if (item?.common_material_code) return item.common_material_code;
  const category = (item?.material_a?.category || item?.material_b?.category || 'GEN')
    .substring(0, 3)
    .toUpperCase();

  const text = `${item?.material_a?.description || ''} ${item?.material_b?.description || ''}`.toUpperCase();

  let specTag = '';
  // Check for standard
  const stdMatch = text.match(/\b(IS\s*\d+|ASTM\s*[A-Z0-9]+|API\s*[A-Z0-9]+|DIN\s*\d+)\b/i);
  if (stdMatch) {
    specTag += `-${stdMatch[1].replace(/\s+/g, '')}`;
  }

  // Check for size/rating
  const sizeMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(NB|MM|INCH|CLASS|SCH)\b/i);
  if (sizeMatch) {
    specTag += `-${sizeMatch[1]}${sizeMatch[2]}`;
  }

  if (!specTag) {
    specTag = `-${item?.material_a?.id || 10}-${item?.material_b?.id || 20}`;
  }

  return `NMC-${category}${specTag}`.replace(/--+/g, '-').toUpperCase();
}

export default function ReviewQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetMatchId = searchParams.get('match_id');

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [cpseFilter, setCpseFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minConfidence, setMinConfidence] = useState('');

  // Modals & Action States
  const [analysisModalMatchId, setAnalysisModalMatchId] = useState(null);
  const [approvingMatch, setApprovingMatch] = useState(null);
  const [commonCodeInput, setCommonCodeInput] = useState('');
  const [rejectingMatch, setRejectingMatch] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [pipelineStats, setPipelineStats] = useState(null);
  const [materialStats, setMaterialStats] = useState(null);

  // Fetch queue data
  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { limit: 100 };

      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (classificationFilter) {
        params.classification = classificationFilter;
      }
      if (cpseFilter && cpseFilter !== 'All CPSEs') {
        params.cpse = cpseFilter;
      }
      if (minConfidence) {
        params.min_confidence = parseFloat(minConfidence);
      }

      const data = await matchingService.getReviewQueue(params);
      setMatches(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load recommendations from review queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, classificationFilter, cpseFilter, minConfidence]);

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
    fetchQueue();
    fetchStats();
  }, [fetchQueue, fetchStats]);

  // Client-side search filtering across code and description
  const filteredMatches = useMemo(() => {
    if (!searchTerm.trim()) return matches;
    const query = searchTerm.toLowerCase().trim();
    return matches.filter((item) => {
      const codeA = item.material_a?.material_code?.toLowerCase() || '';
      const descA = item.material_a?.description?.toLowerCase() || '';
      const codeB = item.material_b?.material_code?.toLowerCase() || '';
      const descB = item.material_b?.description?.toLowerCase() || '';
      const nmc = item.common_material_code?.toLowerCase() || '';
      const reasons = (item.reasons || []).join(' ').toLowerCase();

      return (
        codeA.includes(query) ||
        descA.includes(query) ||
        codeB.includes(query) ||
        descB.includes(query) ||
        nmc.includes(query) ||
        reasons.includes(query) ||
        String(item.id) === query
      );
    });
  }, [matches, searchTerm]);

  // CSV Export handler
  const handleExportCsv = () => {
    const rowsToExport = filteredMatches.length > 0 ? filteredMatches : matches;
    if (rowsToExport.length === 0) return;

    const filename = `MATPULSE_Match_Recommendations_${getDateStamp()}.csv`;
    const headers = [
      { key: 'id', label: 'Recommendation ID' },
      { key: 'status', label: 'Status' },
      { key: 'classification', label: 'Classification' },
      { key: 'overall_confidence', label: 'Overall Confidence (%)' },
      { key: 'semantic_score', label: 'Semantic Similarity (%)' },
      { key: 'technical_score', label: 'Technical Score (%)' },
      { key: 'common_material_code', label: 'Common Material Code' },
      { key: 'source_cpse', label: 'Source CPSE' },
      { key: 'source_code', label: 'Source Material Code' },
      { key: 'source_description', label: 'Source Description' },
      { key: 'source_category', label: 'Source Category' },
      { key: 'target_cpse', label: 'Target CPSE' },
      { key: 'target_code', label: 'Target Material Code' },
      { key: 'target_description', label: 'Target Description' },
      { key: 'target_category', label: 'Target Category' },
      { key: 'reasons', label: 'Review Reasons' },
      { key: 'created_at', label: 'Created At' },
    ];

    const flattenedRows = rowsToExport.map((m) => ({
      id: m.id,
      status: m.status,
      classification: m.classification,
      overall_confidence: m.confidence_score ?? m.overall_confidence ?? '',
      semantic_score: m.semantic_score != null ? Math.round(m.semantic_score * 100) : '',
      technical_score: m.technical_score != null ? Math.round(m.technical_score * 100) : '',
      common_material_code: m.common_material_code || '',
      source_cpse: m.material_a?.cpse || '',
      source_code: m.material_a?.material_code || '',
      source_description: m.material_a?.description || '',
      source_category: m.material_a?.category || '',
      target_cpse: m.material_b?.cpse || '',
      target_code: m.material_b?.material_code || '',
      target_description: m.material_b?.description || '',
      target_category: m.material_b?.category || '',
      reasons: Array.isArray(m.reasons) ? m.reasons.join('; ') : m.reasons || '',
      created_at: m.created_at || '',
    }));

    exportToCsv({ filename, headers, rows: flattenedRows });
  };

  // If a specific match_id is provided in URL, scroll to it when loaded
  useEffect(() => {
    if (targetMatchId && matches.length > 0) {
      const el = document.getElementById(`match-card-${targetMatchId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [targetMatchId, matches]);

  // Queue & Master Catalog Statistics
  const totalMaterialsAnalyzed = materialStats?.total_materials ?? '—';
  const totalRecommendations = pipelineStats?.total_recommendations ?? matches.length;
  const highConfPending = pipelineStats ? pipelineStats.high_confidence_count : matches.filter(
    (m) => m.classification === 'HIGH_CONFIDENCE_MATCH'
  ).length;
  const reviewRequiredPending = pipelineStats ? pipelineStats.review_required_count : matches.filter(
    (m) => m.classification === 'REVIEW_REQUIRED'
  ).length;
  const approvedCount = pipelineStats ? pipelineStats.approved_count : matches.filter(
    (m) => m.status === 'APPROVED'
  ).length;

  // Handle Approve Click
  const handleOpenApproveModal = (match) => {
    setApprovingMatch(match);
    const suggested = generateSuggestedCommonCode(match);
    setCommonCodeInput(suggested);
  };

  const handleConfirmApproval = async () => {
    if (!approvingMatch || !commonCodeInput.trim()) return;
    try {
      setSubmittingAction(true);
      await matchingService.approveMatch(approvingMatch.id, commonCodeInput.trim());

      setActionNotice({
        type: 'success',
        message: `Match #${approvingMatch.id} approved successfully! Assigned Common National Material Code "${commonCodeInput.trim()}". Original CPSE material codes preserved.`,
      });

      // Update local state: remove from pending or update status
      setMatches((prev) =>
        prev.map((m) =>
          m.id === approvingMatch.id
            ? { ...m, status: 'APPROVED', common_material_code: commonCodeInput.trim() }
            : m
        )
      );

      setApprovingMatch(null);
      setCommonCodeInput('');
      fetchStats();
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Failed to approve recommendation',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Reject Click
  const handleOpenRejectModal = (match) => {
    setRejectingMatch(match);
    setRejectionReasonInput('');
  };

  const handleConfirmRejection = async () => {
    if (!rejectingMatch) return;
    try {
      setSubmittingAction(true);
      await matchingService.rejectMatch(
        rejectingMatch.id,
        rejectionReasonInput.trim() || 'Rejected during human review.'
      );

      setActionNotice({
        type: 'info',
        message: `Match #${rejectingMatch.id} marked as Rejected. Material master records remain untouched.`,
      });

      // Update local state: remove from pending or update status
      setMatches((prev) =>
        prev.map((m) =>
          m.id === rejectingMatch.id
            ? { ...m, status: 'REJECTED' }
            : m
        )
      );

      setRejectingMatch(null);
      setRejectionReasonInput('');
      fetchStats();
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Failed to reject recommendation',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section with Local Readability Protection */}
      <div className="glass-header-scrim p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <IconCheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight text-shadow-protect">Human Review & Harmonization Queue</h1>
              <p className="text-xs sm:text-sm text-slate-300/90 mt-0.5 text-shadow-protect">
                Inspect AI-recommended cross-CPSE equivalences, verify technical attributes, and assign Common National Material Codes.
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Links */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            disabled={loading || (filteredMatches.length === 0 && matches.length === 0)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold transition disabled:opacity-50"
            title="Export match recommendations to CSV"
          >
            <IconDownload className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <Link
            to="/matching"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-btn-secondary text-slate-200 text-xs font-semibold transition"
          >
            <IconSparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Matching Engine</span>
          </Link>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-btn-secondary text-slate-200 text-xs font-medium transition disabled:opacity-50"
          >
            <IconRotateCcw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Action Banner / Notification */}
      {actionNotice && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-lg glass-panel ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
              : actionNotice.type === 'info'
              ? 'bg-slate-900/80 border-white/20 text-slate-200'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionNotice.type === 'success' ? (
              <IconCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : actionNotice.type === 'info' ? (
              <IconXCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
            ) : (
              <IconAlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Deep Link Focused Notice */}
      {targetMatchId && (
        <div className="p-3.5 rounded-xl glass-panel bg-blue-500/15 border border-blue-400/30 flex items-center justify-between text-xs text-blue-200 shadow-md">
          <div className="flex items-center gap-2">
            <IconCpu className="w-4 h-4 text-blue-400" />
            <span>
              Targeting recommendation <strong className="text-white">#MATCH-{targetMatchId}</strong> passed from the AI Matching analysis view.
            </span>
          </div>
          <button
            onClick={() => setSearchParams({})}
            className="text-xs text-blue-300 hover:text-white font-mono underline"
          >
            Clear Target Filter
          </button>
        </div>
      )}

      {/* Explanatory Banner: Material vs Recommendation Entity Separation */}
      <div className="p-3.5 rounded-xl glass-panel bg-blue-500/10 border border-blue-400/20 text-blue-200 flex items-start gap-2.5 text-xs shadow-md">
        <IconInfo className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Match recommendations represent candidate relationships between material records. A single material may participate in multiple candidate matches across different CPSEs.
        </p>
      </div>

      {/* Overview Stat Cards (5 Distinct Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        <div className="p-4 rounded-xl glass-card bg-white/[0.03] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Materials Analyzed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-white">{totalMaterialsAnalyzed}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">records in catalog</span>
        </div>

        <div className="p-4 rounded-xl glass-card bg-white/[0.03] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Recommendations</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-blue-400">{totalRecommendations}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">candidate pairs</span>
        </div>

        <div className="p-4 rounded-xl glass-card bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-medium">High Confidence</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-emerald-400">{highConfPending}</span>
          </div>
          <span className="text-[10px] text-emerald-300/70 mt-1 block">≥ 85% match score</span>
        </div>

        <div className="p-4 rounded-xl glass-card bg-amber-500/10 border border-amber-500/20">
          <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-medium">Review Required</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-amber-400">{reviewRequiredPending}</span>
          </div>
          <span className="text-[10px] text-amber-300/70 mt-1 block">&lt; 85% match score</span>
        </div>

        <div className="p-4 rounded-xl glass-card bg-teal-500/10 border border-teal-500/20">
          <span className="text-[10px] text-teal-300 uppercase tracking-wider block font-medium">Standardized</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-teal-400">{approvedCount}</span>
          </div>
          <span className="text-[10px] text-teal-300/70 mt-1 block">common codes assigned</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-3.5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10 w-fit">
            {[
              { id: 'PENDING', label: 'Pending Review' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' },
              { id: 'ALL', label: 'All Items' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition duration-200 ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white font-semibold shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Classification */}
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="bg-slate-900/90 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">All Classifications</option>
              <option value="HIGH_CONFIDENCE_MATCH" className="bg-slate-900 text-white">High Confidence Only</option>
              <option value="REVIEW_REQUIRED" className="bg-slate-900 text-white">Review Required Only</option>
            </select>

            {/* CPSE Filter */}
            <select
              value={cpseFilter}
              onChange={(e) => setCpseFilter(e.target.value)}
              className="bg-slate-900/90 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              {CPSE_OPTIONS.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>

            {/* Min Confidence */}
            <select
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value)}
              className="bg-slate-900/90 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">Any Confidence</option>
              <option value="70" className="bg-slate-900 text-white">≥ 70% Confidence</option>
              <option value="80" className="bg-slate-900 text-white">≥ 80% Confidence</option>
              <option value="90" className="bg-slate-900 text-white">≥ 90% Confidence</option>
              <option value="95" className="bg-slate-900 text-white">≥ 95% Confidence</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Material Code (e.g. BHL-020-01), description keywords (pipe, valve, flange), or Common Material Code..."
            className="w-full pl-10 pr-12 py-2.5 bg-slate-900/80 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Review Queue Items List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400 px-1">
          <span>
            Showing <strong className="text-white">{filteredMatches.length}</strong> of {pipelineStats ? (statusFilter === 'PENDING' ? pipelineStats.pending_count.toLocaleString() : pipelineStats.total_recommendations.toLocaleString()) : matches.length} recommendations generated from {totalMaterialsAnalyzed} material records.
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Ranked by AI confidence descending
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 glass-panel rounded-2xl border border-white/10 animate-pulse h-40 shadow-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 glass-panel bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-2">
            <IconAlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-sm font-semibold text-rose-100">Error Loading Review Queue</h3>
            <p className="text-xs text-rose-200/90">{error}</p>
            <button
              onClick={fetchQueue}
              className="mt-2 px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((item) => {
            const isTargeted = String(item.id) === String(targetMatchId);
            const isApproved = item.status === 'APPROVED';
            const isRejected = item.status === 'REJECTED';
            const isPending = item.status === 'PENDING';

            return (
              <div
                key={item.id}
                id={`match-card-${item.id}`}
                className={`p-5 rounded-2xl border transition-all duration-200 glass-panel shadow-xl ${
                  isTargeted
                    ? 'border-blue-400 ring-2 ring-blue-500/50 bg-blue-500/15'
                    : 'border-white/10 hover:border-blue-400/30 hover:bg-white/[0.05]'
                }`}
              >
                {/* Recommendation Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                      #MATCH-{item.id}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                    <StatusBadge status={item.classification} size="sm" />
                    {isTargeted && (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        Selected Recommendation
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">AI Score:</span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        {item.final_confidence}%
                      </span>
                    </div>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <IconClock className="w-3 h-3 text-slate-500" />
                      {new Date(item.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* 2-Column Comparison Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
                  {/* Material A (Source CPSE) */}
                  <div className="p-4 rounded-xl glass-card bg-white/[0.02] border border-white/10 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          {item.material_a.cpse}
                        </span>
                        <span className="font-mono text-xs font-semibold text-white tracking-wide">
                          {item.material_a.material_code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-sans leading-relaxed font-medium">
                        {item.material_a.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Category: <strong className="text-slate-200">{item.material_a.category || 'N/A'}</strong></span>
                      <span>UOM: <strong className="font-mono text-slate-200">{item.material_a.uom || 'N/A'}</strong></span>
                      <StatusBadge status={item.material_a.matching_status} size="xs" />
                    </div>
                  </div>

                  {/* Material B (Target CPSE) */}
                  <div className="p-4 rounded-xl glass-card bg-white/[0.02] border border-white/10 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          {item.material_b.cpse}
                        </span>
                        <span className="font-mono text-xs font-semibold text-white tracking-wide">
                          {item.material_b.material_code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-sans leading-relaxed font-medium">
                        {item.material_b.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Category: <strong className="text-slate-200">{item.material_b.category || 'N/A'}</strong></span>
                      <span>UOM: <strong className="font-mono text-slate-200">{item.material_b.uom || 'N/A'}</strong></span>
                      <StatusBadge status={item.material_b.matching_status} size="xs" />
                    </div>
                  </div>
                </div>

                {/* Harmonization Outcome or AI Reasons */}
                {isApproved && item.common_material_code && (
                  <div className="p-3.5 mb-3 rounded-xl glass-card bg-teal-500/15 border border-teal-400/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <IconTag className="w-4 h-4 text-teal-400" />
                      <span className="text-teal-200 font-medium">
                        Harmonized under Common National Material Code:
                      </span>
                      <span className="font-mono font-bold text-teal-300 px-2.5 py-0.5 rounded-md bg-teal-950/60 border border-teal-400/40">
                        {item.common_material_code}
                      </span>
                    </div>
                    <span className="text-[11px] text-teal-300/80">
                      Reviewed: {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : 'Approved'}
                    </span>
                  </div>
                )}

                {isRejected && (
                  <div className="p-3.5 mb-3 rounded-xl glass-card bg-rose-500/15 border border-rose-400/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <IconXCircle className="w-4 h-4 text-rose-400" />
                      <span className="text-rose-200 font-medium">
                        Recommendation Rejected. Original CPSE records kept independent.
                      </span>
                    </div>
                    <span className="text-[11px] text-rose-300/80">
                      Reviewed: {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : 'Rejected'}
                    </span>
                  </div>
                )}

                {/* Justification & Warnings Chips */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                  {item.reasons && item.reasons.slice(0, 2).map((r, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[11px]"
                    >
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{r}</span>
                    </span>
                  ))}

                  {item.warnings && item.warnings.map((w, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-400/30 text-[11px]"
                    >
                      <IconAlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>{w}</span>
                    </span>
                  ))}
                </div>

                {/* Action Toolbar */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                  <button
                    onClick={() => setAnalysisModalMatchId(item.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-btn-secondary text-white hover:text-blue-300 hover:border-blue-400/50 text-xs font-semibold transition"
                  >
                    <IconEye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Inspect Full Analysis</span>
                  </button>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenRejectModal(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-btn-secondary text-rose-300 hover:text-rose-100 hover:border-rose-400/50 text-xs font-semibold transition"
                      >
                        <IconX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleOpenApproveModal(item)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl glass-btn-primary text-white text-xs font-semibold shadow-[0_0_20px_rgba(59,130,246,0.35)] transition"
                      >
                        <IconCheck className="w-3.5 h-3.5" />
                        <span>Approve & Harmonize</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center glass-panel border border-white/10 rounded-2xl space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              <IconCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white">No matching recommendations found</h3>
            <p className="text-xs text-slate-300/80 max-w-sm mx-auto">
              No recommendations match your current filter settings ({statusFilter}, {classificationFilter || 'All Classifications'}).
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  setStatusFilter('PENDING');
                  setClassificationFilter('');
                  setCpseFilter('');
                  setSearchTerm('');
                  setMinConfidence('');
                }}
                className="px-4 py-2 rounded-xl glass-btn-secondary text-slate-200 text-xs font-medium"
              >
                Reset Filters
              </button>
              <Link
                to="/matching"
                className="px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold"
              >
                Go to AI Matching
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Approval Confirmation Dialog Modal */}
      {approvingMatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-xl glass-panel rounded-3xl border border-white/15 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                  <IconFileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Approve & Standardize Material Code</h3>
                  <p className="text-xs text-slate-400">Match recommendation #MATCH-{approvingMatch.id}</p>
                </div>
              </div>
              <button
                onClick={() => setApprovingMatch(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl glass-card bg-white/[0.03] border border-white/10 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-blue-400 font-semibold">{approvingMatch.material_a.cpse}</span>
                <span className="font-mono text-white font-semibold">{approvingMatch.material_a.material_code}</span>
              </div>
              <p className="text-slate-300 italic line-clamp-1">{approvingMatch.material_a.description}</p>
              <div className="border-t border-white/10 my-1" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-purple-400 font-semibold">{approvingMatch.material_b.cpse}</span>
                <span className="font-mono text-white font-semibold">{approvingMatch.material_b.material_code}</span>
              </div>
              <p className="text-slate-300 italic line-clamp-1">{approvingMatch.material_b.description}</p>
            </div>

            {/* Common National Material Code Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white block">
                Assign Common National Material Code (NMC) *
              </label>
              <input
                type="text"
                value={commonCodeInput}
                onChange={(e) => setCommonCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. NMC-PIP-IS1239-50NB"
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-white/20 rounded-xl text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-400 shadow-inner"
              />
              <p className="text-[11px] text-slate-400">
                This code will standardize both CPSE items for consolidated public procurement. Original CPSE codes are strictly preserved.
              </p>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Suggested Codes:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  generateSuggestedCommonCode(approvingMatch),
                  `NMC-${(approvingMatch.material_a.category || 'MAT').substring(0, 3).toUpperCase()}-${approvingMatch.material_a.material_code.replace(/[^a-zA-Z0-9]/g, '')}`,
                  `NMC-STD-${approvingMatch.id.toString().padStart(4, '0')}`,
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCommonCodeInput(s)}
                    className="font-mono text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setApprovingMatch(null)}
                disabled={submittingAction}
                className="px-4 py-2 rounded-xl glass-btn-secondary text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={submittingAction || !commonCodeInput.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-50"
              >
                {submittingAction ? (
                  <>
                    <IconRotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Database...</span>
                  </>
                ) : (
                  <>
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>Confirm Approval & Assign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Dialog Modal */}
      {rejectingMatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-xl glass-panel rounded-3xl border border-white/15 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-400/30">
                  <IconShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reject Recommendation</h3>
                  <p className="text-xs text-slate-400">Recommendation #MATCH-{rejectingMatch.id}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectingMatch(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Rejecting this recommendation will flag it as non-equivalent. The CPSE material master records will remain completely untouched.
            </p>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Quick Rationale Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReasonInput(preset)}
                    className="text-[11px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-left transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea for custom reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white block">
                Rejection Rationale (Optional)
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Enter details on why these materials are not functionally equivalent..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-white/20 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setRejectingMatch(null)}
                disabled={submittingAction}
                className="px-4 py-2 rounded-xl glass-btn-secondary text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={submittingAction}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition shadow-[0_0_20px_rgba(244,63,94,0.35)] disabled:opacity-50"
              >
                {submittingAction ? (
                  <>
                    <IconRotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <IconX className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal for Deep Inspection */}
      {analysisModalMatchId && (
        <MatchAnalysisModal
          matchId={analysisModalMatchId}
          onClose={() => setAnalysisModalMatchId(null)}
        />
      )}
    </div>
  );
}
