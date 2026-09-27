import React from 'react';

const STATUS_CONFIGS = {
  // Matching status
  MATCHED: {
    bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400 shadow-sm shadow-emerald-400/50',
    label: 'Matched',
  },
  UNMATCHED: {
    bg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dot: 'bg-slate-400',
    label: 'Unmatched',
  },
  SUGGESTED: {
    bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400 shadow-sm shadow-amber-400/50',
    label: 'Suggested',
  },
  REVIEWED: {
    bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400 shadow-sm shadow-blue-400/50',
    label: 'Reviewed',
  },
  // Workflow review status
  PENDING: {
    bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400 shadow-sm shadow-blue-400/50',
    label: 'Pending Review',
  },
  APPROVED: {
    bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400 shadow-sm shadow-emerald-400/50',
    label: 'Approved',
  },
  REJECTED: {
    bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400 shadow-sm shadow-rose-400/50',
    label: 'Rejected',
  },
  // Classification
  HIGH_CONFIDENCE_MATCH: {
    bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400 shadow-sm shadow-emerald-400/50',
    label: 'High Confidence',
  },
  REVIEW_REQUIRED: {
    bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400 shadow-sm shadow-amber-400/50',
    label: 'Review Required',
  },
  LOW_CONFIDENCE: {
    bg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dot: 'bg-slate-400',
    label: 'Low Confidence',
  },
  HARMONIZED: {
    bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400 shadow-sm shadow-emerald-400/50',
    label: 'Harmonized',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400 shadow-sm shadow-amber-400/50',
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
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm ${config.bg} ${sizeClasses} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{label}</span>
    </span>
  );
}
