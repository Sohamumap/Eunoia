import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Heart, Shield, Users, BarChart3 } from 'lucide-react';

const testimonials = [
  { text: "I tried three different apps. They all felt like talking to a mirror. Eunoia felt like walking into a room of people who actually get it.", name: "Resident_3847", role: "Internal Medicine" },
  { text: "The burnout report did not tell me anything I did not already know. But seeing it written down, with numbers, by something that read my own words \u2014 that made it real enough to act on.", name: "Intern_0933", role: "First-year Surgery" },
  { text: "I needed a place that would not diagnose me, would not sell me anything, and would not pretend to be my therapist. I just needed to know I was not the only one.", name: "Dr_1847", role: "Emergency Medicine PGY-3" }
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
      {/* Labels */}
      <div className="flex-1 space-y-10">
        {[
          { num: '01', title: 'Peer Circles', desc: 'Anonymous communities of people in the same trench. Moderated for safety, designed for solidarity.' },
          { num: '02', title: 'Quantified Reflection', desc: 'Validated clinical scales and free-form journaling. Your burnout, measured by your own words.' },
          { num: '03', title: 'Data Cooperative', desc: 'You own your data. Opt in to share anonymized insights and receive a share of commercial value.' },
        ].map((item, i) => (
          <div key={i} className={`flex gap-5 items-start ${visible ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: `${i * 0.15 + 0.3}s` }}>
            <span className="font-mono text-sm text-accent font-medium mt-1">{item.num}</span>
            <div>
              <h3 className="font-serif text-xl font-semibold text-charcoal mb-1">{item.title}</h3>
              <p className="font-sans text-sm text-mid leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Concentric rings SVG */}
      <div className="relative flex-shrink-0" style={{ width: 320, height: 320 }}>
        <svg viewBox="0 0 320 320" className="w-full h-full">
          {/* Radial grid lines */}
          {[0, 60, 120, 180, 240, 300].map(angle => (
            <line
              key={angle}
              x1="160" y1="160"
              x2={160 + 150 * Math.cos((angle * Math.PI) / 180)}
              y2={160 + 150 * Math.sin((angle * Math.PI) / 180)}
              stroke="var(--border)" strokeWidth="0.5" opacity="0.5"
            />
          ))}
          {/* Rings */}
          {rings.map((ring, i) => (
            <circle
              key={i}
              cx="160" cy="160" r={ring.size / 2}
              fill={i === 2 ? 'rgba(193, 123, 47, 0.08)' : i === 1 ? 'rgba(123, 111, 165, 0.04)' : 'none'}
              stroke={ring.color} strokeWidth={i === 2 ? 2 : 1}
              style={{
                transform: visible ? 'scale(1)' : 'scale(0)',
                transformOrigin: '160px 160px',
                transition: `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${ring.delay}`,
                opacity: visible ? 1 : 0,
              }}
            />
          ))}
          {/* Center glow */}
          <circle cx="160" cy="160" r="6" fill="var(--accent)" style={{ filter: 'drop-shadow(0 0 8px rgba(193,123,47,0.5))' }} />
        </svg>
        {/* Ring labels */}
        {rings.map((ring, i) => (
          <div
            key={`lbl-${i}`}
            className="absolute font-sans text-[10px] font-medium tracking-wider uppercase"
            style={{
              left: 160 + ring.size / 2 + 8,
              top: 160 - 6,
              color: ring.color,
              opacity: visible ? 1 : 0,
              transition: `opacity 0.5s ease ${parseFloat(ring.delay) + 0.5}s`,
            }}
          >
            {ring.desc}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream" data-testid="landing-page">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-md border-b border-eunoia-border">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <span className="font-serif text-xl italic" style={{ color: 'var(--accent)' }}>Eunoia</span>
          <Link
            to="/signup"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-sans font-medium text-white no-underline animate-pulse-crisis"
            style={{ backgroundColor: 'var(--rose)' }}
            data-testid="nav-get-help"
          >
            <Heart size={13} fill="white" /> Get Help Now
          </Link>
        </div>
      </nav>

      {/* Hero — Split layout */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Atmospheric image on right */}
        <div className="absolute right-0 top-0 w-[55%] h-full hidden lg:block pointer-events-none" style={{
          backgroundImage: 'url(/assets/bg-glow-figure.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.30,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, transparent 80%)',
        }} />

        <div className="max-w-6xl mx-auto px-6 w-full relative z-10">
          <div className="max-w-2xl">
            <p className="font-sans text-[11px] tracking-[0.12em] uppercase text-mid mb-6 animate-fade-up" data-testid="hero-overline" style={{ textTransform: 'uppercase' }}>
              PEER SUPPORT &middot; NOT AI THERAPY
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-charcoal mb-6 animate-fade-up stagger-1 leading-[1.08]">
              Support, not<br />
              <em className="font-normal italic" style={{ color: 'var(--accent)' }}>labels.</em><br />
              Clarity, not judgment.
            </h1>
            <p className="font-sans text-lg text-mid max-w-lg mb-10 animate-fade-up stagger-2 leading-relaxed" style={{ fontWeight: 300 }}>
              Eunoia is where burned-out professionals find people who actually understand &mdash; because they have been there.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4 animate-fade-up stagger-3">
              <Link
                to="/signup"
                data-testid="cta-begin-checkin"
                className="inline-flex items-center gap-2 px-8 py-4 bg-charcoal text-white font-sans font-medium text-base rounded-[18px] hover:-translate-y-[3px] hover:shadow-eunoia-hover transition-all duration-300 no-underline"
                style={{ height: 52 }}
              >
                Begin your check-in
                <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                data-testid="cta-how-it-works"
                className="inline-flex items-center gap-1.5 px-2 py-4 font-sans font-medium text-base no-underline transition-colors"
                style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '4px' }}
              >
                See how it works <ArrowDown size={16} />
              </a>
            </div>
            <p className="mt-5 font-sans text-sm text-mid animate-fade-up stagger-4">
              Already have an account? <Link to="/signup" data-testid="cta-login" className="font-medium no-underline" style={{ color: 'var(--accent)' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-warm-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`bg-card-bg rounded-[18px] p-7 border border-eunoia-border shadow-eunoia animate-fade-up stagger-${i + 1}`}
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
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-3">How it works.</h2>
            <p className="font-sans text-mid text-base">Three concentric layers. One platform.</p>
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
      <footer className="py-10 px-6 bg-cream border-t border-eunoia-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-sans text-xs text-mid leading-relaxed">
            Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment.
            Please consult a licensed clinician for care.
          </p>
          <div className="flex justify-center gap-4 mt-4 font-sans text-xs text-mid/50">
            <Link to="/settings/data" className="hover:text-charcoal no-underline text-mid/50">Data settings</Link>
            <span>&middot;</span>
            <Link to="/onboarding" className="hover:text-charcoal no-underline text-mid/50">Consent</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
