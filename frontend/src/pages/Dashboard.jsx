import React, { useState, useEffect, useCallback } from 'react';
import {
  IconDatabase,
  IconBuilding,
  IconAlertCircle,
  IconCheckCircle,
  IconSparkles,
  IconRefresh,
  IconArrowRight,
  IconCpu,
  IconLayers,
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
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import materialService from '../services/materialService';
import matchingService from '../services/matchingService';

// Futuristic glass chart colors
const STATUS_COLORS = {
  MATCHED: '#10b981',   // emerald-500
  UNMATCHED: '#64748b', // slate-500
  SUGGESTED: '#f59e0b', // amber-500
  REVIEWED: '#3b82f6',  // blue-500
  REJECTED: '#f43f5e',  // rose-500
};

const PALETTE = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, queueData] = await Promise.all([
        materialService.getStats(),
        matchingService.getReviewQueue({ limit: 5 }).catch(() => []),
      ]);

      setStats(statsData);
      setRecentMatches(queueData || []);
    } catch (err) {
      setError(err.message || 'Failed to connect to MATPULSE API backend');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  // Prepare chart datasets
  const cpseChartData = stats?.cpse_breakdown
    ? Object.entries(stats.cpse_breakdown).map(([cpse, count]) => ({
        cpse,
        count,
      }))
    : [];

  const statusChartData = stats?.status_breakdown
    ? Object.entries(stats.status_breakdown).map(([status, count]) => ({
        name: status,
        value: count,
        color: STATUS_COLORS[status] || '#64748b',
      }))
    : [];

  const categoryChartData = stats?.category_breakdown
    ? Object.entries(stats.category_breakdown).map(([category, count]) => ({
        category: category.length > 18 ? category.slice(0, 16) + '...' : category,
        fullCategory: category,
        count,
      }))
    : [];

  const harmonizationRate = stats?.total_materials
    ? Math.round((stats.matched_count / stats.total_materials) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Glass Header with Local Readability Protection */}
      <div className="glass-header-scrim p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight text-shadow-protect">
              Executive Harmonization Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Live Production
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300/90 mt-1 text-shadow-protect">
            Real-time cross-CPSE material code standardization &amp; AI matching intelligence.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="glass-btn-secondary px-4 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <IconRefresh className={`w-3.5 h-3.5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-200 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <IconAlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-100">Backend Connection Error</p>
              <p className="mt-0.5 text-rose-300">{error}</p>
              <p className="mt-1 text-[11px] text-rose-400">
                Make sure the FastAPI server is running on <code className="bg-rose-950/60 px-1 py-0.5 rounded font-mono">http://127.0.0.1:8000</code>.
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 text-rose-100 font-medium transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Materials"
          value={stats?.total_materials ?? 0}
          subtitle="Master catalog records"
          icon={IconDatabase}
          badgeText="Active"
          badgeType="neutral"
          isLoading={loading}
        />
        <StatCard
          title="Connected CPSEs"
          value={stats?.distinct_cpses ?? 0}
          subtitle="Distinct enterprise catalogs"
          icon={IconBuilding}
          badgeText="Integrated"
          badgeType="brand"
          isLoading={loading}
        />
        <StatCard
          title="Unmatched Materials"
          value={stats?.unmatched_count ?? 0}
          subtitle="Pending AI evaluation"
          icon={IconAlertCircle}
          badgeText={stats?.total_materials ? `${Math.round(((stats?.unmatched_count ?? 0) / stats.total_materials) * 100)}%` : '0%'}
          badgeType="warning"
          isLoading={loading}
        />
        <StatCard
          title="Matched Materials"
          value={stats?.matched_count ?? 0}
          subtitle="Harmonized under Common Code"
          icon={IconCheckCircle}
          badgeText={`${harmonizationRate}% Rate`}
          badgeType="success"
          isLoading={loading}
        />
        <StatCard
          title="Suggested Matches"
          value={stats?.suggested_count ?? 0}
          subtitle="AI recommendations queue"
          icon={IconSparkles}
          badgeText="Actionable"
          badgeType="brand"
          isLoading={loading}
        />
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CPSE Distribution (2 cols) */}
        <div className="lg:col-span-2 glass-chart-panel rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">CPSE Catalog Volume</h2>
              <p className="text-xs text-slate-300">Total ingested material records by enterprise organization</p>
            </div>
            <span className="text-xs font-mono text-slate-200 bg-white/[0.08] px-2.5 py-1 rounded-full border border-white/10">
              {cpseChartData.length} CPSEs
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center bg-white/[0.02] rounded-2xl">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent animate-spin rounded-full" />
              </div>
            ) : cpseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cpseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                  <XAxis
                    dataKey="cpse"
                    stroke="#cbd5e1"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
                  />
                  <YAxis
                    stroke="#cbd5e1"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(5, 10, 20, 0.92)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#ffffff',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Materials Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No CPSE catalog data available.
              </div>
            )}
          </div>
        </div>

        {/* Harmonization Status Pie Chart (1 col) */}
        <div className="glass-chart-panel rounded-3xl p-6 shadow-2xl flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-white">Harmonization Status</h2>
            <p className="text-xs text-slate-300">Proportion of matched vs unmatched items</p>
          </div>

          <div className="flex-1 h-56 min-h-[220px]">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center bg-white/[0.02] rounded-2xl">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent animate-spin rounded-full" />
              </div>
            ) : statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(5, 10, 20, 0.92)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#ffffff',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: 'rgba(255, 255, 255, 0.85)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No status data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown & Recent AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (1 col) */}
        <div className="glass-chart-panel rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Category Distribution</h2>
              <p className="text-xs text-slate-300">Material distribution by domain group</p>
            </div>
            <IconLayers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                  <div className="h-2 bg-white/5 rounded w-full" />
                </div>
              ))
            ) : categoryChartData.length > 0 ? (
              categoryChartData.map((item, index) => {
                const total = stats?.total_materials || 1;
                const pct = Math.round((item.count / total) * 100);
                const color = PALETTE[index % PALETTE.length];

                return (
                  <div key={item.fullCategory} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white truncate max-w-[180px]" title={item.fullCategory}>
                        {item.fullCategory}
                      </span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400">No category breakdown data.</p>
            )}
          </div>
        </div>

        {/* Recent AI Recommendations (2 cols) */}
        <div className="lg:col-span-2 glass-chart-panel rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">AI Match Recommendations</h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    <IconCpu className="w-3 h-3 text-blue-400" />
                    <span>all-MiniLM-L6-v2</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300">High-confidence cross-CPSE candidate pairs awaiting review</p>
              </div>
              <Link
                to="/review-queue"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition"
              >
                <span>View Full Queue</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 bg-white/[0.03] rounded-2xl border border-white/10 animate-pulse h-16" />
                ))}
              </div>
            ) : recentMatches.length > 0 ? (
              <div className="space-y-2.5">
                {recentMatches.slice(0, 4).map((match) => (
                  <Link
                    key={match.id}
                    to={`/review-queue?match_id=${match.id}`}
                    className="p-3.5 bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 hover:border-blue-400/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all block group shadow-sm"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 group-hover:border-blue-400/50">
                          {match.material_a.cpse}
                        </span>
                        <span className="text-xs text-white font-medium truncate max-w-[200px]" title={match.material_a.description}>
                          {match.material_a.material_code}
                        </span>
                        <span className="text-slate-400 text-xs">↔</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 group-hover:border-purple-400/50">
                          {match.material_b.cpse}
                        </span>
                        <span className="text-xs text-white font-medium truncate max-w-[200px]" title={match.material_b.description}>
                          {match.material_b.material_code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate">
                        {match.reasons?.[0] || 'Technical attribute equivalence detected'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-xs font-bold text-white font-mono kpi-value">{match.final_confidence}%</span>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Confidence</p>
                      </div>
                      <StatusBadge status={match.status} size="xs" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-white/10">
                <IconCpu className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-200">No pending AI recommendations found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Run the batch matching engine to generate persistent candidate pairs.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>Harmonization Pipeline Active</span>
            <span className="font-mono text-[11px] text-slate-400">Deterministic + Transformer Architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
}
