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
      color: 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
    },
    { 
      type: 'been_there', 
      emoji: '💛', 
      label: "I've been there",
      color: 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
    },
    { 
      type: 'not_alone', 
      emoji: '💜', 
      label: "You're not alone",
      color: 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
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
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
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
