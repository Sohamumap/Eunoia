import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Reddit-style voting buttons (upvote/downvote arrows)
 */
export default function VoteButtons({ voteCount = 0, userVote = null, onVote, size = 'md' }) {
  const sizeClasses = {
    sm: {
      arrow: 14,
      text: 'text-xs',
      gap: 'gap-0.5',
      padding: 'p-1'
    },
    md: {
      arrow: 18,
      text: 'text-sm',
      gap: 'gap-1',
      padding: 'p-1.5'
    }
  };

  const config = sizeClasses[size];

  const handleUpvote = (e) => {
    e.stopPropagation();
    onVote?.(userVote === 'upvote' ? 'unvote' : 'upvote');
  };

  const handleDownvote = (e) => {
    e.stopPropagation();
    onVote?.(userVote === 'downvote' ? 'unvote' : 'downvote');
  };

  // Format vote count (1000+ = 1k, 1000000+ = 1M)
  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div className={`flex flex-col items-center ${config.gap}`}>
      {/* Upvote */}
      <button
        onClick={handleUpvote}
        className={`${config.padding} rounded hover:bg-orange-100 transition-colors ${
          userVote === 'upvote' ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
        }`}
        aria-label="Upvote"
      >
        <ArrowUp 
          size={config.arrow} 
          className={userVote === 'upvote' ? 'fill-orange-500' : ''} 
        />
      </button>

      {/* Vote Count */}
      <span className={`font-sans font-bold ${config.text} ${
        userVote === 'upvote' ? 'text-orange-500' : 
        userVote === 'downvote' ? 'text-blue-600' : 
        'text-gray-700'
      }`}>
        {formatCount(voteCount)}
      </span>

      {/* Downvote */}
      <button
        onClick={handleDownvote}
        className={`${config.padding} rounded hover:bg-blue-100 transition-colors ${
          userVote === 'downvote' ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
        }`}
        aria-label="Downvote"
      >
        <ArrowDown 
          size={config.arrow} 
          className={userVote === 'downvote' ? 'fill-blue-600' : ''} 
        />
      </button>
    </div>
  );
}
