import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CrisisModal from '@/components/CrisisModal';
import { PenLine, Clock, FileText, ChevronRight } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function Companion() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [reflections, setReflections] = useState([]);
  const [qualifyingCount, setQualifyingCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const textareaRef = useRef(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isQualifying = wordCount >= 100;

  const fetchReflections = useCallback(async () => {
    try {
      const { data } = await api('get', '/reflections/me');
      setReflections(data.reflections);
      setQualifyingCount(data.qualifying_count);
    } catch (error) {
      console.error('Failed to fetch reflections:', error);
    }
  }, [api]);

  useEffect(() => { fetchReflections(); }, [fetchReflections]);

  const handleSave = async () => {
    if (wordCount < 10) return;
    setSaving(true);
    try {
      const { data } = await api('post', '/reflections', { body: text, is_private: true });
      if (!data.saved && data.moderation?.status === 'paused_crisis') {
        setShowCrisis(true);
        setSaving(false);
        return;
      }
      setText('');
      await fetchReflections();

      if (data.trigger_report) {
        toast('Eunoia is reading your reflections...', {
          duration: 2500,
          style: { fontFamily: 'DM Sans', background: 'var(--warm-white)', color: 'var(--charcoal)', border: '1px solid var(--border)' }
        });
        setTimeout(async () => {
          try {
            await api('post', '/profiles/generate-from-reflections');
            navigate('/profile');
          } catch (err) {
            console.error('Report generation failed:', err);
            navigate('/profile');
          }
        }, 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16" data-testid="companion-page">
      <Toaster position="top-center" />

      <div className="flex h-[calc(100vh-5rem)]">
        {/* Sidebar - reflection history */}
        <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative z-30 w-72 h-full bg-warm-white border-r border-eunoia-border overflow-y-auto transition-transform duration-300`}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-lg font-semibold text-charcoal">Reflections</h3>
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-sans text-xs font-medium" data-testid="qualifying-count">
                {qualifyingCount}/3 qualifying
              </span>
            </div>

            {qualifyingCount < 3 && (
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/15 mb-4">
                <p className="font-sans text-xs text-accent leading-relaxed">
                  Write {3 - qualifyingCount} more reflection{3 - qualifyingCount > 1 ? 's' : ''} of 100+ words to unlock your personalized Wellness Profile.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {reflections.map((r, i) => (
                <div key={r.id} className="p-3 rounded-xl bg-card-bg border border-eunoia-border hover:shadow-sm transition-all" data-testid={`reflection-${i}`}>
                  <p className="font-sans text-xs text-charcoal line-clamp-2 leading-relaxed">{r.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-sans text-[10px] text-mid flex items-center gap-1">
                      <Clock size={10} /> {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    <span className={`font-sans text-[10px] font-medium px-1.5 py-0.5 rounded ${r.word_count >= 100 ? 'bg-sage/10 text-sage' : 'bg-mid/10 text-mid'}`}>
                      {r.word_count}w
                    </span>
                  </div>
                </div>
              ))}
              {reflections.length === 0 && (
                <p className="font-sans text-xs text-mid text-center py-6">Your reflections will appear here.</p>
              )}
            </div>
          </div>
        </div>

        {/* Main writing area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile sidebar toggle */}
          <div className="md:hidden px-4 py-2 border-b border-eunoia-border bg-warm-white flex items-center justify-between">
            <button onClick={() => setShowSidebar(!showSidebar)} className="flex items-center gap-1.5 text-mid font-sans text-sm">
              <FileText size={14} /> History ({reflections.length})
            </button>
            <span className="font-sans text-xs text-accent">{qualifyingCount}/3</span>
          </div>

          <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 sm:px-8 py-8">
            <div className="text-center mb-8 animate-fade-up">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <PenLine size={18} className="text-accent" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mb-2">Companion</h1>
              <p className="font-sans text-sm text-mid">Write freely. Nobody reads this but you and Eunoia.</p>
            </div>

            <div className="flex-1 animate-fade-up stagger-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What is on your mind today? Write honestly. This is your private space."
                data-testid="companion-textarea"
                className="w-full h-full min-h-[300px] p-6 rounded-eunoia border border-eunoia-border bg-card-bg font-sans text-[15px] text-charcoal leading-relaxed resize-none focus:outline-none focus:border-accent/30 focus:shadow-eunoia transition-all placeholder:text-mid/30"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            {/* Footer controls */}
            <div className="flex items-center justify-between mt-4 animate-fade-up stagger-3">
              <div className="flex items-center gap-3">
                <span className={`font-sans text-sm font-medium ${isQualifying ? 'text-sage' : 'text-mid'}`} data-testid="word-count">
                  {wordCount} words
                </span>
                {wordCount > 0 && wordCount < 100 && (
                  <span className="font-sans text-xs text-mid">
                    {100 - wordCount} more for a qualifying reflection
                  </span>
                )}
                {isQualifying && (
                  <span className="px-2 py-0.5 rounded-full bg-sage/10 text-sage font-sans text-[10px] font-medium">
                    Qualifying
                  </span>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving || wordCount < 10}
                data-testid="save-reflection-btn"
                className="px-6 py-2.5 rounded-full bg-charcoal text-white font-sans text-sm font-medium hover:-translate-y-[1px] transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                {saving ? 'Saving...' : 'Save reflection'}
                {!saving && <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}

      {/* Disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 bg-warm-white/90 backdrop-blur-sm border-t border-eunoia-border py-2 px-4 text-center z-20">
        <p className="font-sans text-[10px] text-mid">
          Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment. Please consult a licensed clinician for care.
        </p>
      </div>
    </div>
  );
}
