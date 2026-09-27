import React from 'react';
import logoImg from '../assets/matpulse-logo.png';

/**
 * MatpulseLogo
 * Reusable MATPULSE official brand logo.
 * Preserves proportions with object-fit: contain and transparent background.
 */
export default function MatpulseLogo({
  className = 'h-11 w-auto object-contain',
  style = {},
  alt = 'MATPULSE',
  ...props
}) {
  return (
    <img
      src={logoImg}
      alt={alt}
      className={`object-contain select-none ${className}`}
      style={{ objectFit: 'contain', ...style }}
      {...props}
    />
  );
}
