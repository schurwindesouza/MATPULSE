import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  IconDatabase,
  IconBuilding,
  IconCheckCircle,
  IconAlertCircle,
  IconSparkles,
  IconLayers,
  IconFilter,
  IconRotateCcw,
  IconRefresh,
  IconClock,
  IconThumbsUp,
  IconThumbsDown,
  IconShieldAlert,
  IconArrowRight,
  IconTrendingUp,
  IconSearch,
  IconChevronRight,
  IconBoxes,
  IconCpu,
  IconLock,
  IconInfo,
  IconCheck,
  IconAlertTriangle,
  IconDownload,
} from '../components/icons/Icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import analyticsService from '../services/analyticsService';
import { exportToCsv, getDateStamp } from '../utils/csvExport';

const STATUS_COLORS = {
  MATCHED: '#059669',    // Emerald-600
  SUGGESTED: '#d97706',  // Amber-600
  UNMATCHED: '#64748b',  // Slate-500
  REVIEWED: '#2563eb',   // Blue-600
  REJECTED: '#e11d48',   // Rose-600
};

const PALETTE = ['#1d4ed8', '#0284c7', '#0d9488', '#059669', '#d97706', '#7c3aed', '#db2777', '#475569'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedCpse, setSelectedCpse] = useState('All CPSEs');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');

  // Search state for Common Materials table
  const [tableSearch, setTableSearch] = useState('');

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const params = {};
      if (selectedCpse && selectedCpse !== 'All CPSEs') params.cpse = selectedCpse;
      if (selectedCategory && selectedCategory !== 'All Categories') params.category = selectedCategory;
      if (selectedStatus && selectedStatus !== 'All Statuses') params.matching_status = selectedStatus;

      const res = await analyticsService.getOverview(params);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load analytics data from MATPULSE API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCpse, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleResetFilters = () => {
    setSelectedCpse('All CPSEs');
    setSelectedCategory('All Categories');
    setSelectedStatus('All Statuses');
    setTableSearch('');
  };

  const activeFiltersCount =
    (selectedCpse !== 'All CPSEs' ? 1 : 0) +
    (selectedCategory !== 'All Categories' ? 1 : 0) +
    (selectedStatus !== 'All Statuses' ? 1 : 0);

  // Filtered Common Materials for table search
  const filteredCommonMaterials = useMemo(() => {
    if (!data?.common_materials) return [];
    if (!tableSearch.trim()) return data.common_materials;
    const q = tableSearch.toLowerCase().trim();
    return data.common_materials.filter(
      (item) =>
        item.common_material_code.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        item.cpses.some((c) => c.toLowerCase().includes(q))
    );
  }, [data?.common_materials, tableSearch]);

  // Chart datasets
  const cpseChartData = data?.cpse_distribution || [];

  const statusChartData = (data?.harmonization_status || []).map((item) => ({
    name: item.status,
    value: item.count,
    percentage: item.percentage,
    color: STATUS_COLORS[item.status] || '#64748b',
  }));

  const categoryChartData = (data?.category_distribution || []).slice(0, 8).map((item) => ({
    category: item.category.length > 20 ? item.category.slice(0, 18) + '...' : item.category,
    fullCategory: item.category,
    count: item.count,
    percentage: item.percentage,
  }));

  const confidenceBuckets = data?.confidence_distribution?.buckets || [];

  const reviewStats = data?.review || {
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    total_reviewed: 0,
    approval_rate: 0.0,
    rejection_rate: 0.0,
    rejection_reasons: [],
  };

  // Export Analytics CSV
  const handleExportCsv = () => {
    if (!data) return;

    const filename = `MATPULSE_Analytics_${getDateStamp()}.csv`;
    const headers = [
      { key: 'section', label: 'Section' },
      { key: 'category', label: 'Category / Organization' },
      { key: 'metric', label: 'Metric / Name' },
      { key: 'value', label: 'Value / Count' },
      { key: 'details', label: 'Share (%) / Details' },
    ];

    const rows = [];

    // Executive KPIs
    if (data.kpis) {
      rows.push(
        { section: 'Executive KPIs', category: 'Catalog', metric: 'Total Material Master Records', value: data.kpis.total_materials, details: '100% catalog base' },
        { section: 'Executive KPIs', category: 'Catalog', metric: 'Harmonized Materials', value: data.kpis.matched_materials, details: 'Assigned Common Material Code' },
        { section: 'Executive KPIs', category: 'Catalog', metric: 'Harmonization Rate', value: `${data.kpis.harmonization_rate}%`, details: 'Proportion of inventory standardized' },
        { section: 'Executive KPIs', category: 'Matching', metric: 'Match Recommendations Requiring Review', value: data.kpis.pending_recommendations, details: 'Candidate equivalence pairs' },
        { section: 'Executive KPIs', category: 'Enterprise', metric: 'Participating CPSEs', value: data.kpis.total_cpses, details: 'Active CPSE organizations' },
        { section: 'Executive KPIs', category: 'Enterprise', metric: 'Material Categories', value: data.kpis.total_categories, details: 'Distinct taxonomy classes' },
        { section: 'Executive KPIs', category: 'Standardization', metric: 'Standardized Common Codes', value: data.kpis.common_codes_count, details: 'Assigned National Material Codes' }
      );
    }

    // Review Governance
    if (data.review) {
      rows.push(
        { section: 'Review Governance', category: 'Workflow', metric: 'Pending Review', value: data.review.pending_count, details: 'Awaiting human verification' },
        { section: 'Review Governance', category: 'Workflow', metric: 'Approved Matches', value: data.review.approved_count, details: 'Standardized by review committee' },
        { section: 'Review Governance', category: 'Workflow', metric: 'Rejected Matches', value: data.review.rejected_count, details: 'Declined during review' },
        { section: 'Review Governance', category: 'Workflow', metric: 'Total Reviews Conducted', value: data.review.total_reviewed, details: 'Historical review actions' },
        { section: 'Review Governance', category: 'Workflow', metric: 'Human Approval Rate', value: `${data.review.approval_rate}%`, details: 'Approved vs rejected ratio' }
      );
    }

    // CPSE Distribution
    (data.cpse_distribution || []).forEach((item) => {
      rows.push({
        section: 'CPSE Distribution',
        category: item.cpse,
        metric: 'Material Records',
        value: item.count,
        details: `${item.percentage}% of total catalog`,
      });
    });

    // Harmonization Status Distribution
    (data.harmonization_status || []).forEach((item) => {
      rows.push({
        section: 'Harmonization Status',
        category: item.status,
        metric: 'Records Count',
        value: item.count,
        details: `${item.percentage}% of total catalog`,
      });
    });

    // Category Distribution
    (data.category_distribution || []).forEach((item) => {
      rows.push({
        section: 'Category Distribution',
        category: item.category,
        metric: 'Material Records',
        value: item.count,
        details: `${item.percentage}% of total catalog`,
      });
    });

    // Common Materials
    (data.common_materials || []).forEach((item) => {
      rows.push({
        section: 'Standardized Common Materials',
        category: item.category || 'Standardized',
        metric: item.common_material_code,
        value: `${item.materials_count} materials`,
        details: `CPSEs: ${(item.cpses || []).join(', ')}`,
      });
    });

    exportToCsv({ filename, headers, rows });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Procurement Harmonization Analytics
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Live Database
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Cross-CPSE material harmonization, matching quality, review governance, and standardized common codes.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
            <IconInfo className="w-3.5 h-3.5 text-amber-600" />
            <span>Derived from SQLite database records. Live analytical telemetry active.</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700 shadow-sm transition"
              title="Reset all active filters"
            >
              <IconRotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters ({activeFiltersCount})</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            disabled={loading || !data}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 shadow-sm transition disabled:opacity-50"
            title="Export full analytics report to CSV"
          >
            <IconDownload className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Analytics CSV</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <IconAlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Analytics Connection Error</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Interactive Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <IconFilter className="w-4 h-4 text-blue-600" />
          <span>Analytics Filters:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 md:max-w-3xl">
          {/* CPSE Filter */}
          <div>
            <select
              value={selectedCpse}
              onChange={(e) => setSelectedCpse(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 text-xs rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-blue-600 transition"
            >
              <option value="All CPSEs">All CPSE Catalogs</option>
              {(data?.filter_options?.cpses || []).map((cpse) => (
                <option key={cpse} value={cpse}>
                  {cpse}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 text-xs rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-blue-600 transition"
            >
              <option value="All Categories">All Categories</option>
              {(data?.filter_options?.categories || []).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 text-xs rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-blue-600 transition"
            >
              <option value="All Statuses">All Harmonization Statuses</option>
              <option value="MATCHED">MATCHED</option>
              <option value="SUGGESTED">SUGGESTED</option>
              <option value="UNMATCHED">UNMATCHED</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Cards */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Materials"
            value={data?.summary?.total_materials ?? 0}
            subtitle="Evaluated catalog items"
            icon={IconDatabase}
            badgeText={activeFiltersCount > 0 ? 'Filtered' : 'All Master'}
            badgeType="neutral"
            isLoading={loading}
          />
          <StatCard
            title="Connected CPSEs"
            value={data?.summary?.distinct_cpses ?? 0}
            subtitle="Distinct enterprise catalogs"
            icon={IconBuilding}
            badgeText="Integrated"
            badgeType="brand"
            isLoading={loading}
          />
          <StatCard
            title="Harmonized Materials"
            value={data?.summary?.matched_materials ?? 0}
            subtitle="Material records assigned a Common Material Code"
            icon={IconCheckCircle}
            badgeText={`${data?.summary?.harmonization_rate ?? 0}% Rate`}
            badgeType="success"
            isLoading={loading}
          />
          <StatCard
            title="Match Recommendations"
            value={data?.summary?.pending_reviews ?? 0}
            subtitle="AI recommendations requiring review"
            icon={IconClock}
            badgeText={data?.summary?.pending_reviews ? 'Actionable' : 'Clear'}
            badgeType={data?.summary?.pending_reviews ? 'warning' : 'neutral'}
            isLoading={loading}
          />
          <StatCard
            title="Common Groups"
            value={data?.summary?.total_common_codes ?? 0}
            subtitle={`${data?.summary?.total_mapped_materials ?? 0} mapped items`}
            icon={IconLayers}
            badgeText="Unified"
            badgeType="brand"
            isLoading={loading}
          />
        </div>

        {/* Entity tracking clarification note */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs">
          <IconInfo className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            Material records and match recommendations are tracked as separate entities. One material can participate in a match recommendation.
          </span>
        </div>
      </div>

      {/* 4. Section 1: CPSE Material Distribution & Harmonization Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CPSE Distribution (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span>CPSE Material Distribution</span>
                <span className="text-slate-500 font-normal text-xs">• Real Database Data</span>
              </h2>
              <p className="text-xs text-slate-500">Total ingested material records by enterprise CPSE</p>
            </div>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              {cpseChartData.length} Organizations
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
              </div>
            ) : cpseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cpseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="cpse"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#0f172a',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value, name, props) => [
                      `${value} items (${props.payload.percentage}%)`,
                      'Catalog Volume',
                    ]}
                    cursor={{ fill: 'rgba(29, 78, 216, 0.04)' }}
                  />
                  <Bar dataKey="count" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Materials" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No CPSE catalog records found for active filters.
              </div>
            )}
          </div>

          {/* CPSE Breakdown summary chips */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] text-slate-500 font-medium">Breakdown:</span>
            {cpseChartData.map((item) => (
              <span
                key={item.cpse}
                className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-mono"
              >
                {item.cpse}: <strong className="text-slate-900">{item.count}</strong> ({item.percentage}%)
              </span>
            ))}
          </div>
        </div>

        {/* Harmonization Status Donut (1 col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-slate-900">Harmonization Status</h2>
              <p className="text-xs text-slate-500">Proportion of standardized vs pending catalog items</p>
            </div>

            <div className="h-52 relative flex items-center justify-center">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
                </div>
              ) : statusChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#0f172a',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(val, name, item) => [`${val} items (${item.payload.percentage}%)`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Donut Metric */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {data?.summary?.harmonization_rate ?? 0}%
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Harmonized</span>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No status data available.
                </div>
              )}
            </div>
          </div>

          {/* Status Breakdown Legend Cards */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            {statusChartData.map((st) => (
              <div key={st.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                  <span className="text-slate-700 font-medium">{st.name}</span>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">
                  {st.value} ({st.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Section 2: Category Distribution & Match Confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-Wise Material Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Category-Wise Distribution</h2>
                <p className="text-xs text-slate-500">Material volume distribution across industrial domain groups</p>
              </div>
              <IconBoxes className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5 animate-pulse">
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                    <div className="h-2 bg-slate-100 rounded w-full" />
                  </div>
                ))
              ) : categoryChartData.length > 0 ? (
                categoryChartData.map((item, index) => {
                  const color = PALETTE[index % PALETTE.length];
                  return (
                    <div key={item.fullCategory} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 truncate max-w-[260px]" title={item.fullCategory}>
                          {item.fullCategory}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {item.count} items ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">No category data matching filter criteria.</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Categories represented: {data?.category_distribution?.length || 0}</span>
            <span>Sorted by volume descending</span>
          </div>
        </div>

        {/* Match Confidence Analytics */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">Match Confidence Analytics</h2>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    <IconCpu className="w-3 h-3" />
                    <span>all-MiniLM-L6-v2</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500">Score distribution of evaluated candidate recommendations</p>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold font-mono text-emerald-700">
                  {data?.confidence_distribution?.avg_confidence ?? 0}%
                </span>
                <p className="text-[10px] text-slate-400 uppercase font-medium">Avg Score</p>
              </div>
            </div>

            {/* Confidence KPI Mini-Cards */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-[10px] text-emerald-800 uppercase font-semibold">High (≥ 90%)</p>
                <p className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
                  {data?.confidence_distribution?.high_confidence_count ?? 0}
                </p>
                <p className="text-[10px] text-slate-500">High-confidence pair</p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-[10px] text-amber-800 uppercase font-semibold">Review (70-89%)</p>
                <p className="text-lg font-bold font-mono text-amber-900 mt-0.5">
                  {data?.confidence_distribution?.medium_confidence_count ?? 0}
                </p>
                <p className="text-[10px] text-slate-500">Human review</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[10px] text-slate-600 uppercase font-semibold">Low (&lt; 70%)</p>
                <p className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                  {data?.confidence_distribution?.low_confidence_count ?? 0}
                </p>
                <p className="text-[10px] text-slate-400">Filtered</p>
              </div>
            </div>

            {/* Score Buckets */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Score Range Distribution:</p>
              {confidenceBuckets.map((b) => (
                <div key={b.bucket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{b.range_label}</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {b.count} pairs ({b.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.bucket === '90-100%'
                          ? 'bg-emerald-600'
                          : b.bucket === '80-89%'
                          ? 'bg-blue-600'
                          : b.bucket === '70-79%'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${b.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total candidate recommendations: {data?.confidence_distribution?.total_matches ?? 0}</span>
            <Link to="/matching" className="text-blue-700 hover:text-blue-800 transition flex items-center gap-1 font-medium">
              <span>Run Matching Engine</span>
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Section 3: Review & Decision Analytics */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Review & Decision Analytics</h2>
            <p className="text-xs text-slate-500">Human-in-the-loop validation metrics and rejection reason breakdown</p>
          </div>
          <Link
            to="/review-queue"
            className="text-xs text-blue-700 hover:text-blue-800 flex items-center gap-1 font-medium transition"
          >
            <span>Open Review Queue</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Review KPI 1 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <IconClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Pending Review</p>
              <h4 className="text-xl font-bold font-mono text-slate-900">{reviewStats.pending_count}</h4>
              <p className="text-[10px] text-slate-400">Awaiting expert action</p>
            </div>
          </div>

          {/* Review KPI 2 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <IconThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Approved Matches</p>
              <h4 className="text-xl font-bold font-mono text-slate-900">{reviewStats.approved_count}</h4>
              <p className="text-[10px] text-emerald-700 font-mono font-medium">{reviewStats.approval_rate}% Approval Rate</p>
            </div>
          </div>

          {/* Review KPI 3 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              <IconThumbsDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Rejected Matches</p>
              <h4 className="text-xl font-bold font-mono text-slate-900">{reviewStats.rejected_count}</h4>
              <p className="text-[10px] text-rose-700 font-mono font-medium">{reviewStats.rejection_rate}% Rejection Rate</p>
            </div>
          </div>

          {/* Review KPI 4 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <IconCheckCircle className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Total Decisions</p>
              <h4 className="text-xl font-bold font-mono text-slate-900">{reviewStats.total_reviewed}</h4>
              <p className="text-[10px] text-slate-400">Historical reviews</p>
            </div>
          </div>
        </div>

        {/* Rejection Reasons Section */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <IconShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Documented Rejection Reasons</span>
            </p>
            <span className="text-[11px] text-slate-500">Real justifications entered by domain reviewers</span>
          </div>

          {reviewStats.rejection_reasons && reviewStats.rejection_reasons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {reviewStats.rejection_reasons.map((r, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-sm"
                >
                  <span className="text-xs text-slate-800 font-medium truncate" title={r.reason}>
                    {r.reason}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-mono flex-shrink-0">
                    {r.count} {r.count === 1 ? 'case' : 'cases'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center rounded-lg bg-white border border-slate-200">
              <p className="text-xs text-slate-500">
                {reviewStats.rejected_count === 0
                  ? 'No rejected match recommendations recorded in the system.'
                  : 'Rejections currently recorded without specific textual reason codes.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 7. Section 4: Cross-CPSE Common Materials */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span>Cross-CPSE Common Materials</span>
              <span className="text-xs font-normal text-slate-500">
                ({filteredCommonMaterials.length} Harmonized Groups)
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Unified Common National Material Codes mapped across multiple CPSE enterprise catalogs
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <IconSearch className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search common codes or CPSEs..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg pl-8 pr-3 py-1.5 outline-none focus:bg-white focus:border-blue-600 w-56 transition"
              />
            </div>

            <Link
              to="/common-materials"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-slate-300 shadow-sm transition"
            >
              <span>Catalog View</span>
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Common National Material Code</th>
                <th className="py-3 px-4">CPSE Coverage</th>
                <th className="py-3 px-4">Original Codes</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredCommonMaterials.length > 0 ? (
                filteredCommonMaterials.map((item) => (
                  <tr key={item.common_material_code} className="hover:bg-slate-50 transition-colors">
                    {/* Common Code */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-700">{item.common_material_code}</span>
                      </div>
                    </td>

                    {/* CPSE Coverage */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-mono text-blue-700 font-semibold">
                          {item.cpse_count} CPSEs
                        </span>
                        {item.cpses.map((c) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-700 border border-slate-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Original Codes */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <span className="font-semibold text-slate-900">{item.original_codes_count}</span> codes mapped
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-700 border border-slate-200">
                        {item.category || 'General'}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-4 font-mono">
                      {item.confidence ? (
                        <span className="text-emerald-700 font-bold">{item.confidence}%</span>
                      ) : (
                        <span className="text-slate-400">Verified</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} size="xs" />
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/common-materials?code=${item.common_material_code}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-800 transition"
                      >
                        <span>Inspect</span>
                        <IconChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No common material groups found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Section 5: Data Quality & Migration Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Migration Readiness Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Migration & Harmonization Readiness</h2>
              <p className="text-xs text-slate-500">Classified status of CPSE catalogs towards full harmonization</p>
            </div>
            <IconTrendingUp className="w-4 h-4 text-emerald-600" />
          </div>

          {/* Segmented Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${data?.readiness?.ready_percentage ?? 0}%` }}
                className="bg-emerald-600 transition-all duration-500"
                title={`Ready: ${data?.readiness?.ready_percentage}%`}
              />
              <div
                style={{ width: `${data?.readiness?.needs_review_percentage ?? 0}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Needs Review: ${data?.readiness?.needs_review_percentage}%`}
              />
              <div
                style={{ width: `${data?.readiness?.unmatched_blocked_percentage ?? 0}%` }}
                className="bg-slate-400 transition-all duration-500"
                title={`Unmatched: ${data?.readiness?.unmatched_blocked_percentage}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" /> Ready ({data?.readiness?.ready_percentage ?? 0}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Needs Review ({data?.readiness?.needs_review_percentage ?? 0}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Unmatched ({data?.readiness?.unmatched_blocked_percentage ?? 0}%)
              </span>
            </div>
          </div>

          {/* Detailed State Explanations */}
          <div className="space-y-2.5 pt-2">
            {(data?.readiness?.items || []).map((stateItem) => (
              <div
                key={stateItem.state}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        stateItem.state.startsWith('Ready')
                          ? 'bg-emerald-600'
                          : stateItem.state.startsWith('Needs')
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-800">{stateItem.state}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{stateItem.description}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold font-mono text-slate-900">{stateItem.count} items</span>
                  <p className="text-[10px] text-slate-400">{stateItem.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Catalog Data Quality Audit</h2>
              <p className="text-xs text-slate-500">Completeness check across CPSE material master attributes</p>
            </div>
            <div className="flex items-center gap-1 text-emerald-700 font-mono text-xs font-bold">
              <span>{data?.data_quality?.completeness_score ?? 0}%</span>
              <span className="text-[10px] text-slate-400 font-normal">Completeness</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Missing Desc</p>
              <h4 className="text-lg font-bold font-mono text-slate-900 mt-1">
                {data?.data_quality?.missing_descriptions ?? 0}
              </h4>
              <p className="text-[10px] text-slate-400">Zero allowed</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Missing UOM</p>
              <h4 className="text-lg font-bold font-mono text-slate-900 mt-1">
                {data?.data_quality?.missing_uom ?? 0}
              </h4>
              <p className="text-[10px] text-slate-400">Unit of measure</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Missing Category</p>
              <h4 className="text-lg font-bold font-mono text-slate-900 mt-1">
                {data?.data_quality?.missing_category ?? 0}
              </h4>
              <p className="text-[10px] text-slate-400">Domain classification</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Missing Tech Spec</p>
              <h4 className="text-lg font-bold font-mono text-slate-900 mt-1">
                {data?.data_quality?.missing_tech_specs ?? 0}
              </h4>
              <p className="text-[10px] text-slate-400">Standards & grades</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Code Collisions</p>
              <h4 className="text-lg font-bold font-mono text-amber-700 mt-1">
                {data?.data_quality?.cross_cpse_code_collisions ?? 0}
              </h4>
              <p className="text-[10px] text-slate-400">Identical code in &gt;1 CPSE</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Action Required</p>
              <h4 className="text-lg font-bold font-mono text-blue-700 mt-1">
                {data?.data_quality?.records_requiring_review ?? 0}
              </h4>
              <p className="text-[10px] text-slate-400">Pending review</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <IconCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Overall catalog health is at{' '}
              <strong className="text-slate-900 font-mono">{data?.data_quality?.completeness_score ?? 0}%</strong>{' '}
              data completeness across {data?.data_quality?.total_evaluated ?? 0} material records.
            </p>
          </div>
        </div>
      </div>

      {/* 9. Section 6: Clearly Labelled Future Procurement Intelligence */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-50 via-slate-50 to-blue-50/40 border border-slate-200 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-mono border border-blue-200">
              <span>Roadmap Target: Phase 10</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Procurement Intelligence — Future Data Integration
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Procurement transaction data (Purchase Orders, Unit Pricing, Invoices, Delivery Schedules, and Supplier
              Masters) is required to calculate enterprise-wide spend, volume consolidation savings, vendor overlap, price
              disparity, and demand aggregation.
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-white text-[11px] font-mono text-slate-600 border border-slate-300 shadow-sm self-start sm:self-auto">
            Requires ERP Feeds
          </span>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Volume Consolidation</span>
              <IconLock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500">
              Pools annual quantities across CPSEs to negotiate bulk rate brackets and volume discounts.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Vendor Overlap Analysis</span>
              <IconLock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500">
              Identifies common suppliers servicing multiple CPSEs to establish rate contract parity.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Unit Price Disparity Heatmap</span>
              <IconLock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500">
              Flags variance where CPSE A pays more than CPSE B for identical engineering specifications.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Demand Aggregation Horizon</span>
              <IconLock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500">
              Synchronizes multi-year procurement schedules across participating public enterprises.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
