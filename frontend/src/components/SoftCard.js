import React from 'react';

/**
 * SoftCard — image-5 inspired neumorphic card.
 * tint options: peach | rose | sage | lavender | cream | sky | sunset | dusk | white (default)
 * glow: 'orange' | 'lavender'
 */
export default function SoftCard({
  tint = 'white',
  glow,
  as: Tag = 'div',
  className = '',
  children,
  noHover = false,
  padding = 'p-6',
  ...rest
}) {
  const tintClass = tint === 'white' ? '' : `soft-card-tint-${tint}`;
  const glowClass = glow ? `soft-card-glow-${glow}` : '';
  const hoverClass = noHover ? 'no-hover' : '';
  return (
    <Tag
      className={`soft-card ${tintClass} ${glowClass} ${hoverClass} ${padding} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
