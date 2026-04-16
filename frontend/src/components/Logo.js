import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Eunoia Logo Component
 * - Uses animated MP4 video by default (looping)
 * - Falls back to static JPG if video fails to load or when `static` prop is true
 * - Supports Link wrapper or plain display via `to` prop
 */
export default function Logo({ 
  to, 
  className = '', 
  size = 'md',
  static: forceStatic = false 
}) {
  const [videoError, setVideoError] = useState(false);
  
  // Size presets
  const sizeMap = {
    xs: { height: '24px', width: 'auto' },
    sm: { height: '32px', width: 'auto' },
    md: { height: '40px', width: 'auto' },
    lg: { height: '56px', width: 'auto' },
    xl: { height: '72px', width: 'auto' },
  };
  
  const style = sizeMap[size] || sizeMap.md;
  
  // Use static JPG if forced or if video fails
  const useStatic = forceStatic || videoError;
  
  const logoElement = useStatic ? (
    <img 
      src="/assets/logo/eunoia-logo.jpg" 
      alt="Eunoia"
      style={style}
      className={`object-contain ${className}`}
    />
  ) : (
    <video
      autoPlay
      loop
      muted
      playsInline
      onError={() => setVideoError(true)}
      style={style}
      className={`object-contain ${className}`}
      aria-label="Eunoia"
    >
      <source src="/assets/logo/eunoia-logo.mp4" type="video/mp4" />
      {/* Fallback to static image */}
      <img 
        src="/assets/logo/eunoia-logo.jpg" 
        alt="Eunoia"
        style={style}
      />
    </video>
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
