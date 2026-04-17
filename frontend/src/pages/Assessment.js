import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Brain, Zap, Moon, Flame, Users, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

const sectionIcons = { heart: Heart, brain: Brain, zap: Zap, moon: Moon, flame: Flame, users: Users };

const sectionMessages = [
  { before: "Let us start by understanding how you have been feeling lately.", after: "Thank you. Your honesty takes courage." },
  { before: "Now let us explore what has been on your mind.", after: "You are doing great. Almost halfway there." },
  { before: "These next questions are about your stress levels over the past month.", after: "Three sections down. You are building a clear picture." },
  { before: "Sleep matters more than most people realize. Let us check in.", after: "Nearly there. Just two short sections left." },
  { before: "These questions look at how your work is affecting you.", after: "One more section. You are almost done." },
  { before: "Finally, a quick check on how connected you feel.", after: null },
];

export default function Assessment() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'section_intro' | 'question' | 'section_done' | 'submitting'
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api('get', '/assessments/questions');
        setQuestions(data.questions);
        setSections(data.sections || []);
        setPhase('section_intro');
      } catch (err) {
        console.error('Failed to load questions:', err);
      }
    };
    fetchQuestions();
  }, [api]);

  const total = questions.length;
  const q = questions[current];

  // Get current section info
  const secInfo = sections[currentSection];
  const sectionQuestions = secInfo ? questions.filter(qq => qq.section === secInfo.id) : [];
  const sectionStart = secInfo ? questions.findIndex(qq => qq.section === secInfo.id) : 0;
  const sectionProgress = secInfo ? ((current - sectionStart + 1) / sectionQuestions.length) * 100 : 0;
  const globalProgress = total > 0 ? ((current + 1) / total) * 100 : 0;

  const selectOption = (value) => {
    setResponses(prev => ({ ...prev, [q.id]: value }));
    setTimeout(() => {
      if (current < total - 1) {
        const nextQ = questions[current + 1];
        if (nextQ.section !== q.section) {
          setPhase('section_done');
        } else {
          setCurrent(prev => prev + 1);
        }
      } else {
        // Last question - show completion screen
        setPhase('section_done');
      }
    }, 250);
  };

  const goBack = () => {
    if (current > 0) {
      const prevQ = questions[current - 1];
      if (prevQ.section !== q?.section && phase === 'question') {
        setCurrent(prev => prev - 1);
        const prevSec = sections.findIndex(s => s.id === prevQ.section);
        if (prevSec >= 0) setCurrentSection(prevSec);
      } else {
        setCurrent(prev => prev - 1);
      }
    }
  };

  const startSection = () => {
    setPhase('question');
  };

  const nextSection = () => {
    const nextSec = currentSection + 1;
    if (nextSec < sections.length) {
      setCurrentSection(nextSec);
      setCurrent(prev => prev + 1);
      setPhase('section_intro');
    }
  };

  const handleSubmit = async () => {
    setPhase('submitting');
    setSubmitting(true);
    try {
      await api('post', '/assessments/submit', { responses });
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitting(false);
      setPhase('question');
    }
  };

  const isLastQuestion = current === total - 1;
  const answered = q ? responses[q.id] !== undefined : false;
  const SectionIcon = secInfo ? (sectionIcons[secInfo.icon] || Heart) : Heart;

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-sans text-mid text-sm">Preparing your check-in...</p>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16" data-testid="assessment-submitting">
        <div className="text-center animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles size={28} className="text-accent" />
          </div>
          <h2 className="font-serif text-2xl text-charcoal mb-3">Building your Wellness Profile...</h2>
          <p className="font-sans text-mid text-sm">Analyzing your responses across 6 clinical scales.</p>
        </div>
      </div>
    );
  }

  // Section intro screen
  if (phase === 'section_intro' && secInfo) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4" data-testid="assessment-page">
        {/* Global progress */}
        <div className="fixed top-16 left-0 right-0 h-1 bg-eunoia-border z-40">
          <div className="h-full transition-all duration-700 ease-out" style={{ width: `${globalProgress}%`, backgroundColor: secInfo.color }} />
        </div>

        <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center animate-fade-up">
            <div className="flex items-center justify-center gap-2 mb-4">
              {sections.map((s, i) => (
                <div key={s.id} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < currentSection ? 'bg-sage' : i === currentSection ? 'w-8 rounded-lg' : 'bg-eunoia-border'}`}
                  style={i === currentSection ? { backgroundColor: secInfo.color } : undefined}
                />
              ))}
            </div>

            <p className="font-sans text-xs text-mid mb-6 tracking-wider uppercase">
              Section {currentSection + 1} of {sections.length}
            </p>

            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${secInfo.color}15` }}>
              <SectionIcon size={36} style={{ color: secInfo.color }} />
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mb-4" data-testid="section-title">
              {secInfo.title}
            </h1>
            <p className="font-sans text-mid text-base mb-3 max-w-md mx-auto leading-relaxed">
              {sectionMessages[currentSection]?.before}
            </p>
            <p className="font-sans text-xs text-mid/50 mb-8">
              {secInfo.subtitle} &middot; {secInfo.count} questions
            </p>

            <button
              onClick={startSection}
              data-testid="start-section-btn"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-sans font-medium text-sm hover:-translate-y-[1px] hover:shadow-lg transition-all duration-300"
              style={{ backgroundColor: secInfo.color }}
            >
              {currentSection === 0 ? 'Begin' : 'Continue'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Section done screen
  if (phase === 'section_done') {
    const isLast = currentSection === sections.length - 1;
    return (
      <div className="min-h-screen pt-20 pb-12 px-4" data-testid="section-done">
        <div className="fixed top-16 left-0 right-0 h-1 bg-eunoia-border z-40">
          <div className="h-full transition-all duration-700 ease-out" style={{ width: `${globalProgress}%`, backgroundColor: secInfo.color }} />
        </div>

        <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${secInfo.color}15` }}>
              <Check size={28} style={{ color: secInfo.color }} />
            </div>
            <h2 className="font-serif text-2xl text-charcoal mb-3">
              {secInfo.title.replace('?', '')} \u2014 complete.
            </h2>
            <p className="font-sans text-mid text-sm mb-8 max-w-sm mx-auto">
              {sectionMessages[currentSection]?.after || 'Section complete.'}
            </p>

            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                data-testid="assessment-submit"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-charcoal text-white font-sans font-medium text-sm hover:-translate-y-[1px] hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? 'Analyzing...' : 'See your Wellness Profile'}
                <Sparkles size={16} />
              </button>
            ) : (
              <button
                onClick={nextSection}
                data-testid="next-section-btn"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-sans font-medium text-sm hover:-translate-y-[1px] hover:shadow-lg transition-all duration-300"
                style={{ backgroundColor: sections[currentSection + 1]?.color || '#1C1C1E' }}
              >
                Next: {sections[currentSection + 1]?.title}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Question screen
  if (!q) return null;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4" data-testid="assessment-page">
      {/* Global progress bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-eunoia-border z-40">
        <div className="h-full transition-all duration-500 ease-out" style={{ width: `${globalProgress}%`, backgroundColor: secInfo?.color || 'var(--accent)' }} />
      </div>

      <div className="max-w-xl mx-auto">
        {/* Section label + question counter */}
        <div className="text-center mb-2 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2" style={{ backgroundColor: `${secInfo?.color || '#C17B2F'}10` }}>
            <SectionIcon size={12} style={{ color: secInfo?.color }} />
            <span className="font-sans text-[11px] font-medium tracking-wider uppercase" style={{ color: secInfo?.color }}>
              {secInfo?.title?.replace('?', '')}
            </span>
          </div>
        </div>

        <div className="text-center mb-8">
          {/* Encouraging progress visualization */}
          <div className="max-w-md mx-auto">
            {/* Progress bar with gradient */}
            <div className="relative w-full h-3 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 overflow-hidden shadow-inner">
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out shadow-lg"
                style={{ 
                  width: `${(current / total) * 100}%`,
                  background: `linear-gradient(90deg, ${secInfo?.color || '#7FB88F'}, ${secInfo?.color || '#7FB88F'}dd)`,
                  boxShadow: `0 0 12px ${secInfo?.color || '#7FB88F'}80`
                }}
              />
              {/* Milestone markers */}
              <div className="absolute inset-0 flex justify-between px-1">
                {[25, 50, 75].map(milestone => (
                  <div 
                    key={milestone} 
                    className={`w-0.5 h-full ${(current / total) * 100 >= milestone ? 'bg-white/40' : 'bg-gray-300/60'}`}
                  />
                ))}
              </div>
            </div>
            
            {/* Encouraging message based on progress */}
            <p className="font-sans text-xs text-mid mt-3">
              {(() => {
                const progress = (current / total) * 100;
                if (progress < 25) return "🌱 Great start! You're building insight.";
                if (progress < 50) return "💫 You're doing amazing! Keep going.";
                if (progress < 75) return "🎯 Over halfway there! You've got this.";
                if (progress < 95) return "⭐ Almost done! Your reflection is nearly complete.";
                return "🎉 Final question! You're almost there.";
              })()}
            </p>
          </div>
        </div>

        {/* Question */}
        <div key={`q-${current}`} className="animate-fade-up">
          <h2 className="font-serif text-2xl sm:text-3xl text-charcoal text-center mb-10 leading-snug" data-testid="assessment-question">
            {q.text}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt) => {
              const selected = responses[q.id] === opt.value;
              return (
                <button
                  key={`${q.id}-${opt.value}`}
                  onClick={() => selectOption(opt.value)}
                  data-testid={`option-${opt.value}`}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 font-sans text-left transition-all duration-200 hover:-translate-y-[1px] ${
                    selected ? 'shadow-sm' : 'border-eunoia-border bg-card-bg hover:border-charcoal/15'
                  }`}
                  style={selected ? { borderColor: secInfo?.color, backgroundColor: `${secInfo?.color}08` } : undefined}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                    selected ? 'text-white' : 'bg-cream text-mid'
                  }`} style={selected ? { backgroundColor: secInfo?.color } : undefined}>
                    {opt.value}
                  </div>
                  <span className={`text-sm ${selected ? 'text-charcoal font-medium' : 'text-mid'}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={goBack}
            disabled={current === 0}
            data-testid="assessment-back"
            className="flex items-center gap-1 px-5 py-2.5 rounded-full font-sans text-sm text-mid hover:text-charcoal transition-colors disabled:opacity-30"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {isLastQuestion && answered && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              data-testid="assessment-submit"
              className="px-8 py-3 rounded-full bg-charcoal text-white font-sans font-medium text-sm hover:-translate-y-[1px] hover:shadow-eunoia-hover transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Analyzing...' : 'See your Wellness Profile'}
              <Sparkles size={14} />
            </button>
          )}
        </div>

        {/* Citation footer */}
        <p className="mt-12 text-center font-sans text-[10px] text-mid/50 leading-relaxed">
          Validated screening instruments. PHQ-9 (Kroenke 2001) &middot; GAD-7 (Spitzer 2006) &middot; PSS-10 (Cohen 1983) &middot; PSQI (Buysse 1989) &middot; MBI-HSS (Maslach 1981) &middot; UCLA-3 (Hughes 2004)
        </p>
      </div>
    </div>
  );
}
