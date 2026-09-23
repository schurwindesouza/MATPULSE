import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  RotateCcw,
  Building2,
  Lock,
  Tag,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Eye,
  X,
  FileCheck,
  TrendingUp,
  Cpu,
  Boxes,
  HelpCircle,
  Calendar,
  ShieldCheck,
  Check,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import materialService from '../services/materialService';

const CPSE_OPTIONS = ['All CPSEs', 'BHEL', 'NTPC', 'ONGC', 'SAIL', 'IOCL', 'Coal India'];

export default function CommonMaterialsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetCode = searchParams.get('code');

  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cpseFilter, setCpseFilter] = useState('');

  // Selected Common Material for Detailed Inspection Modal
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch Common Materials Catalog
  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (cpseFilter && cpseFilter !== 'All CPSEs') params.cpse = cpseFilter;
      if (searchTerm) params.search = searchTerm;

      const data = await materialService.getCommonCatalog(params);
      setCatalog(data);

      // If targetCode from URL exists, auto-select it
      if (targetCode && data?.items) {
        const found = data.items.find(
          (item) => item.common_material_code.toLowerCase() === targetCode.toLowerCase()
        );
        if (found) {
          setSelectedItem(found);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load Common National Material Codes');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, cpseFilter, searchTerm, targetCode]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const items = catalog?.items || [];

  // Extract distinct categories from catalog items
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Handle open modal
  const handleOpenDetails = (item) => {
    setSelectedItem(item);
    setSearchParams({ code: item.common_material_code });
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
    setSearchParams({});
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-950/80 text-teal-400 border border-teal-800/50 shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Common National Material Codes
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Master catalog of standardized cross-CPSE material codes (NMC). Inspect verified equivalences, mapped CPSE catalog codes, and provenance audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/review-queue"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Review Queue</span>
          </Link>
          <button
            onClick={fetchCatalog}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Common National Codes
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-teal-400">
              {catalog?.total_codes ?? 0}
            </span>
            <span className="text-[11px] text-slate-500">standardized NMCs</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Harmonized CPSE Records
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-indigo-400">
              {catalog?.total_mapped_materials ?? 0}
            </span>
            <span className="text-[11px] text-slate-500">mapped catalog items</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Participating CPSEs
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-emerald-400">5</span>
            <span className="text-[11px] text-slate-500">BHEL, NTPC, ONGC, SAIL, IOCL</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Provenance Audit Trail
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs font-semibold text-slate-200">
              Deterministic & AI Verified
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Common National Code (e.g. NMC-FAS-107-111), CPSE codes (BHL-020-01), or description..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
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

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* CPSE Filter */}
            <select
              value={cpseFilter}
              onChange={(e) => setCpseFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {CPSE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {(categoryFilter || cpseFilter || searchTerm) && (
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setCpseFilter('');
                  setSearchTerm('');
                }}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Common Material Cards Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing <strong>{items.length}</strong> standardized Common National Material Codes
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            Original CPSE internal codes strictly preserved and mapped
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse h-36" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 bg-rose-950/30 border border-rose-800/60 rounded-xl text-center space-y-2">
            <h3 className="text-sm font-semibold text-rose-300">Failed to load Common Materials</h3>
            <p className="text-xs text-rose-400">{error}</p>
            <button
              onClick={fetchCatalog}
              className="mt-2 px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : items.length > 0 ? (
          items.map((item) => {
            const isTargeted =
              targetCode &&
              item.common_material_code.toLowerCase() === targetCode.toLowerCase();

            return (
              <div
                key={item.common_material_code}
                id={`card-${item.common_material_code}`}
                className={`p-5 rounded-xl border transition-all duration-200 bg-slate-900/80 hover:bg-slate-900 shadow-sm ${
                  isTargeted
                    ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-teal-950/80 text-teal-300 border border-teal-800/60 shadow-sm">
                      {item.common_material_code}
                    </span>
                    {item.category && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                        {item.category}
                      </span>
                    )}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                      {item.mappings_count} CPSE Mappings
                    </span>
                  </div>

                  {/* Provenance badge */}
                  <div className="flex items-center gap-2 text-xs">
                    {item.provenance ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AI Match #{item.provenance.match_id}</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {item.provenance.final_confidence}%
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50 text-[11px]">
                        <Boxes className="w-3 h-3 text-slate-400" />
                        <span>Catalog Baseline Cluster</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Description & participating CPSEs */}
                <div className="my-3 space-y-2">
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {item.description}
                  </p>

                  {/* Mapped CPSE Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Linked CPSEs:
                    </span>
                    {item.linked_cpses.map((cpse) => (
                      <span
                        key={cpse}
                        className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-indigo-900/60"
                      >
                        {cpse}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mapped CPSE Material Details Matrix */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Original Immutable CPSE Mappings ({item.linked_materials.length}):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {item.linked_materials.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex flex-col justify-between space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                            {m.cpse}
                          </span>
                          <span className="font-mono text-xs font-semibold text-white flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-500" title="Immutable original code" />
                            {m.material_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-1 font-sans" title={m.description}>
                          {m.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                          <span>UOM: <strong className="font-mono text-slate-400">{m.uom || 'N/A'}</strong></span>
                          <StatusBadge status={m.matching_status} size="xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    {item.total_annual_quantity > 0 && (
                      <span>
                        Consolidated Demand: <strong className="font-mono text-slate-200">{item.total_annual_quantity.toLocaleString()} {item.uom}</strong>
                      </span>
                    )}
                    {item.estimated_spend > 0 && (
                      <span>
                        Est. Spend: <strong className="font-mono text-emerald-400">₹{(item.estimated_spend / 1e5).toFixed(2)} Lakh</strong>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenDetails(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-teal-950/60 text-slate-200 hover:text-teal-300 border border-slate-700 hover:border-teal-700/60 text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Provenance & Audit Trail</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Common National Material Codes Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No harmonized materials match your search or filter settings. Approve AI match recommendations in the Review Queue to standardize more items.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setCpseFilter('');
                  setSearchTerm('');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                Reset Filters
              </button>
              <Link
                to="/review-queue"
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Open Review Queue
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Modal: Immutable Provenance & Mapping Audit Trail */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleCloseDetails}
        >
          <div
            className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-950 text-teal-400 border border-teal-800/40">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-mono">
                      {selectedItem.common_material_code}
                    </h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60">
                      Standardized Common Code
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Category: <span className="text-slate-300 font-medium">{selectedItem.category}</span> • UOM: <span className="text-slate-300 font-mono">{selectedItem.uom || 'EA'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Standardized Master Description */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Unified Description (Standardized Specification):
              </span>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                {selectedItem.description}
              </p>
            </div>

            {/* AI Harmonization Provenance Card */}
            {selectedItem.provenance ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-800/40">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-200">
                      Harmonization Provenance: AI Recommendation #{selectedItem.provenance.match_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-bold">
                      {selectedItem.provenance.final_confidence}% Confidence
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {selectedItem.provenance.reviewed_at
                        ? new Date(selectedItem.provenance.reviewed_at).toLocaleString()
                        : 'Approved'}
                    </span>
                  </div>
                </div>

                {selectedItem.provenance.reasons && selectedItem.provenance.reasons.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-semibold">
                      Verified Technical Equivalence Factors:
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-emerald-200">
                      {selectedItem.provenance.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-slate-500" />
                <span>
                  Baseline Cross-CPSE Cluster: Harmonized as part of the initial synthetic catalog standardization benchmark.
                </span>
              </div>
            )}

            {/* Mapped CPSE Material Records (Immutable Provenance Table) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Mapped CPSE Materials ({selectedItem.linked_materials.length} Organizations)</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Original CPSE codes immutable
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedItem.linked_materials.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                          {m.cpse}
                        </span>
                        <div className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-mono text-xs font-bold text-white tracking-wide">
                            {m.material_code}
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans ml-1">(Original Internal Code)</span>
                        </div>
                      </div>
                      <StatusBadge status={m.matching_status} size="xs" />
                    </div>

                    <p className="text-xs text-slate-200 font-medium">
                      {m.description}
                    </p>

                    {m.technical_specification && (
                      <p className="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded border border-slate-800/60">
                        {m.technical_specification}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Category:</span>
                        <span className="text-slate-300">{m.category || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">UOM:</span>
                        <span className="font-mono text-slate-300">{m.uom || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Annual Qty:</span>
                        <span className="font-mono text-slate-300">
                          {m.annual_quantity ? m.annual_quantity.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Unit Price:</span>
                        <span className="font-mono text-slate-300">
                          {m.approx_unit_price ? `₹${m.approx_unit_price.toLocaleString()}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consolidated Demand & Spend Card */}
            {(selectedItem.total_annual_quantity > 0 || selectedItem.estimated_spend > 0) && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Consolidated Cross-CPSE Demand:
                  </span>
                  <span className="font-mono text-base font-bold text-white mt-0.5 block">
                    {selectedItem.total_annual_quantity.toLocaleString()} {selectedItem.uom}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Estimated Public Procurement Value:
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-400 mt-0.5 block">
                    ₹{(selectedItem.estimated_spend / 1e5).toFixed(2)} Lakh
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">
                SIH Problem Statement 26099 • Material Standardization Engine
              </span>
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
