import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'neutral',
  isLoading = false,
}) {
  const badgeStyles = {
    neutral: 'bg-white/[0.08] text-white/90 border-white/15',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    brand: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  };

  return (
    <div className="relative overflow-hidden glass-kpi-card glass-card-hover rounded-2xl p-5 shadow-xl transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 font-mono">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-white/10 animate-pulse rounded my-1" />
          ) : (
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono kpi-value">{value}</h3>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-blue-400 shadow-inner">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs">
        {isLoading ? (
          <div className="h-4 w-32 bg-white/10 animate-pulse rounded" />
        ) : (
          <span className="text-slate-200 font-medium">{subtitle}</span>
        )}
        {badgeText && !isLoading && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border backdrop-blur-sm ${
              badgeStyles[badgeType] || badgeStyles.neutral
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
