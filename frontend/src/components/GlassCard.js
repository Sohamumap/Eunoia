import React from 'react';

/**
 * Glassmorphic card component with frosted glass effect
 */
export default function GlassCard({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        backdrop-blur-xl bg-white/40
        border border-white/60 
        rounded-2xl 
        shadow-lg
        ${hover ? 'hover:bg-white/50 hover:border-white/80 hover:shadow-xl transition-all duration-300 cursor-pointer' : ''}
        ${className}
      `}
      style={{
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.08)'
      }}
    >
      {children}
    </div>
  );
}
