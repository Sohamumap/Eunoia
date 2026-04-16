import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * Resonance reaction buttons - empathetic alternatives to upvotes
 */
export default function ResonanceButtons({ postId, resonances = {}, userResonance, onResonate }) {
  const reactions = [
    { 
      type: 'feel_this', 
      emoji: '🔥', 
      label: 'I feel this',
      color: 'bg-accent/20 text-accent hover:bg-accent/30'
    },
    { 
      type: 'been_there', 
      emoji: '💛', 
      label: "I've been there",
      color: 'bg-amber-500/20 text-amber-700 hover:bg-amber-500/30'
    },
    { 
      type: 'not_alone', 
      emoji: '💜', 
      label: "You're not alone",
      color: 'bg-lavender/20 text-lavender hover:bg-lavender/30'
    }
  ];

  const handleReact = (type) => {
    // Toggle if same type, otherwise switch
    const newType = userResonance === type ? null : type;
    onResonate?.(postId, newType);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {reactions.map(reaction => {
        const count = resonances[reaction.type] || 0;
        const isActive = userResonance === reaction.type;
        
        return (
          <button
            key={reaction.type}
            onClick={() => handleReact(reaction.type)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              transition-all duration-200
              ${isActive 
                ? reaction.color.replace('hover:', '')
                : 'bg-warm-white/50 text-mid hover:bg-warm-white/70'
              }
            `}
          >
            <span className="text-sm">{reaction.emoji}</span>
            <span>{reaction.label}</span>
            {count > 0 && (
              <>
                <span className="text-gray-500">·</span>
                <span className={isActive ? 'font-bold' : ''}>{count}</span>
              </>
            )}
          </button>
        );
      })}
      
      {/* Reply button */}
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-warm-white/50 text-mid hover:bg-warm-white/70 transition-all"
      >
        <MessageCircle size={14} />
        <span>Reply</span>
        {resonances.reply_count > 0 && (
          <>
            <span className="text-gray-500">·</span>
            <span>{resonances.reply_count}</span>
          </>
        )}
      </button>
    </div>
  );
}
