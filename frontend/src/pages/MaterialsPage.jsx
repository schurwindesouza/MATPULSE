import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  Boxes,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MaterialDetailModal from '../components/MaterialDetailModal';
import materialService from '../services/materialService';

const CPSE_OPTIONS = [
  { value: '', label: 'All CPSEs' },
  { value: 'BHEL', label: 'BHEL' },
  { value: 'NTPC', label: 'NTPC' },
  { value: 'ONGC', label: 'ONGC' },
  { value: 'SAIL', label: 'SAIL' },
  { value: 'IOCL', label: 'IOCL' },
  { value: 'COAL_INDIA', label: 'Coal India (CIL)' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'Pipes & Tubes', label: 'Pipes & Tubes' },
  { value: 'Piping Material', label: 'Piping Material' },
  { value: 'Line Pipes', label: 'Line Pipes' },
  { value: 'Valves', label: 'Valves' },
  { value: 'Process Valves', label: 'Process Valves' },
  { value: 'Electrical Switchgear', label: 'Electrical Switchgear' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Cables', label: 'Cables' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'MATCHED', label: 'Matched' },
  { value: 'UNMATCHED', label: 'Unmatched' },
  { value: 'SUGGESTED', label: 'Suggested' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'REJECTED', label: 'Rejected' },
];

const PAGE_SIZE = 10;

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cpseFilter, setCpseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Selected material for detail modal
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset page on new search query
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch materials from backend API
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE + 1, // Fetch 1 extra to determine hasNextPage
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (cpseFilter) params.cpse = cpseFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.matching_status = statusFilter;

      const data = await materialService.getMaterials(params);

      if (data.length > PAGE_SIZE) {
        setHasNextPage(true);
        setMaterials(data.slice(0, PAGE_SIZE));
      } else {
        setHasNextPage(false);
        setMaterials(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load materials from backend');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, cpseFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Filter change handlers
  const handleCpseChange = (e) => {
    setCpseFilter(e.target.value);
    setPage(0);
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setPage(0);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCpseFilter('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(0);
  };

  const hasActiveFilters = Boolean(
    search.trim() || cpseFilter || categoryFilter || statusFilter
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Material Master</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cross-CPSE material catalog & master data repository.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
          <Boxes className="w-4 h-4 text-indigo-400" />
          <span>Showing page {page + 1} ({materials.length} items on page)</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search materials (code, description, spec, normalized tokens)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 transition"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* CPSE Select */}
            <select
              value={cpseFilter}
              onChange={handleCpseChange}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500/70 transition"
            >
              {CPSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500/70 transition max-w-[160px] truncate"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Matching Status Select */}
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500/70 transition"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">API Connection Error</p>
              <p className="mt-0.5 text-rose-300/80">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchMaterials}
            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-medium transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Materials Table Container */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">CPSE</th>
                <th className="py-3.5 px-4">Material Code</th>
                <th className="py-3.5 px-4 min-w-[240px]">Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">UOM</th>
                <th className="py-3.5 px-4">Common Material Code</th>
                <th className="py-3.5 px-4">Matching Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                // Loading Skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-5 w-14 bg-slate-800 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-28 bg-slate-800 rounded font-mono" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-56 bg-slate-800 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-20 bg-slate-800 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-10 bg-slate-800 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-32 bg-slate-800 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-5 w-20 bg-slate-800 rounded" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-6 w-16 bg-slate-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : materials.length > 0 ? (
                // Rendered Materials Rows
                materials.map((mat) => (
                  <tr
                    key={mat.id}
                    onClick={() => setSelectedMaterial(mat)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* CPSE */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700/60">
                        {mat.cpse}
                      </span>
                    </td>

                    {/* Original CPSE Material Code */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      {mat.material_code}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4">
                      <p className="line-clamp-1 text-slate-300 font-sans" title={mat.description}>
                        {mat.description}
                      </p>
                      {mat.technical_specification && (
                        <p className="line-clamp-1 text-[11px] text-slate-500 font-mono mt-0.5">
                          {mat.technical_specification}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {mat.category || '—'}
                    </td>

                    {/* UOM */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {mat.uom || '—'}
                    </td>

                    {/* Common Material Code (Harmonized) */}
                    <td className="py-3.5 px-4">
                      {mat.common_material_code ? (
                        <span className="font-mono text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                          {mat.common_material_code}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px] italic">
                          Not assigned
                        </span>
                      )}
                    </td>

                    {/* Matching Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={mat.matching_status} size="xs" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMaterial(mat);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 group-hover:bg-indigo-600/30 text-slate-300 group-hover:text-indigo-200 border border-slate-700/80 group-hover:border-indigo-500/40 text-[11px] font-medium transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                // Empty State
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">No materials found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      No material records match your active search or filter criteria. Try adjusting or resetting filters.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Clear All Filters</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div>
            <span>
              Page <span className="font-semibold text-slate-200">{page + 1}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-xs font-medium transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-xs font-medium transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  );
}
