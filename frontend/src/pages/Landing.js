import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Heart, Wind, Activity, BookOpen, Shield, Users, Sparkles, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from '@/components/Logo';

const testimonials = [
  { text: "I tried three different apps. They all felt like talking to a mirror. Eunoia felt like walking into a room of people who actually get it.", name: "Resident_3847", role: "Internal Medicine", tint: "peach" },
  { text: "The burnout report did not tell me anything I did not already know. But seeing it written down, with numbers, by something that read my own words \u2014 that made it real enough to act on.", name: "Intern_0933", role: "First-year Surgery", tint: "sage" },
  { text: "I needed a place that would not diagnose me, would not sell me anything, and would not pretend to be my therapist. I just needed to know I was not the only one.", name: "Dr_1847", role: "Emergency Medicine PGY-3", tint: "lavender" }
];

/** Typewriter effect hook */
function useTypewriter(text, speed = 100) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    setDisplayText('');
    setIsComplete(false);

    const timer = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayText, isComplete };
}

/** Hero Headline with Typewriter Effect */
function HeroHeadline() {
  const { displayText: supportText, isComplete: supportComplete } = useTypewriter('Support', 120);
  const { displayText: clarityText, isComplete: clarityComplete } = useTypewriter('Clarity', 120);

  return (
    <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-bold text-charcoal mb-7 animate-fade-up stagger-1 leading-[1.0]">
      <span className="inline-block">
        {supportText}
        {!supportComplete && <span className="inline-block w-1 h-20 bg-accent ml-1 animate-pulse" style={{ verticalAlign: 'middle' }} />}
      </span>
      , not<br />
      <em className="font-normal italic gradient-text-warm">labels.</em><br />
      <span className="inline-block">
        {clarityText}
        {!clarityComplete && <span className="inline-block w-1 h-20 bg-accent ml-1 animate-pulse" style={{ verticalAlign: 'middle' }} />}
      </span>
      , not judgment.
    </h1>
  );
}

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
    { label: 'OWN', desc: 'Data Cooperative', color: 'var(--green)', size: 320, delay: '0.4s', glowColor: 'rgba(127, 184, 143, 0.3)' },
    { label: 'REFLECT', desc: 'Quantified Reflection', color: 'var(--lavender)', size: 240, delay: '0.2s', glowColor: 'rgba(123, 111, 165, 0.25)' },
    { label: 'PEER', desc: 'Peer Circles', color: 'var(--accent)', size: 150, delay: '0s', glowColor: 'rgba(193, 123, 47, 0.3)' },
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

      {/* Glassmorphism Concentric Circles */}
      <div className="relative flex-shrink-0" style={{ width: 400, height: 400 }}>
        {/* Large radial glow background - enhanced */}
        <div 
          className="absolute"
          style={{
            top: '-20%',
            left: '-20%',
            width: '140%',
            height: '140%',
            background: 'radial-gradient(circle at center, rgba(127, 184, 143, 0.25), rgba(123, 111, 165, 0.15) 35%, rgba(193, 123, 47, 0.08) 55%, transparent 75%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        
        <svg viewBox="0 0 400 400" className="w-full h-full relative z-10">
          {/* Subtle radial grid lines */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <line
              key={angle}
              x1="200" y1="200"
              x2={200 + 180 * Math.cos((angle * Math.PI) / 180)}
              y2={200 + 180 * Math.sin((angle * Math.PI) / 180)}
              stroke="rgba(193, 123, 47, 0.1)" strokeWidth="0.5" opacity="0.6"
            />
          ))}
          
          {/* Glassmorphism Circles */}
          {rings.map((ring, i) => (
            <g key={`ring-glass-${ring.size}-${ring.color}`}>
              {/* Outer glow */}
              <circle
                cx="200" cy="200" r={ring.size / 2}
                fill="none"
                stroke={ring.glowColor}
                strokeWidth={i === 0 ? 35 : i === 1 ? 30 : 25}
                opacity={visible ? (i === 0 ? 0.5 : i === 1 ? 0.45 : 0.4) : 0}
                filter="blur(18px)"
                style={{
                  transform: visible ? 'scale(1)' : 'scale(0.5)',
                  transformOrigin: '200px 200px',
                  transition: `all 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${ring.delay}`,
                }}
              />
              
              {/* Frosted glass circle */}
              <circle
                cx="200" cy="200" r={ring.size / 2}
                fill={i === 0 ? 'rgba(127, 184, 143, 0.12)' : i === 1 ? 'rgba(123, 111, 165, 0.1)' : 'rgba(193, 123, 47, 0.15)'}
                stroke={ring.color}
                strokeWidth={i === 0 ? 2.5 : 2}
                style={{
                  transform: visible ? 'scale(1)' : 'scale(0.5)',
                  transformOrigin: '200px 200px',
                  transition: `transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${ring.delay}, opacity 0.6s ease ${ring.delay}`,
                  opacity: visible ? 0.95 : 0,
                  filter: 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.1))',
                }}
              />
              
              {/* Inner highlight for glass effect */}
              <circle
                cx="200" cy="200" r={ring.size / 2 - 2}
                fill="none"
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="1.5"
                opacity={visible ? 0.6 : 0}
                style={{
                  transform: visible ? 'scale(1)' : 'scale(0.5)',
                  transformOrigin: '200px 200px',
                  transition: `all 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${ring.delay}`,
                }}
              />
            </g>
          ))}
          
          {/* Center dot with enhanced glow */}
          <circle 
            cx="200" cy="200" r="9" 
            fill="var(--accent)"
            style={{ 
              filter: 'drop-shadow(0 0 15px rgba(193, 123, 47, 0.8)) drop-shadow(0 0 30px rgba(193, 123, 47, 0.5))',
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.6s ease 0.6s',
            }} 
          />
        </svg>
        
        {/* Labels with enhanced glassmorphism */}
        {rings.map((ring, i) => (
          <div
            key={`ring-label-${ring.label}`}
            className={`absolute font-mono text-[11px] tracking-widest font-bold ${visible ? 'animate-fade-in' : 'opacity-0'}`}
            style={{
              color: ring.color,
              top: 200 - ring.size / 2 - 20, 
              left: '50%', 
              transform: 'translateX(-50%)',
              animationDelay: `${parseFloat(ring.delay) + 0.6}s`,
              textShadow: `0 0 12px ${ring.glowColor}, 0 0 24px ${ring.glowColor}, 0 2px 4px rgba(0, 0, 0, 0.1)`,
            }}
          >
            {ring.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Feature slides data - defined outside component to prevent recreation on every render
const CAROUSEL_FEATURES = [
  {
    title: 'Find your cohort',
    description: "Anonymous circles for the specific kind of hard you're carrying.",
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
  {
    title: 'Private Messages',
    description: 'Safe, anonymous conversations with peers who understand your journey.',
    image: 'https://customer-assets.emergentagent.com/job_proto-feature-fix/artifacts/8asisrte_Screenshot%202026-04-17%20060640.png',
  },
  {
    title: 'Community Activity',
    description: 'Connect with others through shared experiences and peer support.',
    image: 'https://customer-assets.emergentagent.com/job_proto-feature-fix/artifacts/qpqi7mgw_Screenshot%202026-04-17%20060657.png',
  },
  {
    title: 'Your Dashboard',
    description: 'Your quiet corner. Track burnout, check in daily, and find your breath.',
    image: 'https://customer-assets.emergentagent.com/job_proto-feature-fix/artifacts/e4fhh2fe_Screenshot%202026-04-17%20061627.png',
  },
];

/** Feature Showcase Carousel — inspired by provided screenshots */
function FeatureShowcaseCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Auto-advance every 7 seconds
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % CAROUSEL_FEATURES.length);
      }, 7000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + CAROUSEL_FEATURES.length) % CAROUSEL_FEATURES.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_FEATURES.length);
  };

  return (
    <section className="py-24 px-6 relative" id="showcase">
      {/* Subtle background glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(127, 184, 143, 0.05), transparent 70%)',
        }}
      />
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Top pill badge with glassmorphism */}
        <div className="flex justify-center mb-6">
          <span 
            className="inline-block px-5 py-2 rounded-full font-sans text-[11px] uppercase tracking-[0.14em] font-medium"
            style={{
              background: 'rgba(44, 42, 41, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: 'white',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            Inside Eunoia
          </span>
        </div>

        {/* Serif headline */}
        <h2 className="font-serif text-4xl sm:text-5xl text-charcoal text-center mb-12 leading-tight">
          {CAROUSEL_FEATURES[currentIndex].title}
        </h2>
        <p className="font-sans text-base text-mid text-center max-w-2xl mx-auto mb-10">
          {CAROUSEL_FEATURES[currentIndex].description}
        </p>

        {/* Carousel container */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Large image preview with glassmorphism effect */}
          <div 
            className="relative overflow-hidden rounded-3xl p-0" 
            style={{ 
              minHeight: '500px',
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
            }}
          >
            {/* Subtle gradient overlay for depth */}
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{
                background: 'radial-gradient(circle at top left, rgba(127, 184, 143, 0.08), transparent 50%), radial-gradient(circle at bottom right, rgba(193, 123, 47, 0.08), transparent 50%)',
              }}
            />
            
            {/* Image container */}
            <div className="relative p-4">
              <img
                src={CAROUSEL_FEATURES[currentIndex].image}
                alt={CAROUSEL_FEATURES[currentIndex].title}
                className="w-full h-full object-contain rounded-2xl"
                style={{ 
                  maxHeight: '600px',
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))',
                }}
              />
            </div>
          </div>

          {/* Left chevron with glassmorphism */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
            }}
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} className="text-charcoal" />
          </button>

          {/* Right chevron with glassmorphism */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
            }}
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="text-charcoal" />
          </button>
        </div>

        {/* Bottom tab pills with glassmorphism */}
        <div className="flex justify-center gap-3 mt-10">
          {CAROUSEL_FEATURES.map((_, index) => (
            <button
              key={`carousel-tab-${index}`}
              onClick={() => goToSlide(index)}
              className={`rounded-full transition-all ${
                index === currentIndex
                  ? 'h-3 w-10'
                  : 'h-3 w-3 hover:w-5'
              }`}
              style={
                index === currentIndex
                  ? {
                      background: 'linear-gradient(135deg, rgba(193, 123, 47, 0.9), rgba(232, 168, 76, 0.9))',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(193, 123, 47, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }
                  : {
                      background: 'rgba(193, 123, 47, 0.2)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(193, 123, 47, 0.15)',
                    }
              }
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
    { icon: Moon, title: 'Burnout Watch', desc: 'A gentle calendar that shows the patterns your body already knew.', tint: 'sky' },
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
            <HeroHeadline />
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
