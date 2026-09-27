import React, { useState, useEffect, useCallback } from 'react';
import {
  IconSearch,
  IconFilter,
  IconRotateCcw,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconBuilding,
  IconBoxes,
  IconAlertCircle,
  IconFileSpreadsheet,
  IconCheckCircle,
  IconDownload,
} from '../components/icons/Icons';
import StatusBadge from '../components/StatusBadge';
import MaterialDetailModal from '../components/MaterialDetailModal';
import materialService from '../services/materialService';
import { exportToCsv, getDateStamp } from '../utils/csvExport';

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
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
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
        limit: PAGE_SIZE + 1,
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

  // CSV Export handler
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = { limit: 1000, skip: 0 };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (cpseFilter) params.cpse = cpseFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.matching_status = statusFilter;

      const allMaterials = await materialService.getMaterials(params);
      const recordsToExport = allMaterials.length > 0 ? allMaterials : materials;

      if (recordsToExport.length === 0) {
        return;
      }

      const filename = `MATPULSE_Material_Master_${getDateStamp()}.csv`;
      const headers = [
        { key: 'material_code', label: 'Material Code' },
        { key: 'cpse', label: 'CPSE Organization' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'sub_category', label: 'Sub-Category' },
        { key: 'uom', label: 'UOM' },
        { key: 'specifications', label: 'Technical Specifications' },
        { key: 'matching_status', label: 'Matching Status' },
        { key: 'common_material_code', label: 'Common Material Code' },
        { key: 'created_at', label: 'Created At' },
      ];

      const flattenedRows = recordsToExport.map((m) => {
        let specsStr = '';
        if (m.specifications) {
          if (typeof m.specifications === 'object') {
            specsStr = Object.entries(m.specifications)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ');
          } else {
            specsStr = String(m.specifications);
          }
        }

        return {
          material_code: m.material_code,
          cpse: m.cpse,
          description: m.description,
          category: m.category || '',
          sub_category: m.sub_category || '',
          uom: m.uom || '',
          specifications: specsStr,
          matching_status: m.matching_status || '',
          common_material_code: m.common_material_code || '',
          created_at: m.created_at || '',
        };
      });

      exportToCsv({ filename, headers, rows: flattenedRows });
    } catch (err) {
      console.error('Failed to export materials CSV', err);
    } finally {
      setIsExporting(false);
    }
  };

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
      {/* Header with Local Readability Protection */}
      <div className="glass-header-scrim p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight text-shadow-protect">Material Master Catalog</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Cross-CPSE Registry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300/90 mt-1 text-shadow-protect">
            Universal federated material inventory with specification attribution and harmonized codes.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            disabled={loading || isExporting || materials.length === 0}
            className="glass-btn-primary px-4 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Export material master records to CSV"
          >
            <IconDownload className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-200 glass-card px-3 py-2 rounded-xl">
            <IconBoxes className="w-4 h-4 text-blue-400" />
            <span>Showing page <strong className="font-semibold text-white">{page + 1}</strong> ({materials.length} items)</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search materials by code, description, specification, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2 text-xs rounded-xl"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* CPSE Select */}
            <select
              value={cpseFilter}
              onChange={handleCpseChange}
              className="glass-input px-3 py-2 text-xs rounded-xl cursor-pointer"
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
              className="glass-input px-3 py-2 text-xs rounded-xl cursor-pointer max-w-[170px] truncate"
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
              className="glass-input px-3 py-2 text-xs rounded-xl cursor-pointer"
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
                className="glass-btn-secondary px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                title="Reset all filters"
              >
                <IconRotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-200 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <IconAlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-100">API Connection Error</p>
              <p className="mt-0.5 text-rose-300">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchMaterials}
            className="px-3 py-1 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 text-rose-100 font-medium transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Materials Table Container */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/10 text-white/60 font-mono tracking-wider text-[11px]">
                <th className="py-3.5 px-4">CPSE</th>
                <th className="py-3.5 px-4">Material Code</th>
                <th className="py-3.5 px-4 min-w-[260px]">Description &amp; Spec</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">UOM</th>
                <th className="py-3.5 px-4">Common Material Code</th>
                <th className="py-3.5 px-4">Matching Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-white">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="h-5 w-14 bg-white/10 rounded-full" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-28 bg-white/10 rounded font-mono" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-56 bg-white/10 rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-20 bg-white/10 rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-10 bg-white/10 rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-32 bg-white/10 rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-5 w-20 bg-white/10 rounded-full" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-6 w-16 bg-white/10 rounded-xl ml-auto" />
                    </td>
                  </tr>
                ))
              ) : materials.length > 0 ? (
                materials.map((mat) => (
                  <tr
                    key={mat.id}
                    onClick={() => setSelectedMaterial(mat)}
                    className="hover:bg-white/[0.06] transition-colors cursor-pointer group"
                  >
                    {/* CPSE */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-medium text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white/90 border border-white/10">
                        {mat.cpse}
                      </span>
                    </td>

                    {/* Original CPSE Material Code */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-300">
                      {mat.material_code}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4">
                      <p className="line-clamp-1 text-white font-sans font-medium" title={mat.description}>
                        {mat.description}
                      </p>
                      {mat.technical_specification && (
                        <p className="line-clamp-1 text-[11px] text-white/50 font-mono mt-0.5" title={mat.technical_specification}>
                          {mat.technical_specification}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-white/70">
                      {mat.category || '—'}
                    </td>

                    {/* UOM */}
                    <td className="py-3.5 px-4 font-mono text-white/70">
                      {mat.uom || '—'}
                    </td>

                    {/* Common Material Code (Harmonized) */}
                    <td className="py-3.5 px-4">
                      {mat.common_material_code ? (
                        <span className="font-mono text-[11px] font-semibold text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                          {mat.common_material_code}
                        </span>
                      ) : (
                        <span className="text-white/40 font-mono text-[11px] italic">
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
                        className="glass-btn-secondary px-3 py-1 rounded-xl text-[11px] text-white/80 group-hover:text-white group-hover:border-blue-400/50 cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <IconEye className="w-3.5 h-3.5 text-white/60 group-hover:text-blue-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-white/50">
                    <IconFileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-white/30" />
                    <p className="text-sm font-semibold text-white">No materials found</p>
                    <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
                      No material records match your active search or filter criteria. Try adjusting or resetting filters.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-4 glass-btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <IconRotateCcw className="w-3.5 h-3.5" />
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
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-white/60">
          <div>
            <span>
              Page <strong className="font-semibold text-white font-mono">{page + 1}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="glass-btn-secondary px-3 py-1.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <IconChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage || loading}
              className="glass-btn-secondary px-3 py-1.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <IconChevronRight className="w-3.5 h-3.5" />
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
