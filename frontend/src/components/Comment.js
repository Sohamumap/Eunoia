import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import VoteButtons from '@/components/VoteButtons';
import { MessageSquare, Share2 } from 'lucide-react';

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const posted = new Date(dateString);
  const diffMs = now - posted;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 30) return `${diffDays}d`;
  return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Single comment without recursion
function CommentItem({ comment, onVote, onReply, depth = 0 }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleVote = (voteType) => {
    onVote(comment.id, voteType);
  };

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText('');
      setShowReplyBox(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex gap-2 py-2">
        <div className="flex-shrink-0">
          <VoteButtons
            voteCount={comment.vote_count || 0}
            userVote={comment.user_vote}
            onVote={handleVote}
            size="sm"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
            <Link
              to={`/user/${comment.user_id}`}
              className="font-sans font-medium text-gray-900 hover:underline no-underline"
            >
              u/{comment.display_name || 'Anonymous'}
            </Link>
            <span>•</span>
            <span>{formatTimeAgo(comment.created_at)}</span>
            {depth > 0 && (
              <>
                <span>•</span>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-blue-600 hover:underline"
                >
                  [{isCollapsed ? '+' : '−'}]
                </button>
              </>
            )}
          </div>

          {!isCollapsed && (
            <>
              <div className="mb-2">
                <p className="font-sans text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {comment.body}
                </p>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setShowReplyBox(!showReplyBox)}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-sans font-medium"
                >
                  <MessageSquare size={12} />
                  <span>Reply</span>
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-sans font-medium">
                  <Share2 size={12} />
                  <span>Share</span>
                </button>
              </div>

              {showReplyBox && (
                <div className="mb-3 bg-gray-50 rounded p-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="What are your thoughts?"
                    className="w-full h-20 p-2 rounded border border-gray-300 bg-white font-sans text-xs text-gray-900 resize-none focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => { setShowReplyBox(false); setReplyText(''); }}
                      className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-200 rounded font-sans font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReplySubmit}
                      disabled={!replyText.trim()}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded font-sans font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Thread component renders comments iteratively
export default function CommentThread({ comments, onVote, onReply }) {
  // Flatten nested comments into a list with depth info
  const flattenComments = (comments, depth = 0) => {
    let result = [];
    comments.forEach(comment => {
      result.push({ ...comment, depth });
      if (comment.replies && comment.replies.length > 0) {
        result = result.concat(flattenComments(comment.replies, depth + 1));
      }
    });
    return result;
  };

  const flatComments = flattenComments(comments);

  return (
    <div>
      {flatComments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onVote={onVote}
          onReply={onReply}
          depth={comment.depth}
        />
      ))}
    </div>
  );
}
