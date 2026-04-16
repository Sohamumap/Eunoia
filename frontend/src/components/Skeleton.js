import React from 'react';

export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

export function SkeletonCard({ height = 180, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ height, borderRadius: 22 }} />;
}

export default function Skeleton({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={`${80 + Math.random() * 20}%`} />
      ))}
    </div>
  );
}
