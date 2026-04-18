import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Wind, BookOpen, Eye, Play, Pause, RotateCcw, Check } from 'lucide-react';

const iconMap = { breathwork: Wind, reflection: BookOpen, grounding: Eye };

function BreathingExercise({ practice, onClose }) {
  const [phase, setPhase] = useState('ready');
  const [cycle, setCycle] = useState(0);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const steps = practice.steps;
  const totalCycles = practice.cycles;
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!running) return;
    const step = steps[stepIdx];
    if (timer < step.duration) {
      const t = setTimeout(() => setTimer(prev => prev + 1), 1000);
      return () => clearTimeout(t);
    }
    // Move to next step
    if (stepIdx < steps.length - 1) {
      setStepIdx(prev => prev + 1);
      setTimer(0);
    } else if (cycle < totalCycles - 1) {
      setCycle(prev => prev + 1);
      setStepIdx(0);
      setTimer(0);
    } else {
      setRunning(false);
      setPhase('done');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timer, stepIdx, cycle, steps, totalCycles]);

  const start = () => { setRunning(true); setPhase('running'); setTimer(0); setStepIdx(0); setCycle(0); };
  const step = steps[stepIdx];
  const circleSize = step ? (timer / step.duration) * 100 : 0;

  return (
    <div className="text-center py-6">
      {phase === 'ready' && (
        <div className="animate-fade-up">
          <p className="font-sans text-mid text-sm mb-6">Find a comfortable position. This takes about 2 minutes.</p>
          <button onClick={start} data-testid="start-breathing" className="px-8 py-3 rounded-full bg-charcoal text-white font-sans text-sm font-medium hover:-translate-y-[1px] transition-all">
            <Play size={14} className="inline mr-2" />Begin
          </button>
        </div>
      )}
      {phase === 'running' && (
        <div className="animate-fade-up">
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="3" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray={`${circleSize * 2.83} 283`} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-3xl font-bold text-charcoal">{step.duration - timer}</span>
              <span className="font-sans text-xs text-mid mt-1">{step.phase}</span>
            </div>
          </div>
          <p className="font-serif text-lg italic text-charcoal mb-2">{step.instruction}</p>
          <p className="font-sans text-xs text-mid">Cycle {cycle + 1} of {totalCycles}</p>
        </div>
      )}
      {phase === 'done' && (
        <div className="animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-sage" />
          </div>
          <p className="font-serif text-lg text-charcoal mb-2">Well done.</p>
          <p className="font-sans text-sm text-mid mb-6">Take a moment before moving on.</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-full border border-eunoia-border text-charcoal font-sans text-sm hover:-translate-y-[1px] transition-all">Done</button>
        </div>
      )}
    </div>
  );
}

function ReflectionExercise({ practice, onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const prompts = practice.prompts;

  return (
    <div className="py-6">
      {step < prompts.length ? (
        <div className="animate-fade-up" key={step}>
          <p className="font-sans text-xs text-accent font-medium mb-2">{step + 1} of {prompts.length}</p>
          <p className="font-serif text-xl text-charcoal mb-6 italic">{prompts[step]}</p>
          <textarea
            value={answers[step] || ''}
            onChange={e => setAnswers(prev => ({ ...prev, [step]: e.target.value }))}
            className="w-full h-24 p-4 rounded-xl border border-eunoia-border bg-warm-white font-sans text-sm text-charcoal resize-none focus:outline-none focus:border-accent"
            placeholder="Write freely..."
          />
          <div className="flex justify-end mt-4">
            <button onClick={() => setStep(prev => prev + 1)} className="px-6 py-2.5 rounded-full bg-charcoal text-white font-sans text-sm font-medium hover:-translate-y-[1px] transition-all">
              {step < prompts.length - 1 ? 'Next' : 'Finish'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center animate-fade-up">
          <Check size={28} className="text-sage mx-auto mb-3" />
          <p className="font-serif text-lg text-charcoal mb-2">Reflection complete.</p>
          <p className="font-sans text-sm text-mid mb-4">These small pauses matter more than you think.</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-full border border-eunoia-border text-charcoal font-sans text-sm hover:-translate-y-[1px] transition-all">Done</button>
        </div>
      )}
    </div>
  );
}

function GroundingExercise({ practice, onClose }) {
  const [step, setStep] = useState(0);
  const [items, setItems] = useState([]);
  const steps = practice.steps;
  const s = steps[step];

  const addItem = () => {
    if (items.length < s.count) setItems(prev => [...prev, '']);
  };

  const next = () => {
    if (step < steps.length - 1) { setStep(prev => prev + 1); setItems([]); }
    else onClose();
  };

  return (
    <div className="py-6 animate-fade-up" key={step}>
      <p className="font-sans text-xs text-accent font-medium mb-2">{step + 1} of {steps.length}</p>
      <p className="font-serif text-xl text-charcoal mb-6 italic">{s.prompt}</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from({ length: s.count }).map((_, i) => (
          <div key={`hub-slot-${step}-${i}`} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-sans text-sm font-medium transition-all ${
            i < items.length ? 'border-accent bg-accent/5 text-accent' : 'border-eunoia-border text-mid'
          }`}>
            {i < items.length ? <Check size={16} /> : i + 1}
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {items.length < s.count && (
          <button onClick={addItem} className="px-6 py-2.5 rounded-full border border-eunoia-border text-charcoal font-sans text-sm hover:-translate-y-[1px] transition-all">
            Found one
          </button>
        )}
        {items.length >= s.count && (
          <button onClick={next} className="px-6 py-2.5 rounded-full bg-charcoal text-white font-sans text-sm font-medium hover:-translate-y-[1px] transition-all">
            {step < steps.length - 1 ? 'Next sense' : 'Done'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Hub() {
  const { api } = useAuth();
  const [practices, setPractices] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api('get', '/hub/practices');
        setPractices(data.practices);
      } catch (error) {
        console.error('Failed to fetch practices:', error);
      }
    };
    fetch();
  }, [api]);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4" data-testid="hub-page">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mb-3">Wellness Hub</h1>
          <p className="font-sans text-mid text-base">Evidence-based micro-practices. Two minutes each. No signup required.</p>
        </div>

        <div className="space-y-6">
          {practices.map((p, i) => {
            const Icon = iconMap[p.category] || Wind;
            const isActive = active === p.id;

            return (
              <div
                key={p.id}
                className={`soft-card overflow-hidden transition-all duration-300 animate-fade-up stagger-${i + 1}`}
                data-testid={`practice-${p.id}`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-semibold text-charcoal mb-1">{p.title}</h3>
                      <p className="font-sans text-sm text-mid leading-relaxed mb-1">{p.description}</p>
                      <p className="font-sans text-xs text-mid/60">{p.duration} &middot; {p.citation}</p>
                    </div>
                    {!isActive && (
                      <button
                        onClick={() => setActive(p.id)}
                        data-testid={`start-${p.id}`}
                        className="px-5 py-2.5 rounded-full bg-charcoal text-white font-sans text-sm font-medium hover:-translate-y-[1px] transition-all flex-shrink-0"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
                {isActive && (
                  <div className="px-6 pb-6 border-t border-eunoia-border pt-4">
                    {p.category === 'breathwork' && <BreathingExercise practice={p} onClose={() => setActive(null)} />}
                    {p.category === 'reflection' && <ReflectionExercise practice={p} onClose={() => setActive(null)} />}
                    {p.category === 'grounding' && <GroundingExercise practice={p} onClose={() => setActive(null)} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center font-sans text-xs text-mid leading-relaxed">
          Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment.
        </p>
      </div>
    </div>
  );
}
