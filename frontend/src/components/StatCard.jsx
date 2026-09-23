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
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-800/40',
    brand: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40',
  };

  return (
    <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 shadow-sm hover:border-slate-700/80 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-800 animate-pulse rounded my-1" />
          ) : (
            <h3 className="text-2xl font-bold tracking-tight text-white font-mono">{value}</h3>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-300">
            <Icon className="w-5 h-5 text-indigo-400" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
        {isLoading ? (
          <div className="h-4 w-32 bg-slate-800/60 animate-pulse rounded" />
        ) : (
          <span className="text-slate-400">{subtitle}</span>
        )}
        {badgeText && !isLoading && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
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
