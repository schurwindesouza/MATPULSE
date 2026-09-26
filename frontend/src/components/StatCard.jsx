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
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    brand: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all duration-150">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded my-1" />
          ) : (
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">{value}</h3>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
            <Icon className="w-5 h-5 text-blue-700" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        {isLoading ? (
          <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
        ) : (
          <span className="text-slate-500">{subtitle}</span>
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
