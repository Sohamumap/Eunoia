import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Eunoia Logo Component
 * - Uses animated GIF logo by default
 * - Supports Link wrapper or plain display via `to` prop
 */
export default function Logo({ 
  to, 
  className = '', 
  size = 'md',
}) {
  // Size presets
  const sizeMap = {
    xs: { height: '24px', width: 'auto' },
    sm: { height: '32px', width: 'auto' },
    md: { height: '40px', width: 'auto' },
    lg: { height: '56px', width: 'auto' },
    xl: { height: '72px', width: 'auto' },
  };
  
  const style = sizeMap[size] || sizeMap.md;
  
  const logoElement = (
    <img 
      src="/assets/logo/eunoia-logo.gif" 
      alt="Eunoia"
      style={{
        ...style,
        mixBlendMode: 'normal', // GIF should display normally
        filter: 'none'
      }}
      className={`object-contain ${className}`}
    />
  );
  
  // If `to` prop is provided, wrap in Link
  if (to) {
    return (
      <Link to={to} className="inline-flex items-center no-underline">
        {logoElement}
      </Link>
    );
  }
  
  return logoElement;
}
