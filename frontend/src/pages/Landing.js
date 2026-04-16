import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, BarChart3 } from 'lucide-react';

const testimonials = [
  {
    text: "I tried three different apps. They all felt like talking to a mirror. Eunoia felt like walking into a room of people who actually get it.",
    name: "Resident_3847",
    role: "2nd-year Internal Medicine"
  },
  {
    text: "The burnout report did not tell me anything I did not already know. But seeing it written down, with numbers, by something that read my own words \u2014 that made it real enough to act on.",
    name: "Intern_0933",
    role: "First-year Surgery"
  },
  {
    text: "I needed a place that would not diagnose me, would not sell me anything, and would not pretend to be my therapist. I just needed to know I was not the only one.",
    name: "Dr_1847",
    role: "Emergency Medicine PGY-3"
  }
];

const features = [
  {
    icon: Shield,
    title: "Anonymous by design",
    desc: "No real names. No profiles. No social graph. Just honest humans behind anonymous handles."
  },
  {
    icon: BarChart3,
    title: "Quantified, not diagnosed",
    desc: "Validated clinical scales (PHQ-9, GAD-7, MBI) generate your Wellness Profile. Screening, never diagnosis."
  },
  {
    icon: Users,
    title: "Peers, not algorithms",
    desc: "Join circles of people in the same trench. Moderated for safety, designed for solidarity."
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream" data-testid="landing-page">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-charcoal mb-6 animate-fade-up leading-[1.1]">
            Support, not <em className="text-accent font-normal" style={{ fontStyle: 'italic' }}>labels.</em>
            <br />
            Clarity, not judgment.
          </h1>
          <p className="font-sans text-lg sm:text-xl text-mid max-w-xl mx-auto mb-10 animate-fade-up stagger-2 leading-relaxed">
            The anti-AI-therapy platform. Burned-out humans healing each other in anonymous peer circles,
            with clinically-validated screening you actually own.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
            <Link
              to="/signup"
              data-testid="cta-begin-checkin"
              className="inline-flex items-center gap-2 px-8 py-4 bg-charcoal text-white font-sans font-medium text-base rounded-full hover:-translate-y-[2px] hover:shadow-eunoia-hover transition-all duration-300 no-underline"
            >
              Begin your check-in
              <ArrowRight size={18} />
            </Link>
            <a
              href="#how-it-works"
              data-testid="cta-how-it-works"
              className="inline-flex items-center gap-1.5 px-6 py-4 text-mid font-sans font-medium text-base hover:text-charcoal transition-colors no-underline"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 font-sans text-sm text-mid animate-fade-up stagger-4">
            Already have an account? <Link to="/signup" data-testid="cta-login" className="text-accent font-medium hover:underline no-underline">Sign in</Link>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl text-charcoal text-center mb-16">
            Not another wellness app.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className={`bg-card-bg rounded-eunoia p-8 shadow-eunoia hover:-translate-y-[3px] hover:shadow-eunoia-hover transition-all duration-300 animate-fade-up stagger-${i + 1}`}
                data-testid={`feature-card-${i}`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(193,123,47,0.08)' }}>
                  <f.icon size={22} className="text-accent" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">{f.title}</h3>
                <p className="font-sans text-mid text-[15px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-warm-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl text-charcoal text-center mb-16">
            From people like you.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`bg-card-bg rounded-eunoia p-8 shadow-eunoia border border-eunoia-border animate-fade-up stagger-${i + 1}`}
                data-testid={`testimonial-${i}`}
              >
                <p className="font-serif text-[15px] italic text-charcoal leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <div className="font-sans text-sm font-medium text-charcoal">{t.name}</div>
                  <div className="font-sans text-xs text-mid">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence ribbon */}
      <section className="py-16 px-4 bg-charcoal">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-sans text-warm-white/70 text-sm mb-4">Built on clinical evidence</p>
          <p className="font-sans text-warm-white/50 text-xs leading-relaxed max-w-2xl mx-auto">
            PHQ-9 (Kroenke et al., 2001) &middot; GAD-7 (Spitzer et al., 2006) &middot; MBI-HSS (Maslach & Jackson, 1981)
            &middot; UCLA-3 (Hughes et al., 2004) &middot; 75% of residents report burnout (Rotenstein et al., JAMA 2018)
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-cream border-t border-eunoia-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-sans text-xs text-mid leading-relaxed">
            Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment.
            Please consult a licensed clinician for care.
          </p>
          <p className="font-sans text-xs text-mid/50 mt-4">&copy; 2026 Eunoia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
