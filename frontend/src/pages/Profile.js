import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ArrowRight, RefreshCw } from 'lucide-react';

const barColors = {
  anxiety: '#E8A84C',
  stress: '#C0726A',
  loneliness: '#7B6FA5',
  burnout: '#1C1C1E',
};

function ScoreBar({ label, score, color, delay }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="mb-6" data-testid={`score-bar-${label.toLowerCase()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-sm font-medium text-charcoal">{label}</span>
        <span className="font-sans text-sm font-medium" style={{ color }}>{score}%</span>
      </div>
      <div className="w-full h-3 rounded-full bg-eunoia-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-[1200ms] ease-out"
          style={{
            width: animated ? `${score}%` : '0%',
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export default function Profile() {
  const { api } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api('get', '/profiles/me');
        setProfile(data.profile);
        setTimeout(() => setRevealed(true), 200);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [api]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-sans text-mid text-sm">Loading your Wellness Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center pt-16 px-4">
        <div className="text-center max-w-md">
          <h2 className="font-serif text-2xl text-charcoal mb-4">No profile yet</h2>
          <p className="font-sans text-mid text-sm mb-6">Complete your assessment or write 3 reflections to generate your Wellness Profile.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/assessment" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-charcoal text-white font-sans text-sm font-medium no-underline hover:-translate-y-[1px] transition-all">
              Take assessment <ArrowRight size={15} />
            </Link>
            <Link to="/companion" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-eunoia-border text-charcoal font-sans text-sm font-medium no-underline hover:-translate-y-[1px] transition-all">
              Start journaling <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16 px-4" data-testid="profile-page">
      <div className="max-w-2xl mx-auto">
        {/* Archetype */}
        {revealed && (
          <div className="text-center mb-12 animate-fade-up">
            <p className="font-sans text-xs text-accent font-medium tracking-wider uppercase mb-3">Your Wellness Profile</p>
            <h1
              className="font-serif text-3xl sm:text-4xl italic font-semibold mb-2"
              style={{ color: 'var(--accent)' }}
              data-testid="archetype-label"
            >
              {profile.archetype}
            </h1>
            <p className="font-sans text-xs text-mid">
              Generated {profile.source === 'reflections' ? 'from your reflections' : 'from your assessment'} &middot; {new Date(profile.generated_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Score bars */}
        {revealed && (
          <div className="bg-card-bg rounded-eunoia shadow-eunoia p-8 mb-8 animate-fade-up stagger-2">
            <ScoreBar label="Anxiety" score={profile.anxiety_score} color={barColors.anxiety} delay={150} />
            <ScoreBar label="Stress" score={profile.stress_score} color={barColors.stress} delay={300} />
            <ScoreBar label="Loneliness" score={profile.loneliness_score} color={barColors.loneliness} delay={450} />
            <ScoreBar label="Burnout" score={profile.burnout_score} color={barColors.burnout} delay={600} />
          </div>
        )}

        {/* Summary */}
        {revealed && (
          <div className="bg-card-bg rounded-eunoia shadow-eunoia p-8 mb-8 animate-fade-up stagger-3">
            <p className="font-serif text-base sm:text-lg italic text-charcoal leading-relaxed" data-testid="profile-summary">
              &ldquo;{profile.summary}&rdquo;
            </p>
          </div>
        )}

        {/* Recommendation */}
        {revealed && profile.recommended_forum_name && (
          <div className="bg-card-bg rounded-eunoia shadow-eunoia p-6 mb-8 border-2 border-accent/20 animate-fade-up stagger-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-charcoal">{profile.recommended_forum_name}</h3>
                <p className="font-sans text-sm text-mid">Peers who understand what you are going through</p>
              </div>
              <Link
                to={`/circles/${profile.recommended_forum_id}`}
                data-testid="join-circle-btn"
                className="px-5 py-2.5 rounded-full bg-charcoal text-white font-sans text-sm font-medium no-underline hover:-translate-y-[1px] transition-all flex items-center gap-1.5"
              >
                Join <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Citations */}
        {revealed && profile.citations && (
          <div className="bg-warm-white rounded-eunoia p-5 mb-8 border border-eunoia-border animate-fade-up stagger-5">
            <p className="font-sans text-[11px] text-mid leading-relaxed">
              <span className="font-medium text-charcoal">Clinical references: </span>
              {profile.citations.join(' | ')}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-rose/5 rounded-eunoia p-5 border border-rose/15 animate-fade-up stagger-6" data-testid="profile-disclaimer">
          <p className="font-sans text-xs text-charcoal leading-relaxed text-center">
            <span className="font-medium">Screening only \u2014 not a clinical diagnosis.</span> If this feels severe, talk to a professional or tap{' '}
            <span className="text-rose font-medium">Get Help Now</span> in the top right corner.
          </p>
          <p className="font-sans text-[10px] text-mid mt-2 text-center">
            Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment.
            Please consult a licensed clinician for care.
          </p>
        </div>
      </div>
    </div>
  );
}
