import React from 'react';

export default function GlassButton({
  children,
  variant = 'primary',
  className = '',
  size = 'md',
  ...props
}) {
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-[11px]',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs font-semibold',
    lg: 'px-6 py-3 text-sm font-semibold',
  };

  const variantClasses = {
    primary: 'glass-btn-primary rounded-xl shadow-lg shadow-blue-500/10',
    secondary: 'glass-btn-secondary rounded-xl',
    danger: 'bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-200 rounded-xl transition',
    success: 'bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 rounded-xl transition',
    ghost: 'bg-transparent hover:bg-white/[0.08] text-white/80 hover:text-white rounded-xl transition',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
