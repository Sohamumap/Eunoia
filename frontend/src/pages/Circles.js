import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Share2, Users, TrendingUp, Filter } from 'lucide-react';

const tagColors = {
  sleep: 'bg-eunoia-blue/10 text-eunoia-blue border-eunoia-blue/20',
  'shift-work': 'bg-lavender/10 text-lavender border-lavender/20',
  exhaustion: 'bg-rose/10 text-rose border-rose/20',
  transition: 'bg-accent/10 text-accent border-accent/20',
  imposter: 'bg-lavender/10 text-lavender border-lavender/20',
  overwhelm: 'bg-rose/10 text-rose border-rose/20',
  anxiety: 'bg-accent-light/10 text-accent border-accent/20',
  hidden: 'bg-mid/10 text-mid border-mid/20',
  'high-functioning': 'bg-eunoia-blue/10 text-eunoia-blue border-eunoia-blue/20',
  burnout: 'bg-charcoal/10 text-charcoal border-charcoal/20',
  coping: 'bg-sage/10 text-sage border-sage/20',
  solidarity: 'bg-eunoia-blue/10 text-eunoia-blue border-eunoia-blue/20',
};

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

function PostCard({ post, onLike, onNavigate }) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(post.id);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    // Future: implement share functionality
  };

  const avatarColor = getAvatarColor(post.display_name);
  const initial = (post.display_name || 'A')[0].toUpperCase();

  return (
    <div 
      onClick={() => onNavigate(post)}
      className="soft-card p-5 hover:-translate-y-[2px] hover:shadow-eunoia-hover transition-all duration-300 cursor-pointer group"
      data-testid={`post-${post.id}`}
    >
      {/* Header: Avatar + Name + Circle + Time */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex-shrink-0 w-11 h-11 rounded-full ${avatarColor} flex items-center justify-center shadow-sm`}>
          <span className="font-sans text-white text-base font-semibold">{initial}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-sans text-sm font-semibold text-charcoal">
              {post.display_name || 'Anonymous'}
            </span>
            {post.forum_name && (
              <>
                <span className="text-mid text-xs">in</span>
                <Link 
                  to={`/circles/${post.forum_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-sans text-sm font-medium text-accent hover:text-accent/80 no-underline"
                >
                  {post.forum_name}
                </Link>
              </>
            )}
            <span className="text-mid text-xs">&middot;</span>
            <span className="font-sans text-xs text-mid">{formatTimeAgo(post.created_at)}</span>
          </div>
          
          {/* Tags */}
          {post.forum_tags && post.forum_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {post.forum_tags.slice(0, 3).map(tag => (
                <span 
                  key={tag}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium border ${tagColors[tag] || 'bg-mid/10 text-mid border-mid/20'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post Body */}
      <div className="mb-4 ml-14">
        <p className="font-sans text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
          {post.body.length > 280 ? `${post.body.slice(0, 280)}...` : post.body}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-6 ml-14 pt-2 border-t border-eunoia-border/50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 font-sans text-xs font-medium transition-all ${
            isLiked 
              ? 'text-rose' 
              : 'text-mid hover:text-rose'
          }`}
        >
          <Heart 
            size={16} 
            className={`transition-all ${isLiked ? 'fill-rose' : ''}`}
          />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(post);
          }}
          className="flex items-center gap-1.5 text-mid hover:text-accent font-sans text-xs font-medium transition-colors"
        >
          <MessageCircle size={16} />
          {post.reply_count > 0 && <span>{post.reply_count}</span>}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-mid hover:text-sage font-sans text-xs font-medium transition-colors"
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Circles() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('feed'); // 'feed' or 'circles'

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await api('get', '/feed');
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Error fetching feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [api]);

  const handleLike = (postId) => {
    // Future: implement API call to save like
    console.log('Liked post:', postId);
  };

  const handleNavigateToPost = (post) => {
    if (post.forum_id) {
      navigate(`/circles/${post.forum_id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <p className="font-sans text-mid text-sm">Loading feed...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4" data-testid="circles-page">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mb-2">
                Circles
              </h1>
              <p className="font-sans text-mid text-sm sm:text-base">
                Your peer community feed
              </p>
            </div>
            
            <button
              onClick={() => setView(view === 'feed' ? 'circles' : 'feed')}
              className="soft-card px-4 py-2.5 flex items-center gap-2 hover:-translate-y-[1px] transition-all"
            >
              {view === 'feed' ? (
                <>
                  <Users size={16} className="text-mid" />
                  <span className="font-sans text-xs text-charcoal font-medium">Browse Circles</span>
                </>
              ) : (
                <>
                  <TrendingUp size={16} className="text-mid" />
                  <span className="font-sans text-xs text-charcoal font-medium">View Feed</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feed View */}
        {view === 'feed' && (
          <div className="space-y-4 animate-fade-up stagger-2">
            {posts.length === 0 ? (
              <div className="soft-card p-12 text-center">
                <p className="font-sans text-mid text-sm mb-4">
                  No posts yet in your circles
                </p>
                <button
                  onClick={() => setView('circles')}
                  className="px-5 py-2.5 rounded-full bg-charcoal text-white font-sans text-sm font-medium hover:-translate-y-[1px] transition-all"
                >
                  Explore Circles
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onNavigate={handleNavigateToPost}
                />
              ))
            )}
          </div>
        )}

        {/* Circles View (Original) */}
        {view === 'circles' && (
          <CirclesList onNavigate={(forumId) => navigate(`/circles/${forumId}`)} />
        )}

        {/* Footer Note */}
        <p className="mt-12 text-center font-sans text-xs text-mid leading-relaxed">
          All posts are moderated before publishing. No medication advice or diagnostic language allowed.
        </p>
      </div>
    </div>
  );
}

// Circles list component (original forum list view)
function CirclesList({ onNavigate }) {
  const { api } = useAuth();
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForums = async () => {
      try {
        const { data } = await api('get', '/forums');
        setForums(data.forums);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchForums();
  }, [api]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="font-sans text-mid text-sm">Loading circles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-up stagger-2">
      {forums.map((forum) => (
        <div
          key={forum.id}
          onClick={() => onNavigate(forum.id)}
          className="soft-card p-6 hover:-translate-y-[2px] hover:shadow-eunoia-hover transition-all duration-300 cursor-pointer"
          data-testid={`circle-${forum.id}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-serif text-xl font-semibold text-charcoal mb-2">
                {forum.name}
              </h3>
              <p className="font-sans text-sm text-mid leading-relaxed mb-3">
                {forum.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {forum.tags?.map(tag => (
                  <span
                    key={tag}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-sans font-medium border ${
                      tagColors[tag] || 'bg-mid/10 text-mid border-mid/20'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 font-sans text-xs text-mid">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {forum.seeded_members_count} members
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={12} /> {forum.post_count || 0} posts
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
