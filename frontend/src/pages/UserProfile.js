import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import VoteButtons from '@/components/VoteButtons';
import { MessageSquare, Mail, Trophy, TrendingUp } from 'lucide-react';

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const posted = new Date(dateString);
  const diffMs = now - posted;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 30) return `${diffDays}d`;
  return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function UserProfile() {
  const { userId } = useParams();
  const { api } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('posts'); // 'posts' | 'comments'

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api('get', `/user/${userId}/profile`);
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [api, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <p className="font-sans text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <p className="font-sans text-gray-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white border border-gray-200 rounded-md mb-6">
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-white">
                  {profile.user.display_name[0].toUpperCase()}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="font-sans text-2xl font-bold text-gray-900 mb-1">
                  u/{profile.user.display_name}
                </h1>
                <p className="font-sans text-sm text-gray-600 mb-4">
                  Anonymous peer on Eunoia
                </p>

                {/* Karma Stats */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-orange-500" />
                    <div>
                      <div className="font-sans text-lg font-bold text-gray-900">
                        {profile.user.karma.total_karma.toLocaleString()}
                      </div>
                      <div className="font-sans text-xs text-gray-600">Karma</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" />
                    <div>
                      <div className="font-sans text-lg font-bold text-gray-900">
                        {profile.posts.length + profile.comments.length}
                      </div>
                      <div className="font-sans text-xs text-gray-600">Posts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Send Message Button */}
              <Link
                to={`/inbox/new?to=${userId}`}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-sans text-sm font-medium flex items-center gap-2 no-underline"
              >
                <Mail size={16} />
                Send Message
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200 flex">
            <button
              onClick={() => setTab('posts')}
              className={`px-6 py-3 font-sans text-sm font-medium border-b-2 transition-colors ${
                tab === 'posts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Posts ({profile.posts.length})
            </button>
            <button
              onClick={() => setTab('comments')}
              className={`px-6 py-3 font-sans text-sm font-medium border-b-2 transition-colors ${
                tab === 'comments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Comments ({profile.comments.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {tab === 'posts' && (
            <>
              {profile.posts.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-md p-12 text-center">
                  <p className="font-sans text-gray-600 text-sm">No posts yet</p>
                </div>
              ) : (
                profile.posts.map(post => (
                  <div key={post.id} className="flex gap-2 bg-white border border-gray-200 rounded-md">
                    <div className="flex-shrink-0 bg-gray-50 px-2 py-3 rounded-l-md">
                      <VoteButtons
                        voteCount={post.vote_count || 0}
                        userVote={post.user_vote}
                        onVote={() => {}}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 py-2 pr-4 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                        <Link
                          to={`/circles/${post.forum_id}`}
                          className="font-sans font-bold text-gray-900 hover:underline no-underline"
                        >
                          c/{post.forum_name || 'circle'}
                        </Link>
                        <span>•</span>
                        <span>{formatTimeAgo(post.created_at)}</span>
                      </div>
                      <Link
                        to={`/circles/${post.forum_id}`}
                        className="no-underline"
                      >
                        <p className="font-sans text-sm text-gray-900 leading-relaxed line-clamp-2 hover:underline">
                          {post.body}
                        </p>
                      </Link>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          {post.reply_count || 0} comments
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'comments' && (
            <>
              {profile.comments.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-md p-12 text-center">
                  <p className="font-sans text-gray-600 text-sm">No comments yet</p>
                </div>
              ) : (
                profile.comments.map(comment => (
                  <div key={comment.id} className="flex gap-2 bg-white border border-gray-200 rounded-md">
                    <div className="flex-shrink-0 bg-gray-50 px-2 py-3 rounded-l-md">
                      <VoteButtons
                        voteCount={comment.vote_count || 0}
                        userVote={comment.user_vote}
                        onVote={() => {}}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 py-2 pr-4 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                        <span>Comment</span>
                        <span>•</span>
                        <span>{formatTimeAgo(comment.created_at)}</span>
                      </div>
                      <p className="font-sans text-sm text-gray-900 leading-relaxed">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
