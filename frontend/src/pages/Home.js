import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SoftCard from '@/components/SoftCard';
import { MOODS } from '@/components/MoodSelector';
import MoodCalendar from '@/components/MoodCalendar';
import BurnoutTracker from '@/components/BurnoutTracker';
import { SkeletonCard, SkeletonLine } from '@/components/Skeleton';
import { Wind, ArrowUpRight, Users, Flame, BookOpen, Shield, Sparkles, Moon, Activity } from 'lucide-react';

const MOOD_META = MOODS.reduce((a, m) => ({ ...a, [m.key]: m }), {});

function StatRing({ value, max = 100, color = 'var(--accent)', label, sub, size = 112 }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  
  return (
    <div 
      className="relative inline-flex flex-col items-center justify-center group cursor-pointer" 
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 transition-transform group-hover:scale-105 duration-300">
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={r} 
          fill="none" 
          stroke="rgba(232,228,222,0.7)" 
          strokeWidth="6" 
        />
        <circle
          cx={size / 2} 
          cy={size / 2} 
          r={r} 
          fill="none" 
          stroke={color} 
          strokeWidth="6" 
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          style={{ 
            transition: 'stroke-dasharray 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: 'drop-shadow(0 0 8px rgba(232,168,76,0.3))'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-xl font-bold text-charcoal group-hover:scale-110 transition-transform">{label}</span>
        {sub && <span className="font-sans text-[10px] text-mid">{sub}</span>}
      </div>
      {/* Hover glow effect */}
      <div 
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          filter: 'blur(10px)'
        }}
      />
    </div>
  );
}

function greetingForHour(hour, name) {
  const first = (name || 'friend').split('_')[0];
  if (hour < 5) return `Still up, ${first}?`;
  if (hour < 12) return `Good morning, ${first}.`;
  if (hour < 17) return `Good afternoon, ${first}.`;
  if (hour < 21) return `Good evening, ${first}.`;
  return `Winding down, ${first}?`;
}

export default function Home() {
  const { api, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api('get', '/dashboard/summary');
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const greeting = greetingForHour(new Date().getHours(), user?.display_name);
  const subline = "Here is your quiet corner. Nothing urgent, nothing forced.";

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4" data-testid="home-page-loading">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <SkeletonLine width="40%" height={36} />
            <div className="h-3" />
            <SkeletonLine width="55%" height={16} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
            <SkeletonCard className="md:col-span-3" height={260} />
            <SkeletonCard className="md:col-span-3" height={260} />
            <SkeletonCard className="md:col-span-2" height={180} />
            <SkeletonCard className="md:col-span-2" height={180} />
            <SkeletonCard className="md:col-span-2" height={180} />
          </div>
        </div>
      </div>
    );
  }

  const p = summary?.profile;
  const moodToday = summary?.mood_today;
  const moodMeta = moodToday ? MOOD_META[moodToday.mood] : null;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4" data-testid="home-page">
      <div className="max-w-6xl mx-auto">
        {/* Greeting - Orchestrated entry */}
        <div className="mb-12 animate-fade-up">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-mid mb-3 font-semibold">Your Eunoia</p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-charcoal mb-3 leading-[1.02]">
            {greeting}
          </h1>
          <p className="font-sans text-mid text-lg font-medium">{subline}</p>
        </div>

        {/* Mosaic grid - Orchestrated staggered reveal */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">

          {/* BURNOUT TRACKER — hero tile, weekly trend (Sun → Sat) */}
          <SoftCard
            tint="sunset"
            className="md:col-span-3 md:row-span-2 relative overflow-hidden animate-scale-in stagger-1 hover-lift flex flex-col"
            padding="p-7"
            data-testid="tile-burnout-tracker"
          >
            {/* Decorative blobs — reference-style warm gradient atmosphere */}
            <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full animate-slow-pulse pointer-events-none" style={{
              position: 'absolute',
              background: 'radial-gradient(circle, rgba(232,168,76,0.55) 0%, rgba(245,166,35,0.25) 45%, transparent 75%)',
              filter: 'blur(14px)',
            }} />
            <div className="absolute -bottom-20 -left-8 w-56 h-56 rounded-full pointer-events-none" style={{
              position: 'absolute',
              background: 'radial-gradient(circle, rgba(192,114,106,0.35) 0%, rgba(212,146,90,0.15) 50%, transparent 80%)',
              filter: 'blur(18px)',
            }} />
            <BurnoutTracker />
          </SoftCard>

          {/* STATE SNAPSHOT — control-panel style */}
          <SoftCard tint="white" className="md:col-span-3 animate-slide-in-right stagger-2" padding="p-7" data-testid="tile-state">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid">State</p>
                <h3 className="font-serif text-2xl font-semibold text-charcoal">Where you are</h3>
              </div>
              {p && (
                <Link to="/profile" className="flex items-center gap-1 text-[12px] text-accent font-medium no-underline">
                  Full profile <ArrowUpRight size={13} />
                </Link>
              )}
            </div>

            {p ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center">
                  <StatRing value={100 - (p.burnout_score || 0)} color="#E8A84C" label={String(100 - (p.burnout_score || 0))} sub="Capacity" />
                  <span className="font-sans text-[11px] text-mid mt-1">Calm score</span>
                </div>
                <div className="flex flex-col items-center">
                  <StatRing value={100 - (p.sleep_score || 0)} color="#7B6FA5" label={String(100 - (p.sleep_score || 0))} sub="Rest" />
                  <span className="font-sans text-[11px] text-mid mt-1">Sleep quality</span>
                </div>
                <div className="flex flex-col items-center">
                  <StatRing value={summary.streak * 10} max={100} color="#7FB88F" label={String(summary.streak)} sub="days" />
                  <span className="font-sans text-[11px] text-mid mt-1">Reflecting Consistency</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="font-sans text-sm text-mid mb-3">Take a short assessment to reveal your state snapshot.</p>
                <Link to="/assessment" className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-charcoal text-white text-xs font-medium no-underline">
                  Begin <ArrowUpRight size={12} />
                </Link>
              </div>
            )}

            {p && (
              <div className="mt-4 pt-4 border-t border-eunoia-border">
                <p className="font-sans text-[11px] text-mid mb-1">Archetype</p>
                <p className="font-serif text-lg italic" style={{ color: 'var(--accent)' }}>{p.archetype}</p>
              </div>
            )}
          </SoftCard>

          {/* BREATHE CTA — Enhanced with glassmorphic effects */}
          <SoftCard tint="dusk" className="md:col-span-3 flex items-center group animate-slide-in-left stagger-3 hover-lift" padding="p-8" data-testid="tile-breathe">
            <div className="flex items-center gap-5 w-full">
              <div className="relative flex-shrink-0 w-20 h-20 group-hover:scale-110 transition-transform duration-500">
                {/* Pulsing glow rings */}
                <div className="absolute inset-0 rounded-full animate-breathe" style={{
                  background: 'radial-gradient(circle at 35% 30%, #FFE2C7 0%, #E8A84C 50%, #C17B2F 100%)',
                  boxShadow: '0 0 40px -5px rgba(232,168,76,0.6)',
                }} />
                <div className="absolute inset-0 rounded-full animate-breathe opacity-50" style={{
                  background: 'radial-gradient(circle at 35% 30%, #FFE2C7 0%, transparent 70%)',
                  animationDelay: '0.5s',
                  filter: 'blur(8px)'
                }} />
              </div>
              <div className="flex-1 text-white">
                <p className="font-sans text-[11px] uppercase tracking-[0.14em] opacity-70 mb-1">Two minutes</p>
                <h3 className="font-serif text-2xl font-semibold mb-1 group-hover:translate-x-1 transition-transform">Breathe.</h3>
                <p className="font-sans text-sm opacity-85 leading-relaxed">A guided 4-7-8 orb. Reset your nervous system.</p>
                <Link to="/hub" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium no-underline hover:bg-white/30 hover:gap-2 transition-all duration-200">
                  <Wind size={13} className="group-hover:rotate-12 transition-transform" /> Begin practice
                </Link>
              </div>
            </div>
          </SoftCard>

          {/* JOURNEY NUMBERS - Enhanced with hover effects */}
          <SoftCard tint="sage" className="md:col-span-2 group animate-scale-in stagger-4 hover-lift" padding="p-7" data-testid="tile-journey">
            <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid mb-3">Your journey</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sage/20">
                    <BookOpen size={14} className="text-sage" />
                  </div>
                  <span className="font-sans text-sm text-charcoal">Reflections</span>
                </div>
                <span className="font-serif text-xl font-semibold text-charcoal">{summary.reflection_count}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sage/20">
                    <Activity size={14} className="text-sage" />
                  </div>
                  <span className="font-sans text-sm text-charcoal">Assessments</span>
                </div>
                <span className="font-serif text-xl font-semibold text-charcoal">{summary.assessment_count}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-accent/20 animate-pulse-subtle">
                    <Flame size={14} className="text-accent" />
                  </div>
                  <span className="font-sans text-sm text-charcoal">Streak</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-xl font-semibold text-charcoal">{summary.streak}</span>
                  <span className="text-xs text-mid">days</span>
                </div>
              </div>
            </div>
            <Link to="/companion" className="inline-flex items-center gap-1 mt-4 text-[12px] text-accent font-medium no-underline hover:gap-2 transition-all">
              Write a reflection <ArrowUpRight size={12} />
            </Link>
          </SoftCard>

          {/* CIRCLES PREVIEW - Enhanced with hover effects */}
          <SoftCard tint="peach" className="md:col-span-4 animate-scale-in stagger-5" padding="p-7" data-testid="tile-circles">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid">Peer circles</p>
                <h3 className="font-serif text-2xl font-semibold text-charcoal">People who get it</h3>
              </div>
              <Link to="/circles" className="flex items-center gap-1 text-[12px] text-accent font-medium no-underline hover:gap-2 transition-all">
                Browse all <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="space-y-2">
              {(summary.recent_posts || []).slice(0, 3).map((post, i) => (
                <Link
                  key={post.id || `recent-${post.forum_id}-${i}`}
                  to={`/circles/${post.forum_id}`}
                  className="block p-3 rounded-xl bg-white/60 hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 no-underline group"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-sans text-xs text-accent font-medium mb-0.5 group-hover:translate-x-0.5 transition-transform">{post.forum_name}</p>
                      <p className="font-sans text-[13px] text-charcoal leading-snug line-clamp-2">{post.body}</p>
                      <p className="font-sans text-[10px] text-mid mt-1">{post.display_name}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-mid opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </Link>
              ))}
              {(!summary.recent_posts || summary.recent_posts.length === 0) && (
                <div className="text-center py-6">
                  <Users size={32} className="mx-auto mb-2 text-mid opacity-50" />
                  <p className="font-sans text-xs text-mid italic">Circles are quiet right now. Be the first.</p>
                </div>
              )}
            </div>
          </SoftCard>

          {/* MOOD CALENDAR — full-width row */}
          <SoftCard tint="white" className="md:col-span-6 animate-fade-up stagger-6" padding="p-8" data-testid="tile-calendar">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid">Last 13 weeks</p>
                <h3 className="font-serif text-2xl font-semibold text-charcoal">Emotion tracking</h3>
                <p className="font-sans text-sm text-mid mt-1">Each dot is a day. Each color, a mood. Patterns emerge.</p>
              </div>
              <Sparkles size={20} className="text-accent" />
            </div>
            <MoodCalendar days={91} />
          </SoftCard>

          {/* CONSENT / DATA */}
          <SoftCard tint="lavender" className="md:col-span-3 animate-slide-in-left stagger-7" padding="p-7" data-testid="tile-consent">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-lavender/15">
                <Shield size={18} className="text-lavender" />
              </div>
              <div className="flex-1">
                <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid">Your data</p>
                <h3 className="font-serif text-lg font-semibold text-charcoal mb-1">You are in control.</h3>
                <p className="font-sans text-xs text-mid leading-relaxed mb-3">
                  Manage what is shared, download everything, or delete your account at any time.
                </p>
                <Link to="/settings/data" className="inline-flex items-center gap-1 text-[12px] text-lavender font-medium no-underline">
                  Data settings <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </SoftCard>

          {/* SLEEP / REST */}
          <SoftCard tint="sky" className="md:col-span-3 animate-slide-in-right stagger-8" padding="p-7" data-testid="tile-rest">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-eunoia-blue/15">
                <Moon size={18} className="text-eunoia-blue" />
              </div>
              <div className="flex-1">
                <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid">Gentle nudge</p>
                <h3 className="font-serif text-lg font-semibold text-charcoal mb-1">
                  {moodMeta ? `Felt ${moodMeta.label.toLowerCase()} today?` : 'Feeling the weight?'}
                </h3>
                <p className="font-sans text-xs text-mid leading-relaxed mb-3">
                  {moodMeta && moodMeta.key === 'depleted' && 'A 5-minute grounding practice can help your body remember rest.'}
                  {moodMeta && moodMeta.key === 'heavy' && 'Writing it down doesn&apos;t fix it — but it makes it smaller. Try a reflection.'}
                  {moodMeta && (moodMeta.key === 'tender' || moodMeta.key === 'steady') && 'You might enjoy a quiet 2-minute breathing pause.'}
                  {moodMeta && moodMeta.key === 'radiant' && 'Hold onto this. Jot one sentence about what helped today.'}
                  {!moodMeta && 'The Wellness Hub has 3 evidence-based micro-practices, each under 2 minutes.'}
                </p>
                <Link
                  to={moodMeta?.key === 'heavy' || moodMeta?.key === 'radiant' ? '/companion' : '/hub'}
                  className="inline-flex items-center gap-1 text-[12px] text-eunoia-blue font-medium no-underline"
                >
                  {moodMeta?.key === 'heavy' || moodMeta?.key === 'radiant' ? 'Write one line' : 'Try a practice'}
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </SoftCard>
        </div>

        {/* Footer disclaimer */}
        <p className="mt-10 text-center font-sans text-xs text-mid leading-relaxed max-w-2xl mx-auto">
          Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment.
          Please consult a licensed clinician for care.
        </p>
      </div>
    </div>
  );
}
