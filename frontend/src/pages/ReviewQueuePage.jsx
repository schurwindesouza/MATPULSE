import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckSquare,
  Sparkles,
  Cpu,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  ExternalLink,
  Layers,
  HelpCircle,
  FileCheck,
  ShieldAlert,
  ArrowUpDown,
  Tag,
  Clock,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MatchAnalysisModal from '../components/MatchAnalysisModal';
import matchingService from '../services/matchingService';

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
      const data = await matchingService.getMatchingStats();
      setPipelineStats(data);
    } catch (err) {
      console.error('Failed to load matching stats', err);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchStats();
  }, [fetchQueue, fetchStats]);

  // If a specific match_id is provided in URL, scroll to it when loaded
  useEffect(() => {
    if (targetMatchId && matches.length > 0) {
      const el = document.getElementById(`match-card-${targetMatchId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [targetMatchId, matches]);

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

  // Queue Statistics (database-backed from pipelineStats with list fallback)
  const pendingCount = pipelineStats ? pipelineStats.pending_count : matches.filter((m) => m.status === 'PENDING').length;
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/50 shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Human Review & Harmonization Queue</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect AI-recommended cross-CPSE candidate equivalences, verify technical parameters, assign Common National Material Codes, or reject false candidates.
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Links */}
        <div className="flex items-center gap-3">
          <Link
            to="/matching"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Matching Engine</span>
          </Link>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Action Banner / Notification */}
      {actionNotice && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-lg ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
              : actionNotice.type === 'info'
              ? 'bg-slate-900 border-slate-700 text-slate-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : actionNotice.type === 'info' ? (
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 rounded hover:bg-slate-800/60 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Deep Link Focused Notice */}
      {targetMatchId && (
        <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>
              Targeting recommendation <strong>#MATCH-{targetMatchId}</strong> passed from the AI Matching analysis view.
            </span>
          </div>
          <button
            onClick={() => setSearchParams({})}
            className="text-xs text-indigo-400 hover:text-indigo-200 font-mono underline"
          >
            Clear Target Filter
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Pending Review</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-indigo-400">{pendingCount}</span>
            <span className="text-[11px] text-slate-500">items in queue</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">High Confidence</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-emerald-400">{highConfPending}</span>
            <span className="text-[11px] text-slate-500">≥ 85% score</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Review Required</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-amber-400">{reviewRequiredPending}</span>
            <span className="text-[11px] text-slate-500">&lt; 85% or warnings</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Approved & Standardized</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-teal-400">{approvedCount}</span>
            <span className="text-[11px] text-slate-500">common codes assigned</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 w-fit">
            {[
              { id: 'PENDING', label: 'Pending Review' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' },
              { id: 'ALL', label: 'All Items' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md font-medium text-xs transition ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Classifications</option>
              <option value="HIGH_CONFIDENCE_MATCH">High Confidence Only</option>
              <option value="REVIEW_REQUIRED">Review Required Only</option>
            </select>

            {/* CPSE Filter */}
            <select
              value={cpseFilter}
              onChange={(e) => setCpseFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {CPSE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Min Confidence */}
            <select
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Any Confidence</option>
              <option value="70">≥ 70% Confidence</option>
              <option value="80">≥ 80% Confidence</option>
              <option value="90">≥ 90% Confidence</option>
              <option value="95">≥ 95% Confidence</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Material Code (e.g. BHL-020-01), description keywords (pipe, valve, flange), or Common Material Code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Review Queue Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing top {filteredMatches.length} {pipelineStats ? `of ${statusFilter === 'PENDING' ? pipelineStats.pending_count.toLocaleString() : pipelineStats.total_recommendations.toLocaleString()}` : ''} recommendations ({statusFilter === 'ALL' ? 'All Statuses' : statusFilter === 'PENDING' ? 'Pending Review' : statusFilter})
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            Ranked by AI confidence descending
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse h-40" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/30 border border-rose-800/60 rounded-xl text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-sm font-semibold text-rose-300">Error Loading Review Queue</h3>
            <p className="text-xs text-rose-400">{error}</p>
            <button
              onClick={fetchQueue}
              className="mt-2 px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold"
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
                className={`p-5 rounded-xl border transition-all duration-200 bg-slate-900/80 hover:bg-slate-900 shadow-sm ${
                  isTargeted
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Recommendation Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-indigo-900/50">
                      #MATCH-{item.id}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                    <StatusBadge status={item.classification} size="sm" />
                    {isTargeted && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        Selected Recommendation
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">AI Score:</span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        {item.final_confidence}%
                      </span>
                    </div>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
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
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
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

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Category: <strong className="text-slate-300">{item.material_a.category || 'N/A'}</strong></span>
                      <span>UOM: <strong className="font-mono text-slate-300">{item.material_a.uom || 'N/A'}</strong></span>
                      <StatusBadge status={item.material_a.matching_status} size="xs" />
                    </div>
                  </div>

                  {/* Material B (Target CPSE) */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
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

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Category: <strong className="text-slate-300">{item.material_b.category || 'N/A'}</strong></span>
                      <span>UOM: <strong className="font-mono text-slate-300">{item.material_b.uom || 'N/A'}</strong></span>
                      <StatusBadge status={item.material_b.matching_status} size="xs" />
                    </div>
                  </div>
                </div>

                {/* Harmonization Outcome or AI Reasons */}
                {isApproved && item.common_material_code && (
                  <div className="p-3 mb-3 rounded-lg bg-teal-950/30 border border-teal-800/50 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-teal-400" />
                      <span className="text-teal-200">
                        Harmonized under Common National Material Code:
                      </span>
                      <span className="font-mono font-bold text-teal-300 px-2 py-0.5 rounded bg-teal-900/60 border border-teal-700/60">
                        {item.common_material_code}
                      </span>
                    </div>
                    <span className="text-[11px] text-teal-400">
                      Reviewed: {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : 'Approved'}
                    </span>
                  </div>
                )}

                {isRejected && (
                  <div className="p-3 mb-3 rounded-lg bg-rose-950/30 border border-rose-800/50 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span className="text-rose-200">
                        Recommendation Rejected. Original CPSE records kept independent.
                      </span>
                    </div>
                    <span className="text-[11px] text-rose-400">
                      Reviewed: {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : 'Rejected'}
                    </span>
                  </div>
                )}

                {/* Justification & Warnings Chips */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                  {item.reasons && item.reasons.slice(0, 2).map((r, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-[11px]"
                    >
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{r}</span>
                    </span>
                  ))}

                  {item.warnings && item.warnings.map((w, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[11px]"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>{w}</span>
                    </span>
                  ))}
                </div>

                {/* Action Toolbar */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
                  <button
                    onClick={() => setAnalysisModalMatchId(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-200 hover:text-indigo-200 border border-slate-700 hover:border-indigo-500/40 text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Full Analysis</span>
                  </button>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenRejectModal(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 text-xs font-semibold transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleOpenApproveModal(item)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Harmonize</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No matching recommendations found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                Reset Filters
              </button>
              <Link
                to="/matching"
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Go to AI Matching
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Approval Confirmation Dialog Modal */}
      {approvingMatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Approve & Standardize Material Code</h3>
                  <p className="text-xs text-slate-400">Match recommendation #MATCH-{approvingMatch.id}</p>
                </div>
              </div>
              <button
                onClick={() => setApprovingMatch(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-indigo-400 font-semibold">{approvingMatch.material_a.cpse}</span>
                <span className="font-mono text-slate-300">{approvingMatch.material_a.material_code}</span>
              </div>
              <p className="text-slate-400 italic line-clamp-1">{approvingMatch.material_a.description}</p>
              <div className="border-t border-slate-800 my-1" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-indigo-400 font-semibold">{approvingMatch.material_b.cpse}</span>
                <span className="font-mono text-slate-300">{approvingMatch.material_b.material_code}</span>
              </div>
              <p className="text-slate-400 italic line-clamp-1">{approvingMatch.material_b.description}</p>
            </div>

            {/* Common National Material Code Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200 block">
                Assign Common National Material Code (NMC) *
              </label>
              <input
                type="text"
                value={commonCodeInput}
                onChange={(e) => setCommonCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. NMC-PIP-IS1239-50NB"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400">
                This code will standardize both CPSE items for consolidated public procurement. Original CPSE codes are strictly preserved.
              </p>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1">
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
                    className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setApprovingMatch(null)}
                disabled={submittingAction}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={submittingAction || !commonCodeInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
              >
                {submittingAction ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-800/40">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Reject Recommendation</h3>
                  <p className="text-xs text-slate-400">Recommendation #MATCH-{rejectingMatch.id}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectingMatch(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
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
                    className="text-[11px] px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea for custom reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Rejection Rationale (Optional)
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Enter details on why these materials are not functionally equivalent..."
                rows={3}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setRejectingMatch(null)}
                disabled={submittingAction}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={submittingAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition disabled:opacity-50"
              >
                {submittingAction ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
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
