import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ArrowRight, RefreshCw } from 'lucide-react';

function RadarChart({ data, animated }) {
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 140;
  const levels = [0.25, 0.5, 0.75, 1];

  const axes = useMemo(() => data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    return { ...d, angle, x: Math.cos(angle), y: Math.sin(angle) };
  }), [data]);

  const getPoint = (axis, value) => ({
    x: cx + axis.x * maxR * (value / 100),
    y: cy + axis.y * maxR * (value / 100),
  });

  const polygonPoints = axes.map(a => {
    const p = getPoint(a, animated ? a.score : 0);
    return `${p.x},${p.y}`;
  }).join(' ');

  const hexPoints = (level) => axes.map(a => {
    const p = { x: cx + a.x * maxR * level, y: cy + a.y * maxR * level };
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} data-testid="radar-chart">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Grid hexagons */}
        {levels.map((l, i) => (
          <polygon key={`grid-${i}`} points={hexPoints(l)} fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.6" />
        ))}

        {/* Axis lines */}
        {axes.map((a, i) => (
          <line key={`axis-${i}`} x1={cx} y1={cy} x2={cx + a.x * maxR} y2={cy + a.y * maxR} stroke="var(--border)" strokeWidth="0.5" />
        ))}

        {/* Score polygon fill */}
        <polygon
          points={polygonPoints}
          fill="rgba(193, 123, 47, 0.18)"
          stroke="var(--accent)"
          strokeWidth="2"
          style={{ transition: 'all 1.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />

        {/* Axis dots */}
        {axes.map((a, i) => {
          const p = getPoint(a, animated ? a.score : 0);
          return (
            <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="5" fill="var(--accent)" stroke="white" strokeWidth="2"
              style={{ transition: `all 1.4s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.08}s` }}
            />
          );
        })}

        {/* Center glow */}
        <circle cx={cx} cy={cy} r="5" fill="var(--accent)" style={{ filter: 'drop-shadow(0 0 10px rgba(232,168,76,0.6))' }} />
      </svg>

      {/* Axis labels */}
      {axes.map((a, i) => {
        const labelR = maxR + 28;
        const lx = cx + a.x * labelR;
        const ly = cy + a.y * labelR;
        return (
          <div
            key={`label-${i}`}
            className="absolute font-sans text-[11px] text-mid whitespace-nowrap"
            style={{
              left: lx,
              top: ly,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="block text-center">{a.axis}</span>
            <span className="block text-center font-mono text-xs font-medium" style={{ color: 'var(--accent)' }}>{a.score}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Profile() {
  const { api } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [chartAnimated, setChartAnimated] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api('get', '/profiles/me');
        setProfile(data.profile);
        // Trigger reveal animation
        document.body.classList.add('revealing');
        setTimeout(() => {
          setRevealed(true);
          setChartAnimated(true);
          document.body.classList.remove('revealing');
          document.body.classList.add('revealed');
        }, 1200);
        setTimeout(() => document.body.classList.remove('revealed'), 2500);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      document.body.classList.remove('revealing', 'revealed');
    };
  }, [api]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-sans text-mid text-sm">Loading your Wellness Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 px-4">
        <div className="soft-card p-10 text-center max-w-md">
          <h2 className="font-serif text-2xl text-charcoal mb-4">No profile yet</h2>
          <p className="font-sans text-mid text-sm mb-6">Complete your assessment or write 3 reflections to generate your Wellness Profile.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/assessment" className="inline-flex items-center gap-2 px-6 py-3 rounded-[18px] bg-charcoal text-white font-sans text-sm font-medium no-underline hover:-translate-y-[1px] transition-all">
              Take assessment <ArrowRight size={15} />
            </Link>
            <Link to="/companion" className="inline-flex items-center gap-2 px-6 py-3 rounded-[18px] border border-eunoia-border text-charcoal font-sans text-sm font-medium no-underline hover:-translate-y-[1px] transition-all">
              Start journaling <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const radarData = [
    { axis: 'Anxiety', score: profile.anxiety_score || 0 },
    { axis: 'Stress', score: profile.stress_score || 0 },
    { axis: 'Burnout', score: profile.burnout_score || 0 },
    { axis: 'Exhaustion', score: profile.emotional_exhaustion_score || profile.burnout_score || 0 },
    { axis: 'Loneliness', score: profile.loneliness_score || 0 },
    { axis: 'Accomplishment', score: 100 - (profile.sleep_score || profile.burnout_score || 30) },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16 px-4" data-testid="profile-page">
      <div className="max-w-[720px] mx-auto">
        {/* Archetype */}
        {revealed && (
          <div className="text-center mb-10 animate-fade-up">
            <p className="font-sans text-xs text-mid mb-3">
              Based on your {profile.source === 'reflections' ? 'reflections' : 'assessment'} &middot; {new Date(profile.generated_at).toLocaleDateString()}
            </p>
            <h1
              className="font-serif text-3xl sm:text-4xl italic font-bold mb-1"
              style={{ color: 'var(--accent)' }}
              data-testid="archetype-label"
            >
              {profile.archetype}
            </h1>
          </div>
        )}

        {/* Radar Chart */}
        {revealed && (
          <div className="soft-card no-hover p-8 mb-8 animate-fade-up stagger-2">
            <RadarChart data={radarData} animated={chartAnimated} />
          </div>
        )}

        {/* Summary */}
        {revealed && (
          <div className="soft-card soft-card-tint-cream no-hover p-8 mb-8 animate-fade-up stagger-3">
            <p className="font-serif text-base sm:text-lg italic text-charcoal leading-[1.7] text-center" data-testid="profile-summary">
              &ldquo;{profile.summary}&rdquo;
            </p>
          </div>
        )}

        {/* Recommendation cards */}
        {revealed && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-up stagger-4">
            {profile.recommended_forum_name && (
              <Link
                to={`/circles/${profile.recommended_forum_id}`}
                data-testid="join-circle-btn"
                className="soft-card soft-card-tint-peach p-5 no-underline"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center"><Users size={18} className="text-accent" /></div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-charcoal">{profile.recommended_forum_name}</h3>
                    <p className="font-sans text-xs text-mid">Peers who understand</p>
                  </div>
                </div>
                <span className="font-sans text-xs text-accent font-medium">Join the circle &rarr;</span>
              </Link>
            )}
            <Link to="/hub" className="soft-card soft-card-tint-sage p-5 no-underline">
              <h3 className="font-serif text-base font-semibold text-charcoal mb-1">Wellness Hub</h3>
              <p className="font-sans text-xs text-mid mb-2">Evidence-based micro-practices</p>
              <span className="font-sans text-xs text-accent font-medium">Try a 2-minute practice &rarr;</span>
            </Link>
            <Link to="/assessment" className="soft-card soft-card-tint-lavender p-5 no-underline">
              <h3 className="font-serif text-base font-semibold text-charcoal mb-1">Retake Assessment</h3>
              <p className="font-sans text-xs text-mid mb-2">Track your progress over time</p>
              <span className="font-sans text-xs text-accent font-medium">Start again &rarr;</span>
            </Link>
          </div>
        )}

        {/* Citations */}
        {revealed && profile.citations && (
          <div className="bg-warm-white rounded-[18px] p-5 mb-6 border border-eunoia-border animate-fade-up stagger-5">
            <p className="font-sans text-[11px] text-mid leading-relaxed">
              <span className="font-medium text-charcoal">Clinical references: </span>
              {profile.citations.join(' | ')}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        {revealed && (
          <div className="border-t border-eunoia-border pt-5 animate-fade-up stagger-6" data-testid="profile-disclaimer">
            <p className="font-sans text-xs text-mid leading-relaxed text-center">
              Screening only &mdash; not a clinical diagnosis. If this feels severe, talk to a professional or tap{' '}
              <span className="text-rose font-medium">Get Help Now</span>.
            </p>
            <p className="font-sans text-[10px] text-mid/50 mt-2 text-center">
              Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
