import React from 'react';

export function GlassInput({ className = '', ...props }) {
  return (
    <input
      className={`glass-input px-3.5 py-2 text-xs rounded-xl ${className}`}
      {...props}
    />
  );
}

export function GlassSelect({ children, className = '', ...props }) {
  return (
    <select
      className={`glass-input px-3.5 py-2 text-xs rounded-xl cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function GlassTextarea({ className = '', ...props }) {
  return (
    <textarea
      className={`glass-input px-3.5 py-2 text-xs rounded-xl ${className}`}
      {...props}
    />
  );
}
