import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  IconLayers,
  IconSearch,
  IconRotateCcw,
  IconBuilding,
  IconLock,
  IconCheckCircle,
  IconEye,
  IconX,
  IconFileCheck,
  IconBoxes,
  IconShieldCheck,
  IconCheck,
} from '../components/icons/Icons';
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header with Local Readability Protection */}
      <div className="glass-header-scrim p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <IconLayers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight text-shadow-protect">
                Common National Material Codes
              </h1>
              <p className="text-xs sm:text-sm text-slate-300/90 mt-0.5 text-shadow-protect">
                Master catalog of standardized cross-CPSE material codes (NMC). Verified equivalences & immutable original code mappings.
              </p>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/review-queue"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-btn-secondary text-slate-200 text-xs font-semibold transition"
          >
            <IconShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Review Queue</span>
          </Link>
          <button
            onClick={fetchCatalog}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-btn-secondary text-slate-200 text-xs font-medium transition disabled:opacity-50"
          >
            <IconRotateCcw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl glass-card bg-white/[0.03] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Common National Codes
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-blue-400">
              {catalog?.total_codes ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">standardized NMCs</span>
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card bg-white/[0.03] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Harmonized CPSE Records
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-indigo-300">
              {catalog?.total_mapped_materials ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">mapped catalog items</span>
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-medium">
            Participating CPSEs
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-emerald-400">5</span>
            <span className="text-[11px] text-emerald-300/70">BHEL, NTPC, ONGC, SAIL, IOCL</span>
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card bg-white/[0.03] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Provenance Audit Trail
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="font-mono text-xs font-semibold text-white">
              Deterministic & AI Verified
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-3.5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Common National Code (e.g. NMC-FAS-107-111), CPSE codes (BHL-020-01), or description..."
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

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900/90 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>

            {/* CPSE Filter */}
            <select
              value={cpseFilter}
              onChange={(e) => setCpseFilter(e.target.value)}
              className="bg-slate-900/90 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              {CPSE_OPTIONS.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
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
                className="px-3 py-2 rounded-xl glass-btn-secondary text-slate-300 text-xs transition"
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
            Showing <strong className="text-white">{items.length}</strong> standardized Common National Material Codes
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Original CPSE internal codes strictly preserved and mapped
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 glass-panel rounded-2xl border border-white/10 animate-pulse h-36 shadow-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 glass-panel bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-2">
            <h3 className="text-sm font-semibold text-rose-100">Failed to load Common Materials</h3>
            <p className="text-xs text-rose-200/90">{error}</p>
            <button
              onClick={fetchCatalog}
              className="mt-2 px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold shadow-sm"
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
                className={`p-5 rounded-2xl border transition-all duration-200 glass-panel shadow-xl ${
                  isTargeted
                    ? 'border-blue-400 ring-2 ring-blue-500/50 bg-blue-500/15'
                    : 'border-white/10 hover:border-blue-400/30 hover:bg-white/[0.05]'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-sm">
                      {item.common_material_code}
                    </span>
                    {item.category && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                        {item.category}
                      </span>
                    )}
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                      {item.mappings_count} CPSE Mappings
                    </span>
                  </div>

                  {/* Provenance badge */}
                  <div className="flex items-center gap-2 text-xs">
                    {item.provenance ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[11px]">
                        <IconCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AI Match #{item.provenance.match_id}</span>
                        <span className="text-emerald-300 font-mono font-bold">
                          {item.provenance.final_confidence}%
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10 text-[11px]">
                        <IconBoxes className="w-3 h-3 text-slate-400" />
                        <span>Catalog Baseline Cluster</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Description & participating CPSEs */}
                <div className="my-3 space-y-2">
                  <p className="text-xs text-white font-medium leading-relaxed">
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
                        className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-white/10 text-white border border-white/15"
                      >
                        {cpse}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mapped CPSE Material Details Matrix */}
                <div className="p-3.5 rounded-xl glass-card bg-white/[0.02] border border-white/10 space-y-2.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Original Immutable CPSE Mappings ({item.linked_materials.length}):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {item.linked_materials.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl glass-card bg-white/[0.03] border border-white/10 text-xs flex flex-col justify-between space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            {m.cpse}
                          </span>
                          <span className="font-mono text-xs font-semibold text-white flex items-center gap-1">
                            <IconLock className="w-3 h-3 text-emerald-400" title="Immutable original code" />
                            {m.material_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-1 font-sans" title={m.description}>
                          {m.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
                          <span>UOM: <strong className="font-mono text-slate-200">{m.uom || 'N/A'}</strong></span>
                          <StatusBadge status={m.matching_status} size="xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    {item.total_annual_quantity > 0 && (
                      <span>
                        Consolidated Demand: <strong className="font-mono text-white">{item.total_annual_quantity.toLocaleString()} {item.uom}</strong>
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-btn-secondary text-white hover:text-blue-300 hover:border-blue-400/50 text-xs font-semibold shadow-sm transition"
                  >
                    <IconEye className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Provenance & Audit Trail</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center glass-panel border border-white/10 rounded-2xl space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              <IconLayers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white">No Common National Material Codes Found</h3>
            <p className="text-xs text-slate-300/80 max-w-sm mx-auto">
              No harmonized materials match your search or filter settings. Approve AI match recommendations in the Review Queue to standardize more items.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setCpseFilter('');
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-xl glass-btn-secondary text-slate-200 text-xs font-medium"
              >
                Reset Filters
              </button>
              <Link
                to="/review-queue"
                className="px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold"
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
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={handleCloseDetails}
        >
          <div
            className="w-full max-w-3xl glass-panel rounded-3xl border border-white/15 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                  <IconLayers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-mono">
                      {selectedItem.common_material_code}
                    </h3>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      Standardized Common Code
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Category: <span className="text-white font-medium">{selectedItem.category}</span> • UOM: <span className="text-white font-mono">{selectedItem.uom || 'EA'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Standardized Master Description */}
            <div className="p-4 rounded-2xl glass-card bg-white/[0.03] border border-white/10 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Unified Description (Standardized Specification):
              </span>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                {selectedItem.description}
              </p>
            </div>

            {/* AI Harmonization Provenance Card */}
            {selectedItem.provenance ? (
              <div className="p-4 rounded-2xl glass-card bg-emerald-500/15 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <IconFileCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-200">
                      Harmonization Provenance: AI Recommendation #{selectedItem.provenance.match_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-400/40 font-bold">
                      {selectedItem.provenance.final_confidence}% Confidence
                    </span>
                    <span className="text-[11px] text-emerald-300/80 font-mono">
                      {selectedItem.provenance.reviewed_at
                        ? new Date(selectedItem.provenance.reviewed_at).toLocaleString()
                        : 'Approved'}
                    </span>
                  </div>
                </div>

                {selectedItem.provenance.reasons && selectedItem.provenance.reasons.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-semibold">
                      Verified Technical Equivalence Factors:
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-emerald-200/90">
                      {selectedItem.provenance.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <IconCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl glass-card bg-white/[0.03] border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                <IconBoxes className="w-4 h-4 text-slate-400" />
                <span>
                  Baseline Cross-CPSE Cluster: Harmonized as part of the initial synthetic catalog standardization benchmark.
                </span>
              </div>
            )}

            {/* Mapped CPSE Material Records (Immutable Provenance Table) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <IconBuilding className="w-4 h-4 text-blue-400" />
                  <span>Mapped CPSE Materials ({selectedItem.linked_materials.length} Organizations)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <IconLock className="w-3 h-3 text-emerald-400" />
                  Original CPSE codes immutable
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedItem.linked_materials.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl glass-card bg-white/[0.02] border border-white/10 space-y-2 hover:border-white/20 transition"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          {m.cpse}
                        </span>
                        <div className="flex items-center gap-1">
                          <IconLock className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-mono text-xs font-bold text-white tracking-wide">
                            {m.material_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans ml-1">(Original Internal Code)</span>
                        </div>
                      </div>
                      <StatusBadge status={m.matching_status} size="xs" />
                    </div>

                    <p className="text-xs text-slate-200 font-medium">
                      {m.description}
                    </p>

                    {m.technical_specification && (
                      <p className="text-[11px] text-slate-300 font-mono bg-white/5 p-2 rounded-lg border border-white/10">
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
              <div className="p-4 rounded-2xl glass-card bg-white/[0.03] border border-white/10 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Consolidated Cross-CPSE Demand:
                  </span>
                  <span className="font-mono text-lg font-bold text-white mt-0.5 block">
                    {selectedItem.total_annual_quantity.toLocaleString()} {selectedItem.uom}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Estimated Public Procurement Value:
                  </span>
                  <span className="font-mono text-lg font-bold text-emerald-400 mt-0.5 block">
                    ₹{(selectedItem.estimated_spend / 1e5).toFixed(2)} Lakh
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">
                National Material Codification • Cross-CPSE Engine
              </span>
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 rounded-xl glass-btn-secondary text-white font-medium shadow-sm transition"
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
