import React from 'react';

export default function GlassCard({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`glass-card ${hover ? 'glass-card-hover' : ''} rounded-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
