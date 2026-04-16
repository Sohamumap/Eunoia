import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CrisisModal from '@/components/CrisisModal';
import { ArrowLeft, Send, AlertTriangle, Check, X, MessageSquare } from 'lucide-react';

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
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
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
    // Client-side crisis check before even sending
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

  const handleReply = async (postId) => {
    if (!replyText.trim()) return;
    try {
      const { data } = await api('post', `/forums/${id}/posts`, { body: replyText, is_private: false, parent_id: postId });
      if (data.posted) {
        await fetchForum();
        setReplyTo(null);
        setReplyText('');
      }
    } catch {}
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

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-16"><p className="font-sans text-mid">Loading...</p></div>;
  if (!forum) return <div className="min-h-screen flex items-center justify-center pt-16"><p className="font-sans text-mid">Circle not found</p></div>;

  return (
    <div className="min-h-screen pt-20 pb-16 px-4" data-testid="circle-thread-page">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <Link to="/circles" className="inline-flex items-center gap-1.5 text-mid font-sans text-sm hover:text-charcoal mb-4 no-underline">
            <ArrowLeft size={15} /> All Circles
          </Link>
          <h1 className="font-serif text-3xl font-bold text-charcoal mb-2">{forum.name}</h1>
          <p className="font-sans text-sm text-mid">{forum.description}</p>
        </div>

        {/* Compose */}
        <div className="soft-card p-6 mb-8 animate-fade-up stagger-2" data-testid="compose-box">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Share what is on your mind. Your identity stays anonymous."
            data-testid="compose-textarea"
            className="w-full h-28 p-4 rounded-xl border border-eunoia-border bg-warm-white font-sans text-sm text-charcoal resize-none focus:outline-none focus:border-accent placeholder:text-mid/40"
          />

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
                    <button onClick={handleUseSuggestion} data-testid="use-suggestion-btn" className="px-4 py-2 rounded-full bg-accent text-white font-sans text-xs font-medium flex items-center gap-1">
                      <Check size={12} /> Use this
                    </button>
                    <button onClick={() => setModResult(null)} className="px-4 py-2 rounded-full border border-eunoia-border text-mid font-sans text-xs">
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

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="font-sans text-mid text-sm">No posts yet. Be the first to share.</p>
            </div>
          )}
          {posts.map((post, i) => (
            <div key={post.id} className={`soft-card p-6 animate-fade-up`} data-testid={`post-${post.id}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="font-sans text-xs font-medium text-accent">{(post.display_name || 'A')[0]}</span>
                </div>
                <span className="font-sans text-sm font-medium text-charcoal">{post.display_name || 'Anonymous'}</span>
                <span className="font-sans text-xs text-mid">&middot; {new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <p className="font-sans text-sm text-charcoal leading-relaxed mb-4">{post.body}</p>

              {/* Reply button */}
              <button
                onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
                className="flex items-center gap-1.5 text-mid font-sans text-xs hover:text-charcoal transition-colors"
                data-testid={`reply-btn-${post.id}`}
              >
                <MessageSquare size={13} /> {post.replies?.length || 0} {post.replies?.length === 1 ? 'reply' : 'replies'}
              </button>

              {/* Replies */}
              {post.replies?.length > 0 && (
                <div className="mt-4 pl-6 border-l-2 border-eunoia-border space-y-3">
                  {post.replies.map(reply => (
                    <div key={reply.id} className="py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-sans text-xs font-medium text-charcoal">{reply.display_name || 'Anonymous'}</span>
                        <span className="font-sans text-[10px] text-mid">{new Date(reply.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="font-sans text-xs text-mid leading-relaxed">{reply.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply composer */}
              {replyTo === post.id && (
                <div className="mt-4 pl-6 border-l-2 border-accent/30 animate-fade-up">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full h-20 p-3 rounded-xl border border-eunoia-border bg-warm-white font-sans text-xs text-charcoal resize-none focus:outline-none focus:border-accent"
                    data-testid={`reply-textarea-${post.id}`}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => { setReplyTo(null); setReplyText(''); }} className="px-4 py-1.5 rounded-full text-mid font-sans text-xs">Cancel</button>
                    <button onClick={() => handleReply(post.id)} className="px-4 py-1.5 rounded-full bg-charcoal text-white font-sans text-xs font-medium" data-testid={`submit-reply-${post.id}`}>Reply</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}
    </div>
  );
}
