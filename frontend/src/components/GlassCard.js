import React from 'react';

/**
 * Glassmorphic card component with frosted glass effect
 */
export default function GlassCard({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        backdrop-blur-xl bg-black/20
        border border-white/10 
        rounded-2xl 
        shadow-2xl
        ${hover ? 'hover:bg-black/30 hover:border-white/20 hover:shadow-3xl transition-all duration-300 cursor-pointer' : ''}
        ${className}
      `}
      style={{
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}
    >
      {children}
    </div>
  );
}
