import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import VoteButtons from '@/components/VoteButtons';
import SortTabs from '@/components/SortTabs';
import { MessageSquare, Share2, Users, Info } from 'lucide-react';

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

function PostCard({ post, onVote }) {
  const navigate = useNavigate();

  const handleVote = (voteType) => {
    onVote(post.id, voteType);
  };

  const handleCardClick = () => {
    if (post.forum_id) {
      navigate(`/circles/${post.forum_id}`);
    }
  };

  return (
    <div 
      className="flex gap-2 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Vote Section */}
      <div className="flex-shrink-0 bg-gray-50 px-2 py-3 rounded-l-md">
        <VoteButtons
          voteCount={post.vote_count || 0}
          userVote={post.user_vote}
          onVote={handleVote}
          size="md"
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 py-2 pr-4 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1.5">
          <Link
            to={`/circles/${post.forum_id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-sans font-bold text-gray-900 hover:underline no-underline"
          >
            c/{post.forum_name || 'circle'}
          </Link>
          <span>•</span>
          <span>Posted by</span>
          <Link
            to={`/user/${post.user_id}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline text-gray-600 no-underline"
          >
            u/{post.display_name || 'Anonymous'}
          </Link>
          <span>•</span>
          <span>{formatTimeAgo(post.created_at)}</span>
        </div>

        {/* Tags */}
        {post.forum_tags && post.forum_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.forum_tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-sans font-medium bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Post Body */}
        <div className="mb-2">
          <p className="font-sans text-sm text-gray-900 leading-relaxed line-clamp-3">
            {post.body}
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 font-sans text-xs font-medium transition-colors"
          >
            <MessageSquare size={16} />
            <span>{post.reply_count || 0} {post.reply_count === 1 ? 'comment' : 'comments'}</span>
          </button>

          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 font-sans text-xs font-medium transition-colors"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AboutSidebar({ circles }) {
  return (
    <div className="space-y-4">
      {/* About */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-gray-700" />
          <h3 className="font-sans text-sm font-bold text-gray-900">About Circles</h3>
        </div>
        <p className="font-sans text-xs text-gray-600 leading-relaxed mb-3">
          Anonymous peer communities moderated for safety, designed for solidarity. Share experiences, find support, and connect with others who understand.
        </p>
        <div className="pt-3 border-t border-gray-200 text-xs text-gray-500 font-sans">
          <p>All posts are moderated before publishing.</p>
          <p className="mt-1">No medication advice or diagnostic language allowed.</p>
        </div>
      </div>

      {/* Popular Circles */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="font-sans text-sm font-bold text-gray-900 mb-3">Popular Circles</h3>
        <div className="space-y-2">
          {circles.slice(0, 5).map((circle) => (
            <Link
              key={circle.id}
              to={`/circles/${circle.id}`}
              className="flex items-center justify-between py-2 hover:bg-gray-50 px-2 -mx-2 rounded no-underline group"
            >
              <div className="flex-1 min-w-0">
                <div className="font-sans text-xs font-medium text-gray-900 group-hover:text-blue-600 truncate">
                  c/{circle.name}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {circle.member_count || circle.seeded_members_count || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Circles() {
  const { api } = useAuth();
  const [posts, setPosts] = useState([]);
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('hot');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch feed
        const { data: feedData } = await api('get', `/feed?sort=${sort}`);
        setPosts(feedData.posts || []);

        // Fetch circles list
        const { data: circlesData } = await api('get', '/forums');
        setCircles(circlesData.forums || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, sort]);

  const handleVote = async (postId, voteType) => {
    try {
      const { data } = await api('post', '/vote', { post_id: postId, vote_type: voteType });
      
      // Update post in state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, vote_count: data.vote_count, user_vote: data.vote_type }
            : post
        )
      );
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <p className="font-sans text-gray-600 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16" data-testid="circles-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-sans text-2xl font-bold text-gray-900 mb-2">Circles</h1>
          <p className="font-sans text-sm text-gray-600">Your peer community feed</p>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Sort Tabs */}
            <div className="mb-4">
              <SortTabs activeSort={sort} onSortChange={setSort} />
            </div>

            {/* Posts Feed */}
            {posts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-md p-12 text-center">
                <p className="font-sans text-gray-600 text-sm mb-4">
                  No posts yet in your circles
                </p>
                <Link
                  to="/circles"
                  className="inline-block px-5 py-2.5 rounded-full bg-blue-600 text-white font-sans text-sm font-medium hover:bg-blue-700 transition-colors no-underline"
                >
                  Explore Circles
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onVote={handleVote} />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <AboutSidebar circles={circles} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
