import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CrisisModal from '@/components/CrisisModal';
import GlassCard from '@/components/GlassCard';
import IdentityEmblem from '@/components/IdentityEmblem';
import ResonanceButtons from '@/components/ResonanceButtons';
import { ArrowLeft, Send, Mic, Check, AlertTriangle, X } from 'lucide-react';

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const posted = new Date(dateString);
  const diffMs = now - posted;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function PostItem({ post, onResonate }) {
  const [resonances, setResonances] = useState(post.resonances || {});
  const [userResonance, setUserResonance] = useState(post.user_resonance || null);

  const handleResonate = async (postId, type) => {
    // Optimistic update
    setUserResonance(type);
    if (type) {
      setResonances(prev => ({
        ...prev,
        [type]: (prev[type] || 0) + (userResonance === type ? -1 : userResonance ? 0 : 1)
      }));
    }
    
    await onResonate(postId, type);
  };

  return (
    <GlassCard className="p-6 mb-4">
      {/* Post Header */}
      <div className="flex items-start gap-3 mb-4">
        <IdentityEmblem userId={post.user_id} size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-charcoal font-medium">{post.display_name || 'Anonymous'}</span>
            <span className="text-mid text-sm">·</span>
            <span className="text-mid text-sm">{formatTimeAgo(post.created_at)}</span>
          </div>
          {post.role && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-sage/20 text-sage border border-sage/30">
              {post.role}
            </span>
          )}
        </div>
      </div>

      {/* Post Body */}
      <p className="text-charcoal leading-relaxed mb-4 whitespace-pre-wrap">
        {post.body}
      </p>

      {/* Moderation Status */}
      {post.moderation_status === 'approved' && (
        <div className="flex items-center gap-2 text-xs text-sage mb-4">
          <Check size={14} />
          <span>This reflection has been reviewed for community safety</span>
        </div>
      )}

      {post.moderation_status === 'rewritten' && (
        <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 mb-4">
          This reflection was gently edited for community safety.
        </div>
      )}

      {/* Resonance Buttons */}
      <ResonanceButtons
        postId={post.id}
        resonances={{
          ...resonances,
          reply_count: post.replies?.length || 0
        }}
        userResonance={userResonance}
        onResonate={handleResonate}
      />

      {/* Replies */}
      {post.replies && post.replies.length > 0 && (
        <div className="mt-6 space-y-4 pl-6 border-l-2 border-charcoal/10">
          {post.replies.map(reply => (
            <div key={reply.id} className="flex items-start gap-3">
              <IdentityEmblem userId={reply.user_id} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-charcoal text-sm font-medium">
                    {reply.display_name || 'Anonymous'}
                  </span>
                  <span className="text-mid text-xs">·</span>
                  <span className="text-mid text-xs">
                    {formatTimeAgo(reply.created_at)}
                  </span>
                </div>
                <p className="text-charcoal text-sm leading-relaxed">
                  {reply.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
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

  // fetchForum depends on api and id only to avoid unnecessary refetches
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  const fetchForum = useCallback(async () => {
    try {
      const { data } = await api('get', `/forums/${id}`);
      setForum(data.forum);
      setPosts(data.posts);
    } catch (err) {
      console.error('Error fetching forum:', err);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => { fetchForum(); }, [fetchForum]);

  // checkModeration depends on api only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkModeration = useCallback(async (inputText) => {
    if (inputText.trim().length < 5) { setModResult(null); return; }
    try {
      const { data } = await api('post', '/moderation/check', { text: inputText });
      setModResult(data);
      if (data.status === 'paused_crisis') setShowCrisis(true);
    } catch (error) {
      console.error('Moderation check error:', error);
    }
  }, [api]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    clearTimeout(modTimeout.current);
    modTimeout.current = setTimeout(() => checkModeration(val), 600);
  };

  const handlePost = async () => {
    if (!text.trim() || modResult?.status === 'paused_crisis' || modResult?.status === 'blocked') return;
    setPosting(true);
    try {
      const { data } = await api('post', `/forums/${id}/posts`, { body: text, is_private: false });
      if (data.posted) {
        await fetchForum();
        setText('');
        setModResult(null);
      } else if (data.moderation?.status === 'paused_crisis') {
        setShowCrisis(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleResonate = async (postId, resonanceType) => {
    try {
      await api('post', '/resonate', { post_id: postId, resonance_type: resonanceType });
    } catch (err) {
      console.error('Error resonating:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <p className="text-mid">Loading...</p>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <p className="text-mid">Circle not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/circles" className="inline-flex items-center gap-2 text-mid hover:text-charcoal mb-4 transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm">Back to Circles</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif text-charcoal mb-2">{forum.name}</h1>
              {forum.tags && forum.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {forum.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs bg-warm-white/60 text-charcoal border border-charcoal/10">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-mid text-sm">
              {forum.member_count || 0} members
            </div>
          </div>
        </div>

        {/* Compose Box */}
        <GlassCard className="p-6 mb-8">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder={`Share a reflection in ${forum.name}...`}
            className="w-full h-32 bg-transparent text-charcoal placeholder-mid/60 resize-none focus:outline-none"
          />
          
          {modResult && modResult.status !== 'approved' && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-700 text-sm">{modResult.message || 'Please review your message'}</p>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <button className="p-2 hover:bg-warm-white/50 rounded-lg transition-colors">
              <Mic size={20} className="text-mid" />
            </button>
            <button
              onClick={handlePost}
              disabled={posting || !text.trim() || modResult?.status === 'blocked'}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-accent to-accent-light text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {posting ? 'Posting...' : 'Post anonymously'}
            </button>
          </div>
          <p className="text-xs text-mid mt-2 text-center">
            You appear as {user?.display_name}. Your identity is never revealed.
          </p>
        </GlassCard>

        {/* Posts */}
        <div>
          {posts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-mid">No posts yet. Be the first to share.</p>
            </div>
          )}
          {posts.map(post => (
            <PostItem key={post.id} post={post} onResonate={handleResonate} />
          ))}
        </div>
      </div>

      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}
    </div>
  );
}
