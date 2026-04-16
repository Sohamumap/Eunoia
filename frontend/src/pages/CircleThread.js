import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CrisisModal from '@/components/CrisisModal';
import CommentThread from '@/components/Comment';
import SortTabs from '@/components/SortTabs';
import { ArrowLeft, Send, AlertTriangle, Check, X, Users } from 'lucide-react';

function AboutCircleSidebar({ forum, isJoined, onJoinToggle }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-4 py-3">
        <h3 className="font-sans text-sm font-bold text-white">About Community</h3>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-sans text-sm font-bold text-gray-900 mb-2">
          c/{forum.name}
        </h4>
        <p className="font-sans text-xs text-gray-700 leading-relaxed mb-4">
          {forum.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
          <div>
            <div className="font-sans text-sm font-bold text-gray-900">
              {forum.member_count || 0}
            </div>
            <div className="font-sans text-xs text-gray-600">Members</div>
          </div>
          <div>
            <div className="font-sans text-sm font-bold text-gray-900">
              {forum.post_count || 0}
            </div>
            <div className="font-sans text-xs text-gray-600">Posts</div>
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={onJoinToggle}
          className={`w-full py-2 rounded-full font-sans text-sm font-bold transition-colors ${
            isJoined
              ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isJoined ? 'Joined' : 'Join'}
        </button>

        {/* Rules */}
        {forum.tags && forum.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="font-sans text-xs font-bold text-gray-900 mb-2">Topics</div>
            <div className="flex flex-wrap gap-1.5">
              {forum.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 text-[10px] font-sans font-medium bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="font-sans text-[10px] text-gray-500 leading-relaxed">
            All posts are moderated before publishing. No medication advice or diagnostic language allowed.
          </p>
        </div>
      </div>
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
  const [sort, setSort] = useState('hot');
  const [isJoined, setIsJoined] = useState(false);
  const modTimeout = useRef(null);

  const fetchForum = useCallback(async () => {
    try {
      const { data } = await api('get', `/forums/${id}?sort=${sort}`);
      setForum(data.forum);
      setPosts(data.posts);
      setIsJoined(data.is_joined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api, id, sort]);

  useEffect(() => { fetchForum(); }, [fetchForum]);

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
        await fetchForum();
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

  const handleVote = async (postId, voteType) => {
    try {
      const { data } = await api('post', '/vote', { post_id: postId, vote_type: voteType });
      
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return { ...post, vote_count: data.vote_count, user_vote: data.vote_type };
          }
          // Update nested replies
          if (post.replies) {
            return {
              ...post,
              replies: post.replies.map(reply =>
                reply.id === postId
                  ? { ...reply, vote_count: data.vote_count, user_vote: data.vote_type }
                  : reply
              )
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Error voting:', err);
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

  const handleJoinToggle = async () => {
    try {
      if (isJoined) {
        await api('post', `/forums/${id}/leave`);
        setIsJoined(false);
      } else {
        await api('post', `/forums/${id}/join`);
        setIsJoined(true);
      }
    } catch (err) {
      console.error('Error toggling join:', err);
    }
  };

  const renderHighlightedText = () => {
    if (!modResult?.highlights?.length) return null;
    let result = [];
    let lastIdx = 0;
    const sorted = [...modResult.highlights].sort((a, b) => a.start - b.start);
    sorted.forEach((h, i) => {
      if (h.start > lastIdx) result.push(<span key={`t-${i}`}>{text.slice(lastIdx, h.start)}</span>);
      const color = h.type === 'crisis' ? 'bg-red-100 text-red-700' : h.type === 'medication' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700';
      result.push(<mark key={`h-${i}`} className={`${color} rounded px-0.5`}>{text.slice(h.start, h.end)}</mark>);
      lastIdx = h.end;
    });
    if (lastIdx < text.length) result.push(<span key="end">{text.slice(lastIdx)}</span>);
    return <div className="font-sans text-sm p-3 rounded border border-gray-300 bg-gray-50 whitespace-pre-wrap leading-relaxed">{result}</div>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <p className="font-sans text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <p className="font-sans text-gray-600">Circle not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16" data-testid="circle-thread-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/circles"
            className="inline-flex items-center gap-1.5 text-gray-600 font-sans text-sm hover:text-gray-900 mb-3 no-underline"
          >
            <ArrowLeft size={15} /> Back to Feed
          </Link>
          <h1 className="font-sans text-2xl font-bold text-gray-900 mb-1">c/{forum.name}</h1>
          <p className="font-sans text-sm text-gray-600">{forum.description}</p>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Compose Post */}
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="What are your thoughts?"
                data-testid="compose-textarea"
                className="w-full h-24 p-3 rounded border border-gray-300 bg-white font-sans text-sm text-gray-900 resize-none focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
              />

              {/* Moderation Preview */}
              {modResult && modResult.status !== 'approved' && (
                <div className="mt-3" data-testid="moderation-preview">
                  {modResult.highlights?.length > 0 && renderHighlightedText()}

                  {modResult.status === 'paused_crisis' && (
                    <div className="mt-3 p-3 rounded bg-red-50 border border-red-200">
                      <p className="font-sans text-sm text-red-700 font-medium flex items-center gap-1.5 mb-2">
                        <AlertTriangle size={15} /> We are concerned about what you have written.
                      </p>
                      <p className="font-sans text-xs text-gray-700 leading-relaxed mb-2">
                        It sounds like you may be going through something serious. This post cannot be shared, but we want to make sure you are safe.
                      </p>
                      <button
                        onClick={() => setShowCrisis(true)}
                        data-testid="crisis-trigger-btn"
                        className="px-4 py-2 rounded-full bg-red-600 text-white font-sans text-xs font-medium hover:bg-red-700"
                      >
                        Get Help Now
                      </button>
                    </div>
                  )}

                  {modResult.status === 'needs_rewrite' && modResult.suggestion && (
                    <div className="mt-3 p-3 rounded bg-orange-50 border border-orange-200">
                      <p className="font-sans text-xs text-orange-700 font-medium mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={13} /> This sounds like a medication suggestion
                      </p>
                      <p className="font-sans text-xs text-gray-600 mb-2">
                        We cannot share medication advice for everyone&apos;s safety. Would you like to post a first-person version?
                      </p>
                      <p className="font-sans text-sm italic text-gray-900 mb-2">&ldquo;{modResult.suggestion}&rdquo;</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUseSuggestion}
                          data-testid="use-suggestion-btn"
                          className="px-3 py-1.5 rounded-full bg-orange-600 text-white font-sans text-xs font-medium flex items-center gap-1"
                        >
                          <Check size={12} /> Use this
                        </button>
                        <button
                          onClick={() => setModResult(null)}
                          className="px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 font-sans text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {modResult.status === 'blocked' && (
                    <div className="mt-3 p-3 rounded bg-red-50 border border-red-200">
                      <p className="font-sans text-xs text-red-700 font-medium flex items-center gap-1.5">
                        <X size={13} /> This contains diagnostic language
                      </p>
                      <p className="font-sans text-xs text-gray-600 mt-1">
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
                  className="px-5 py-2 rounded-full bg-blue-600 text-white font-sans text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Send size={14} /> Post
                </button>
              </div>
            </div>

            {/* Sort Tabs */}
            <div>
              <SortTabs activeSort={sort} onSortChange={setSort} />
            </div>

            {/* Posts/Comments */}
            <div className="space-y-4">
              {posts.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-md p-12 text-center">
                  <p className="font-sans text-gray-600 text-sm">
                    No posts yet. Be the first to share.
                  </p>
                </div>
              )}
              {posts.map((post) => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-md p-4">
                  <CommentThread
                    comments={[post]}
                    onVote={handleVote}
                    onReply={handleReply}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <AboutCircleSidebar
                forum={forum}
                isJoined={isJoined}
                onJoinToggle={handleJoinToggle}
              />
            </div>
          </div>
        </div>
      </div>

      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}
    </div>
  );
}
