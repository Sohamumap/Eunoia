import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Assessment() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState('forward');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api('get', '/assessments/questions');
        setQuestions(data.questions);
      } catch (err) {
        console.error('Failed to load questions:', err);
      }
    };
    fetchQuestions();
  }, [api]);

  const q = questions[current];
  const total = questions.length;
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;
  const answered = q ? responses[q.id] !== undefined : false;

  const selectOption = (value) => {
    setResponses(prev => ({ ...prev, [q.id]: value }));
    // Auto-advance after short delay
    setTimeout(() => {
      if (current < total - 1) {
        setDirection('forward');
        setCurrent(prev => prev + 1);
      }
    }, 300);
  };

  const goBack = () => {
    if (current > 0) {
      setDirection('back');
      setCurrent(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api('post', '/assessments/submit', { responses });
      navigate('/profile');
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center pt-16">
        <p className="font-sans text-mid">Loading assessment...</p>
      </div>
    );
  }

  const scaleLabel = q?.scale === 'PHQ-9' ? 'Depression Screening (PHQ-9)' :
    q?.scale === 'GAD-7' ? 'Anxiety Screening (GAD-7)' :
    q?.scale === 'MBI-HSS-SUBSET' ? 'Burnout Assessment (MBI)' :
    'Loneliness Screening (UCLA-3)';

  const isLastQuestion = current === total - 1;

  return (
    <div className="min-h-screen bg-cream pt-20 pb-12 px-4" data-testid="assessment-page">
      {/* Progress bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-eunoia-border z-40">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
          data-testid="assessment-progress"
        />
      </div>

      <div className="max-w-xl mx-auto">
        {/* Scale label */}
        <div className="text-center mb-2 animate-fade-up">
          <span className="font-sans text-xs text-accent font-medium tracking-wider uppercase">
            {scaleLabel}
          </span>
        </div>

        {/* Question counter */}
        <div className="text-center mb-8">
          <span className="font-sans text-xs text-mid">
            {current + 1} of {total}
          </span>
        </div>

        {/* Question */}
        <div
          key={`q-${current}`}
          className="animate-fade-up"
        >
          <h2 className="font-serif text-2xl sm:text-3xl text-charcoal text-center mb-10 leading-snug" data-testid="assessment-question">
            {q.text}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const selected = responses[q.id] === opt.value;
              return (
                <button
                  key={`${q.id}-${opt.value}`}
                  onClick={() => selectOption(opt.value)}
                  data-testid={`option-${opt.value}`}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 font-sans text-left transition-all duration-200 hover:-translate-y-[1px] ${
                    selected
                      ? 'border-accent bg-accent/5 shadow-sm'
                      : 'border-eunoia-border bg-card-bg hover:border-charcoal/15'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                    selected ? 'bg-accent text-white' : 'bg-cream text-mid'
                  }`}>
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
            className="px-5 py-2.5 rounded-full font-sans text-sm text-mid hover:text-charcoal transition-colors disabled:opacity-30"
          >
            Back
          </button>

          {isLastQuestion && answered && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              data-testid="assessment-submit"
              className="px-8 py-3 rounded-full bg-charcoal text-white font-sans font-medium text-sm hover:-translate-y-[1px] hover:shadow-eunoia-hover transition-all duration-300 disabled:opacity-50"
            >
              {submitting ? 'Analyzing...' : 'See your Wellness Profile'}
            </button>
          )}
        </div>

        {/* Disclaimer */}
        <p className="mt-12 text-center font-sans text-[11px] text-mid/60 leading-relaxed">
          These are validated screening instruments, not diagnostic tools.
          PHQ-9 (Kroenke et al., 2001) &middot; GAD-7 (Spitzer et al., 2006) &middot; MBI-HSS (Maslach & Jackson, 1981) &middot; UCLA-3 (Hughes et al., 2004)
        </p>
      </div>
    </div>
  );
}
