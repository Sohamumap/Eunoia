import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Heart, Wind, Activity, BookOpen, Shield, Users, Sparkles, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from '@/components/Logo';

const testimonials = [
  { text: "I tried three different apps. They all felt like talking to a mirror. Eunoia felt like walking into a room of people who actually get it.", name: "Resident_3847", role: "Internal Medicine", tint: "peach" },
  { text: "The burnout report did not tell me anything I did not already know. But seeing it written down, with numbers, by something that read my own words \u2014 that made it real enough to act on.", name: "Intern_0933", role: "First-year Surgery", tint: "sage" },
  { text: "I needed a place that would not diagnose me, would not sell me anything, and would not pretend to be my therapist. I just needed to know I was not the only one.", name: "Dr_1847", role: "Emergency Medicine PGY-3", tint: "lavender" }
];

function ConcentricCircles() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const rings = [
    { label: 'OWN', desc: 'Data Cooperative', color: 'var(--green)', size: 280, delay: '0.4s' },
    { label: 'REFLECT', desc: 'Quantified Reflection', color: 'var(--lavender)', size: 200, delay: '0.2s' },
    { label: 'PEER', desc: 'Peer Circles', color: 'var(--accent)', size: 120, delay: '0s' },
  ];

  return (
    <div ref={ref} className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
      <div className="flex-1 space-y-10">
        {[
          { num: '01', title: 'Peer Circles', desc: 'Anonymous communities of people in the same trench. Moderated for safety, designed for solidarity.' },
          { num: '02', title: 'Quantified Reflection', desc: 'Validated clinical scales and free-form journaling. Your burnout, measured by your own words.' },
          { num: '03', title: 'Data Cooperative', desc: 'You own your data. Opt in to share anonymized insights and receive a share of commercial value.' },
        ].map((item, i) => (
          <div key={`principle-${item.num}`} className={`flex gap-5 items-start ${visible ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: `${i * 0.15 + 0.3}s` }}>
            <span className="font-mono text-base text-accent font-bold mt-1">{item.num}</span>
            <div>
              <h3 className="font-serif text-2xl font-semibold text-charcoal mb-2">{item.title}</h3>
              <p className="font-sans text-base text-mid leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex-shrink-0" style={{ width: 340, height: 340 }}>
        <svg viewBox="0 0 340 340" className="w-full h-full">
          {[0, 60, 120, 180, 240, 300].map(angle => (
            <line
              key={angle}
              x1="170" y1="170"
              x2={170 + 160 * Math.cos((angle * Math.PI) / 180)}
              y2={170 + 160 * Math.sin((angle * Math.PI) / 180)}
              stroke="var(--border)" strokeWidth="0.5" opacity="0.5"
            />
          ))}
          {rings.map((ring, i) => (
            <circle
              key={`ring-${ring.size}-${ring.color}`}
              cx="170" cy="170" r={ring.size / 2}
              fill={i === 2 ? 'rgba(193, 123, 47, 0.10)' : i === 1 ? 'rgba(123, 111, 165, 0.05)' : 'none'}
              stroke={ring.color} strokeWidth={i === 2 ? 2 : 1}
              style={{
                transform: visible ? 'scale(1)' : 'scale(0)',
                transformOrigin: '170px 170px',
                transition: `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${ring.delay}`,
                opacity: visible ? 1 : 0,
              }}
            />
          ))}
          <circle cx="170" cy="170" r="7" fill="var(--accent)" style={{ filter: 'drop-shadow(0 0 10px rgba(193,123,47,0.6))' }} />
        </svg>
        {rings.map((ring, i) => (
          <div
            key={`ring-${ring.label}`}
            className={`absolute font-mono text-[10px] tracking-widest font-medium ${visible ? 'animate-fade-in' : 'opacity-0'}`}
            style={{
              color: ring.color,
              top: 170 - ring.size / 2 - 14, left: '50%', transform: 'translateX(-50%)',
              animationDelay: `${parseFloat(ring.delay) + 0.5}s`
            }}
          >
            {ring.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Feature Showcase Carousel — inspired by provided screenshots */
function FeatureShowcaseCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const features = [
    {
      title: 'Find your cohort',
      description: 'Anonymous circles for the specific kind of hard you&apos;re carrying.',
      image: 'https://customer-assets.emergentagent.com/job_proto-feature-fix/artifacts/sxc3kxv8_Screenshot%202026-04-17%20060534.png',
    },
    {
      title: 'Wellness Hub',
      description: 'Evidence-based micro-practices. Two minutes each. No signup required.',
      image: 'https://customer-assets.emergentagent.com/job_proto-feature-fix/artifacts/3kj20p8o_Screenshot%202026-04-17%20060553.png',
    },
    {
      title: 'Your Profile',
      description: 'Track your progress over time with validated clinical assessments.',
      image: 'https://customer-assets.emergentagent.com/job_proto-feature-fix/artifacts/4pfalbk3_Screenshot%202026-04-17%20060609.png',
    },
    {
      title: 'Weekly Burnout Dashboard',
      description: 'Understand patterns in your stress, exhaustion, and accomplishment.',
      image: 'https://customer-assets.emergentagent.com/job_proto-feature-fix/artifacts/4io07aay_Screenshot%202026-04-17%20060623.png',
    },
  ];

  // Auto-advance every 7 seconds
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % features.length);
      }, 7000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, features.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  return (
    <section className="py-24 px-6" id="showcase">
      <div className="max-w-5xl mx-auto">
        {/* Top pill badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-charcoal text-white font-sans text-[11px] uppercase tracking-[0.14em] font-medium">
            Inside Eunoia
          </span>
        </div>

        {/* Serif headline */}
        <h2 className="font-serif text-4xl sm:text-5xl text-charcoal text-center mb-12 leading-tight">
          {features[currentIndex].title}
        </h2>
        <p className="font-sans text-base text-mid text-center max-w-2xl mx-auto mb-10">
          {features[currentIndex].description}
        </p>

        {/* Carousel container */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Large image preview */}
          <div className="soft-card overflow-hidden p-0 relative" style={{ minHeight: '500px' }}>
            <img
              src={features[currentIndex].image}
              alt={features[currentIndex].title}
              className="w-full h-full object-contain"
              style={{ maxHeight: '600px' }}
            />
          </div>

          {/* Left chevron */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} className="text-charcoal" />
          </button>

          {/* Right chevron */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="text-charcoal" />
          </button>
        </div>

        {/* Bottom tab pills */}
        <div className="flex justify-center gap-2 mt-8">
          {features.map((_, index) => (
            <button
              key={`carousel-tab-${index}`}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-charcoal'
                  : 'w-2 bg-charcoal/20 hover:bg-charcoal/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Inside Eunoia preview — mosaic inspired by image 5 */
function InsideEunoiaPreview() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24 px-6" id="inside">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-mid mb-2">Inside Eunoia</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-charcoal mb-3 leading-tight">
            Not a dashboard. <em className="italic font-normal" style={{ color: 'var(--accent)' }}>A soft room.</em>
          </h2>
          <p className="font-sans text-mid max-w-2xl mx-auto">
            Cards you can breathe in. Numbers that do not shout. A daily check-in that takes five seconds.
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-6 gap-5 ${visible ? '' : 'opacity-0'}`}>
          {/* Breathe hero */}
          <div className="soft-card soft-card-tint-sunset no-hover md:col-span-2 md:row-span-2 p-7 relative overflow-hidden animate-fade-up">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full animate-slow-pulse" style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(232,168,76,0.3) 40%, transparent 70%)',
              filter: 'blur(4px)',
            }} />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <p className="font-mono text-[10px] text-charcoal/60 uppercase tracking-wider mb-2">19:30</p>
                <div className="flex justify-center my-6">
                  <div className="w-32 h-32 rounded-full animate-breathe" style={{
                    background: 'radial-gradient(circle at 35% 30%, #FFE2C7 0%, #E8A84C 50%, #C17B2F 100%)',
                    boxShadow: '0 0 60px -5px rgba(232,168,76,0.7)',
                  }} />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-serif text-2xl font-bold text-charcoal">Breathe.</h3>
                <p className="font-sans text-xs text-charcoal/60 mt-1">Tap to begin</p>
              </div>
            </div>
          </div>

          {/* Mood dial */}
          <div className="soft-card no-hover md:col-span-2 p-6 animate-fade-up stagger-1">
            <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid mb-4">Today</p>
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" width="80" height="80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(232,228,222,0.7)" strokeWidth="5" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#7FB88F" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${0.72 * 2 * Math.PI * 34} ${2 * Math.PI * 34}`} />
                </svg>
                <span className="font-serif text-lg font-semibold text-charcoal">Steady</span>
              </div>
              <div className="flex-1">
                <p className="font-serif text-3xl font-bold text-charcoal leading-none">7.8</p>
                <p className="font-sans text-[11px] text-mid mt-1">Sleep score</p>
                <p className="font-sans text-[11px] text-sage mt-0.5">+0.4 vs last week</p>
              </div>
            </div>
          </div>

          {/* Notification */}
          <div className="soft-card soft-card-tint-cream no-hover md:col-span-2 p-6 animate-fade-up stagger-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-accent" />
              <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid">Notification</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 mt-2">
              <p className="font-sans text-sm font-semibold text-charcoal">Tap to bloom</p>
              <p className="font-sans text-xs text-mid mt-1">Hold to gently increase reflection depth.</p>
            </div>
          </div>

          {/* Welcome */}
          <div className="soft-card soft-card-tint-peach no-hover md:col-span-2 p-6 animate-fade-up stagger-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full animate-float" style={{
                background: 'radial-gradient(circle at 35% 30%, #FFE2C7 0%, #E8A84C 60%, #C17B2F 100%)',
                boxShadow: '0 4px 12px -2px rgba(232,168,76,0.5)',
              }} />
              <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid">Welcome</p>
            </div>
            <h3 className="font-serif text-xl font-bold text-charcoal">Your quiet room</h3>
            <p className="font-sans text-xs text-mid mt-1 mb-3">for rest and reflection, always private.</p>
            <Link to="/signup" className="inline-block px-4 py-1.5 rounded-full bg-charcoal text-white text-xs font-medium no-underline">Get started</Link>
          </div>

          {/* Gallery — people */}
          <div className="soft-card no-hover md:col-span-2 p-3 animate-fade-up stagger-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-2">
              {[
                { c: 'sage', t: 'Read' },
                { c: 'sky', t: 'Move' },
                { c: 'rose', t: 'Rest' },
                { c: 'lavender', t: 'Write' },
              ].map((g) => (
                <div key={`gallery-${g.t}`} className={`soft-card-tint-${g.c} rounded-xl p-4 aspect-square flex flex-col items-center justify-center`}>
                  <div className="w-10 h-10 rounded-full bg-white/50 mb-1" />
                  <span className="font-sans text-[10px] font-medium text-charcoal/70">{g.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar sparkline */}
          <div className="soft-card soft-card-tint-sage no-hover md:col-span-2 p-6 animate-fade-up stagger-5">
            <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid mb-3">13 weeks</p>
            <div className="flex gap-1">
              {Array.from({ length: 13 }).map((_, col) => (
                <div key={`spark-col-${col}`} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, row) => {
                    const palette = ['#C0726A', '#7B6FA5', '#C8A0B5', '#7FB88F', '#E8A84C', 'rgba(232,228,222,0.45)'];
                    const idx = Math.floor(Math.random() * 6);
                    return <div key={`spark-${col}-${row}`} className="w-2 h-2 rounded-[2px]" style={{ background: palette[idx] }} />;
                  })}
                </div>
              ))}
            </div>
            <p className="font-sans text-xs text-mid mt-4">Mood patterns, tracked gently.</p>
          </div>

          {/* Typography */}
          <div className="soft-card no-hover md:col-span-2 p-6 animate-fade-up stagger-6 flex items-center justify-between">
            <div>
              <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid">Voice</p>
              <p className="font-serif text-lg text-charcoal italic mt-1">&ldquo;Less shouting.&rdquo;</p>
            </div>
            <span className="font-serif text-6xl font-bold" style={{ color: 'var(--accent)' }}>Aa</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  const pillars = [
    { icon: Wind, title: 'Micro-practices', desc: 'Guided breathing, grounding, and rest rituals — under two minutes each.', tint: 'peach' },
    { icon: BookOpen, title: 'Private reflection', desc: 'A blank page that listens. Tag, search, and return to your own words.', tint: 'cream' },
    { icon: Users, title: 'Peer circles', desc: 'Small anonymous rooms of people in the same profession, same phase.', tint: 'sage' },
    { icon: Activity, title: 'Clinical scales', desc: 'PHQ-9, GAD-7, PSS-10, PSQI, MBI, UCLA-3 — quietly scored, never weaponised.', tint: 'lavender' },
    { icon: Moon, title: 'Emotion tracking', desc: 'A gentle calendar that shows the patterns your body already knew.', tint: 'sky' },
    { icon: Shield, title: 'Your data, yours', desc: 'Opt-in cooperative. Export anytime. Delete forever. No dark patterns.', tint: 'rose' },
  ];
  return (
    <section className="py-24 px-6" id="features">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-mid mb-2">What&apos;s inside</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-charcoal leading-tight">
            Six pillars. <em className="italic font-normal" style={{ color: 'var(--accent)' }}>One soft room.</em>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((p, i) => (
            <div key={`pillar-${p.title}`} className={`soft-card soft-card-tint-${p.tint} p-7 animate-fade-up stagger-${(i % 6) + 1}`}>
              <div className="w-11 h-11 rounded-xl bg-white/60 flex items-center justify-center mb-4">
                <p.icon size={18} className="text-charcoal" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-charcoal mb-2">{p.title}</h3>
              <p className="font-sans text-sm text-charcoal/70 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen" data-testid="landing-page">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-18">
          <Logo to="/" size="lg" />
          <div className="flex items-center gap-6">
            <a href="#features" className="hidden md:inline font-sans text-base text-mid hover:text-charcoal transition-colors no-underline font-medium">Features</a>
            <a href="#how-it-works" className="hidden md:inline font-sans text-base text-mid hover:text-charcoal transition-colors no-underline font-medium">How it works</a>
            <Link
              to="/signup"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-sans font-semibold text-white no-underline animate-pulse-crisis"
              style={{ backgroundColor: 'var(--rose)' }}
              data-testid="nav-get-help"
            >
              <Heart size={14} fill="white" /> Get Help Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — Clean layout with single background */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 w-full relative z-10">
          <div className="max-w-2xl">
            <p className="font-sans text-[10px] tracking-[0.20em] uppercase text-mid mb-7 animate-fade-up font-bold" data-testid="hero-overline">
              MENTAL HEALTH QUANTIFIED
            </p>
            <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-bold text-charcoal mb-7 animate-fade-up stagger-1 leading-[1.0]">
              Support, not<br />
              <em className="font-normal italic gradient-text-warm">labels.</em><br />
              Clarity, not judgment.
            </h1>
            <p className="font-sans text-lg sm:text-xl text-mid leading-relaxed mb-8 animate-fade-up stagger-2 max-w-xl font-medium" style={{ fontWeight: 500 }}>
              Eunoia is where burned-out professionals find people who actually understand &mdash; because they have been there.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-5 animate-fade-up stagger-3 mb-7">
              <Link
                to="/signup"
                data-testid="cta-begin-checkin"
                className="inline-flex items-center gap-2 px-9 py-4 bg-charcoal text-white font-sans font-semibold text-base rounded-[20px] hover:-translate-y-[4px] hover:shadow-dramatic transition-all duration-300 no-underline"
                style={{ height: 56 }}
              >
                Begin your check-in
                <ArrowRight size={18} />
              </Link>
              <a
                href="#inside"
                data-testid="cta-how-it-works"
                className="inline-flex items-center gap-2 px-3 py-4 font-sans font-semibold text-base no-underline transition-colors"
                style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '5px', textDecorationThickness: '2px' }}
              >
                See how it works <ArrowDown size={16} />
              </a>
            </div>
            <p className="mt-6 font-sans text-base text-mid animate-fade-up stagger-4">
              Already have an account? <Link to="/signup" data-testid="cta-login" className="font-semibold no-underline" style={{ color: 'var(--accent)' }}>Sign in</Link>
            </p>
          </div>

          {/* Trust metrics */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl animate-fade-up stagger-5">
            {[
              { n: '6', l: 'clinical scales' },
              { n: '100%', l: 'anonymous' },
              { n: '0', l: 'ads, ever' },
              { n: 'Yours', l: 'the data' },
            ].map((m) => (
              <div key={`trust-${m.l}`}>
                <p className="font-serif text-3xl font-bold text-charcoal">{m.n}</p>
                <p className="font-sans text-xs text-mid uppercase tracking-wider mt-1">{m.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase Carousel */}
      <FeatureShowcaseCarousel />

      {/* Inside Eunoia — Mosaic preview */}
      <InsideEunoiaPreview />

      {/* Pillars */}
      <Pillars />

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-mid mb-2">Voices from the room</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal">People who have been there.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={`testimonial-${t.name}`}
                className={`soft-card soft-card-tint-${t.tint} p-7 animate-fade-up stagger-${i + 1}`}
                data-testid={`testimonial-${i}`}
              >
                <p className="font-serif text-[15px] italic text-charcoal leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="font-sans text-xs text-mid">
                  {t.name} &middot; {t.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — Concentric circles */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-mid mb-2">The architecture</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-charcoal mb-3">Three concentric layers.</h2>
            <p className="font-sans text-mid text-base">You, your reflection, your cohort. That is the whole design.</p>
          </div>
          <ConcentricCircles />
        </div>
      </section>

      {/* Evidence ribbon */}
      <section className="py-14 px-6 bg-charcoal">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-sans text-warm-white/70 text-sm mb-3">Built on clinical evidence</p>
          <p className="font-sans text-warm-white/40 text-xs leading-relaxed max-w-2xl mx-auto">
            PHQ-9 (Kroenke et al., 2001) &middot; GAD-7 (Spitzer et al., 2006) &middot; PSS-10 (Cohen, 1983) &middot; PSQI (Buysse, 1989) &middot; MBI-HSS (Maslach & Jackson, 1981) &middot; UCLA-3 (Hughes et al., 2004)
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-eunoia-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-sans text-xs text-mid leading-relaxed">
            Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment.
            Please consult a licensed clinician for care.
          </p>
          <div className="flex justify-center gap-4 mt-4 font-sans text-xs text-mid/60">
            <Link to="/settings/data" className="hover:text-charcoal no-underline">Data settings</Link>
            <span>&middot;</span>
            <Link to="/onboarding" className="hover:text-charcoal no-underline">Consent</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
