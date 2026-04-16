import React from 'react';

/**
 * Generative Identity Emblem - Unique concentric circles for each user
 * Creates a deterministic pattern based on user ID/name
 */
export default function IdentityEmblem({ userId, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  // Generate unique colors based on userId
  const generateColors = (id) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const palettes = [
      ['#FF9B71', '#B57EDC', '#7EC4CF', '#E57373', '#F8BBD0'], // warm
      ['#FFB74D', '#81C784', '#64B5F6', '#BA68C8', '#4DB6AC'], // vibrant
      ['#FF8A65', '#9575CD', '#4FC3F7', '#F06292', '#AED581'], // pastel
      ['#FFAB91', '#CE93D8', '#80DEEA', '#EF9A9A', '#C5E1A5'], // soft
      ['#FFCC80', '#B39DDB', '#90CAF9', '#F48FB1', '#DCEDC8'], // light
    ];
    
    const palette = palettes[hash % palettes.length];
    
    // Shuffle colors deterministically
    const seed = hash;
    const shuffled = [...palette].sort((a, b) => {
      const hashA = (a.charCodeAt(0) + seed) % 100;
      const hashB = (b.charCodeAt(0) + seed) % 100;
      return hashA - hashB;
    });
    
    return shuffled.slice(0, 4); // Use 4 rings
  };

  const colors = generateColors(userId || 'default');
  const rings = [
    { color: colors[0], size: '100%' },
    { color: colors[1], size: '75%' },
    { color: colors[2], size: '50%' },
    { color: colors[3], size: '25%' }
  ];

  return (
    <div 
      className={`relative ${sizes[size]} rounded-full flex items-center justify-center ${className}`}
      style={{ 
        background: colors[0],
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
    >
      {rings.map((ring, index) => (
        <div
          key={index}
          className="absolute rounded-full"
          style={{
            width: ring.size,
            height: ring.size,
            background: ring.color,
            border: index === 0 ? 'none' : '2px solid rgba(255,255,255,0.1)'
          }}
        />
      ))}
    </div>
  );
}
