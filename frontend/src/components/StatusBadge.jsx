import React from 'react';

const STATUS_CONFIGS = {
  // Matching status
  MATCHED: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Matched',
  },
  UNMATCHED: {
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
    label: 'Unmatched',
  },
  SUGGESTED: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Suggested',
  },
  // Workflow review status
  PENDING: {
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-400',
    label: 'Pending Review',
  },
  APPROVED: {
    bg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    dot: 'bg-teal-400',
    label: 'Approved',
  },
  REJECTED: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
    label: 'Rejected',
  },
  // Classification
  HIGH_CONFIDENCE_MATCH: {
    bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'High Confidence',
  },
  REVIEW_REQUIRED: {
    bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Review Required',
  },
  LOW_CONFIDENCE: {
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
    label: 'Low Confidence',
  },
};

export default function StatusBadge({ status, label: customLabel, size = 'sm' }) {
  const normKey = status?.toUpperCase?.() || 'UNMATCHED';
  const config = STATUS_CONFIGS[normKey] || STATUS_CONFIGS.UNMATCHED;
  const label = customLabel || config.label || status;

  const sizeClasses = size === 'xs'
    ? 'px-1.5 py-0.5 text-xs'
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
