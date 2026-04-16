import React from 'react';

/**
 * Glassmorphic card component with frosted glass effect
 * Enhanced for Design Skill compliance
 */
export default function GlassCard({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        backdrop-blur-xl bg-white/45
        border border-white/70 
        rounded-3xl 
        shadow-lg
        relative overflow-hidden
        ${hover ? 'hover:bg-white/60 hover:border-white/90 hover:shadow-xl transition-all duration-400 cursor-pointer' : ''}
        ${className}
      `}
      style={{
        backdropFilter: 'blur(24px) saturate(190%)',
        WebkitBackdropFilter: 'blur(24px) saturate(190%)',
        boxShadow: '0 4px 24px 0 rgba(0, 0, 0, 0.1), 0 1px 0 0 rgba(255, 255, 255, 0.6) inset'
      }}
    >
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
