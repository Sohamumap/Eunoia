import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CrisisModal from '@/components/CrisisModal';
import { ArrowLeft, Send, AlertTriangle, Check, X, MessageSquare, Heart, Share2 } from 'lucide-react';

// Generate avatar color based on name
const getAvatarColor = (name) => {
  const colors = [
    'bg-gradient-to-br from-rose to-lavender',
    'bg-gradient-to-br from-eunoia-blue to-accent',
    'bg-gradient-to-br from-sage to-eunoia-blue',
    'bg-gradient-to-br from-lavender to-rose',
    'bg-gradient-to-br from-accent to-sage',
  ];
  const index = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[index];
};

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const posted = new Date(dateString);
  const diffMs = now - posted;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function PostCard({ post, onReply, onLike }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  const avatarColor = getAvatarColor(post.display_name);
  const initial = (post.display_name || 'A')[0].toUpperCase();

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(post.id);
  };

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(post.id, replyText);
      setReplyText('');
      setShowReplyBox(false);
    }
  };

  return (
    <div className="soft-card p-5" data-testid={`post-${post.id}`}>
      {/* Post Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center shadow-sm`}>
          <span className="font-sans text-white text-base font-semibold">{initial}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-sans text-sm font-semibold text-charcoal">
              {post.display_name || 'Anonymous'}
            </span>
            <span className="text-mid text-xs">&middot;</span>
            <span className="font-sans text-xs text-mid">{formatTimeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Post Body */}
      <div className="mb-4 ml-15">
        <p className="font-sans text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
          {post.body}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-6 ml-15 pt-3 border-t border-eunoia-border/50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 font-sans text-xs font-medium transition-all ${
            isLiked ? 'text-rose' : 'text-mid hover:text-rose'
          }`}
        >
          <Heart size={16} className={`transition-all ${isLiked ? 'fill-rose' : ''}`} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <button
          onClick={() => setShowReplyBox(!showReplyBox)}
          className="flex items-center gap-1.5 text-mid hover:text-accent font-sans text-xs font-medium transition-colors"
        >
          <MessageSquare size={16} />
          <span>{post.replies?.length || 0}</span>
        </button>

        <button className="flex items-center gap-1.5 text-mid hover:text-sage font-sans text-xs font-medium transition-colors">
          <Share2 size={16} />
        </button>
      </div>

      {/* Replies */}
      {post.replies && post.replies.length > 0 && (
        <div className="mt-4 ml-15 pl-4 border-l-2 border-eunoia-border/30 space-y-3">
          {post.replies.map(reply => {
            const replyAvatarColor = getAvatarColor(reply.display_name);
            const replyInitial = (reply.display_name || 'A')[0].toUpperCase();
            
            return (
              <div key={reply.id} className="py-2">
                <div className="flex items-start gap-2 mb-2">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${replyAvatarColor} flex items-center justify-center`}>
                    <span className="font-sans text-white text-xs font-semibold">{replyInitial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-sans text-xs font-semibold text-charcoal">
                        {reply.display_name || 'Anonymous'}
                      </span>
                      <span className="font-sans text-[10px] text-mid">
                        {formatTimeAgo(reply.created_at)}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-charcoal leading-relaxed">
                      {reply.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Box */}
      {showReplyBox && (
        <div className="mt-4 ml-15 pl-4 border-l-2 border-accent/30 animate-fade-up">
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Write a thoughtful reply..."
            className="w-full h-20 p-3 rounded-xl border border-eunoia-border bg-warm-white font-sans text-xs text-charcoal resize-none focus:outline-none focus:border-accent placeholder:text-mid/50"
            data-testid={`reply-textarea-${post.id}`}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button 
              onClick={() => { setShowReplyBox(false); setReplyText(''); }}
              className="px-4 py-2 rounded-full text-mid font-sans text-xs hover:bg-warm-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleReplySubmit}
              className="px-4 py-2 rounded-full bg-charcoal text-white font-sans text-xs font-medium hover:-translate-y-[1px] transition-all disabled:opacity-40"
              disabled={!replyText.trim()}
              data-testid={`submit-reply-${post.id}`}
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CircleThread() {
  const { id } = useParams();
  const { api, user } = useAuth();
  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [modResult, setModResult] = useState(null);
  const [posting, setPosting] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const modTimeout = useRef(null);

  const fetchForum = useCallback(async () => {
    try {
      const { data } = await api('get', `/forums/${id}`);
      setForum(data.forum);
      setPosts(data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => { fetchForum(); }, [fetchForum]);

  // Live moderation preview
  const checkModeration = useCallback(async (inputText) => {
    if (inputText.trim().length < 5) { setModResult(null); return; }
    try {
      const { data } = await api('post', '/moderation/check', { text: inputText });
      setModResult(data);
      if (data.status === 'paused_crisis') setShowCrisis(true);
    } catch {}
  }, [api]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    clearTimeout(modTimeout.current);
    modTimeout.current = setTimeout(() => checkModeration(val), 600);
  };

  const handlePost = async () => {
    if (!text.trim()) return;
    if (modResult?.status === 'paused_crisis') {
      setShowCrisis(true);
      return;
    }
    setPosting(true);
    try {
      const { data } = await api('post', `/forums/${id}/posts`, { body: text, is_private: false });
      if (data.posted) {
        setPosts(prev => [data.post, ...prev]);
        setText('');
        setModResult(null);
      } else if (data.moderation?.status === 'paused_crisis' || data.crisis_blocked) {
        setShowCrisis(true);
        setText('');
        setModResult(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleUseSuggestion = () => {
    if (modResult?.suggestion) {
      setText(modResult.suggestion);
      setModResult(null);
    }
  };

  const handleReply = async (postId, replyText) => {
    try {
      const { data } = await api('post', `/forums/${id}/posts`, { 
        body: replyText, 
        is_private: false, 
        parent_id: postId 
      });
      if (data.posted) {
        await fetchForum();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = (postId) => {
    // Future: implement API call to save like
    console.log('Liked post:', postId);
  };

  // Highlight moderation issues in text
  const renderHighlightedText = () => {
    if (!modResult?.highlights?.length) return null;
    let result = [];
    let lastIdx = 0;
    const sorted = [...modResult.highlights].sort((a, b) => a.start - b.start);
    sorted.forEach((h, i) => {
      if (h.start > lastIdx) result.push(<span key={`t-${i}`}>{text.slice(lastIdx, h.start)}</span>);
      const color = h.type === 'crisis' ? 'bg-rose/20 text-rose' : h.type === 'medication' ? 'bg-rose/15 text-rose' : 'bg-accent-light/20 text-accent';
      result.push(<mark key={`h-${i}`} className={`${color} rounded px-0.5`}>{text.slice(h.start, h.end)}</mark>);
      lastIdx = h.end;
    });
    if (lastIdx < text.length) result.push(<span key="end">{text.slice(lastIdx)}</span>);
    return <div className="font-sans text-sm p-4 rounded-xl bg-warm-white border border-eunoia-border whitespace-pre-wrap leading-relaxed">{result}</div>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <p className="font-sans text-mid">Loading...</p>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <p className="font-sans text-mid">Circle not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4" data-testid="circle-thread-page">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <Link 
            to="/circles" 
            className="inline-flex items-center gap-1.5 text-mid font-sans text-sm hover:text-charcoal mb-4 no-underline transition-colors"
          >
            <ArrowLeft size={15} /> Back to Feed
          </Link>
          <h1 className="font-serif text-3xl font-bold text-charcoal mb-2">
            {forum.name}
          </h1>
          <p className="font-sans text-sm text-mid">{forum.description}</p>
        </div>

        {/* Compose */}
        <div className="soft-card p-6 mb-8 animate-fade-up stagger-2" data-testid="compose-box">
          <div className="flex gap-3 mb-3">
            <div className={`flex-shrink-0 w-11 h-11 rounded-full ${getAvatarColor(user?.display_name)} flex items-center justify-center shadow-sm`}>
              <span className="font-sans text-white text-base font-semibold">
                {(user?.display_name || 'A')[0].toUpperCase()}
              </span>
            </div>
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Share what's on your mind..."
              data-testid="compose-textarea"
              className="flex-1 h-24 p-4 rounded-xl border border-eunoia-border bg-warm-white font-sans text-sm text-charcoal resize-none focus:outline-none focus:border-accent placeholder:text-mid/50"
            />
          </div>

          {/* Moderation preview */}
          {modResult && modResult.status !== 'approved' && (
            <div className="mt-3 animate-fade-up" data-testid="moderation-preview">
              {modResult.highlights?.length > 0 && renderHighlightedText()}

              {modResult.status === 'paused_crisis' && (
                <div className="mt-3 p-4 rounded-xl bg-rose/10 border-2 border-rose/30">
                  <p className="font-sans text-sm text-rose font-medium flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={15} /> We are concerned about what you have written.
                  </p>
                  <p className="font-sans text-xs text-charcoal leading-relaxed mb-3">
                    It sounds like you may be going through something serious. This post cannot be shared, but we want to make sure you are safe. Please reach out to someone who can help.
                  </p>
                  <button
                    onClick={() => setShowCrisis(true)}
                    data-testid="crisis-trigger-btn"
                    className="px-5 py-2.5 rounded-full bg-rose text-white font-sans text-sm font-medium hover:-translate-y-[1px] transition-all"
                  >
                    Get Help Now
                  </button>
                </div>
              )}

              {modResult.status === 'needs_rewrite' && modResult.suggestion && (
                <div className="mt-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <p className="font-sans text-xs text-accent font-medium mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> This sounds like a medication suggestion
                  </p>
                  <p className="font-sans text-xs text-mid mb-3">
                    We cannot share medication advice for everyone&apos;s safety. Would you like to post a first-person version?
                  </p>
                  <p className="font-serif text-sm italic text-charcoal mb-3">&ldquo;{modResult.suggestion}&rdquo;</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleUseSuggestion} 
                      data-testid="use-suggestion-btn" 
                      className="px-4 py-2 rounded-full bg-accent text-white font-sans text-xs font-medium flex items-center gap-1 hover:-translate-y-[1px] transition-all"
                    >
                      <Check size={12} /> Use this
                    </button>
                    <button 
                      onClick={() => setModResult(null)} 
                      className="px-4 py-2 rounded-full border border-eunoia-border text-mid font-sans text-xs hover:bg-warm-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modResult.status === 'blocked' && (
                <div className="mt-3 p-4 rounded-xl bg-rose/5 border border-rose/20">
                  <p className="font-sans text-xs text-rose font-medium flex items-center gap-1.5">
                    <X size={13} /> This contains diagnostic language
                  </p>
                  <p className="font-sans text-xs text-mid mt-1">
                    On Eunoia, we avoid telling others what they have. Consider rephrasing as your personal experience.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end mt-3">
            <button
              onClick={handlePost}
              disabled={posting || !text.trim() || modResult?.status === 'blocked'}
              data-testid="post-btn"
              className="px-6 py-2.5 rounded-full bg-charcoal text-white font-sans text-sm font-medium hover:-translate-y-[1px] transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <Send size={14} /> Post
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 && (
            <div className="soft-card p-12 text-center">
              <p className="font-sans text-mid text-sm">
                No posts yet. Be the first to share.
              </p>
            </div>
          )}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReply={handleReply}
              onLike={handleLike}
            />
          ))}
        </div>
      </div>

      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}
    </div>
  );
}
