import React from 'react';

export default function GlassPanel({ children, className = '', ...props }) {
  return (
    <div
      className={`glass-panel rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
