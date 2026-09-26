import React from 'react';

const STATUS_CONFIGS = {
  // Matching status
  MATCHED: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    label: 'Matched',
  },
  UNMATCHED: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    label: 'Unmatched',
  },
  SUGGESTED: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
    label: 'Suggested',
  },
  REVIEWED: {
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
    label: 'Reviewed',
  },
  // Workflow review status
  PENDING: {
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
    label: 'Pending Review',
  },
  APPROVED: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    label: 'Approved',
  },
  REJECTED: {
    bg: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-600',
    label: 'Rejected',
  },
  // Classification
  HIGH_CONFIDENCE_MATCH: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    label: 'High Confidence',
  },
  REVIEW_REQUIRED: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
    label: 'Review Required',
  },
  LOW_CONFIDENCE: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    label: 'Low Confidence',
  },
  HARMONIZED: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    label: 'Harmonized',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
    label: 'In Progress',
  },
};

export default function StatusBadge({ status, label: customLabel, size = 'sm' }) {
  const normKey = status?.toUpperCase?.() || 'UNMATCHED';
  const config = STATUS_CONFIGS[normKey] || STATUS_CONFIGS.UNMATCHED;
  const label = customLabel || config.label || status;

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{label}</span>
    </span>
  );
}
