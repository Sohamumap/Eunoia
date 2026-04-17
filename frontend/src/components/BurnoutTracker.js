import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceDot, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Flame, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * BurnoutTracker
 * Weekly burnout trend (Sun → Sat) with warm gradient area chart.
 * Replaces the mood check-in tile on /home.
 *
 * Data source: GET /api/burnout/weekly
 */

const TREND_META = {
  up:   { label: 'rising',     color: '#C0726A', icon: TrendingUp,   help: 'Your burnout is higher than last week. Gentle steps help.' },
  down: { label: 'easing',     color: '#7FB88F', icon: TrendingDown, help: 'Your burnout is easing compared to last week. Keep tending.' },
  flat: { label: 'holding',    color: '#E8A84C', icon: Minus,        help: 'Your burnout is steady this week.' },
};

const CATEGORY_META = {
  low:      { label: 'low',      color: '#7FB88F', band: 'rgba(127,184,143,0.15)' },
  moderate: { label: 'moderate', color: '#E8A84C', band: 'rgba(232,168,76,0.15)' },
  elevated: { label: 'elevated', color: '#D4925A', band: 'rgba(212,146,90,0.18)' },
  high:     { label: 'high',     color: '#C0726A', band: 'rgba(192,114,106,0.22)' },
  unknown:  { label: '—',        color: '#7F7A6E', band: 'rgba(127,122,110,0.10)' },
};

// Chart styling constants — hoisted out of render so they don't cause AreaChart to re-diff props every tick.
const CHART_MARGIN = { top: 10, right: 10, left: 0, bottom: 0 };
const CHART_TICKS_Y = [0, 25, 50, 75, 100];
const CHART_DOMAIN_Y = [0, 100];
const AXIS_TICK_STYLE = { fill: '#7F7A6E', fontSize: 11, fontFamily: 'DM Sans' };
const AXIS_TICK_STYLE_Y = { fill: '#7F7A6E', fontSize: 10, fontFamily: 'DM Sans' };
const GRID_STROKE_DASH = '3 4';
const TOOLTIP_CURSOR = { stroke: '#C0726A', strokeWidth: 1, strokeDasharray: '4 4' };
const AREA_ACTIVE_DOT = { r: 6, fill: '#C0726A', stroke: '#fff', strokeWidth: 2 };
const AREA_DOT = { r: 3.5, fill: '#E8A84C', stroke: '#fff', strokeWidth: 1.5 };

function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg bg-charcoal text-white px-3 py-2 shadow-lg font-sans">
      <p className="text-[11px] uppercase tracking-wide opacity-70">{d.day} · {d.date}</p>
      <p className="text-base font-bold mt-0.5">
        {d.score != null ? `${d.score}` : '—'}
        <span className="text-xs font-normal opacity-70 ml-1">burnout</span>
      </p>
      {d.mood && <p className="text-[11px] opacity-80 capitalize mt-0.5">Mood: {d.mood}</p>}
    </div>
  );
}

export default function BurnoutTracker() {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: res } = await api('get', '/burnout/weekly');
      setData(res);
    } catch (e) {
      console.error('burnout/weekly failed', e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[320px]">
        <div className="animate-pulse text-mid text-sm font-sans">Loading burnout trend…</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center min-h-[320px] text-mid text-sm font-sans">
        Could not load burnout data.
      </div>
    );
  }

  const trend = TREND_META[data.trend] || TREND_META.flat;
  const TrendIcon = trend.icon;
  const cat = CATEGORY_META[data.category] || CATEGORY_META.unknown;
  const todayIdx = data.today_index;

  // Chart data: use display_score (interpolated where missing, null for future)
  const chartData = data.days.map((d) => ({
    day: d.day,
    date: d.date,
    score: d.display_score,
    raw_score: d.score,
    has_data: d.has_data,
    mood: d.mood,
    is_future: d.is_future,
  }));

  const todayPoint = todayIdx != null ? chartData[todayIdx] : null;

  return (
    <div className="relative flex flex-col flex-1 min-h-[440px]" data-testid="burnout-tracker">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-mid mb-1.5 font-semibold flex items-center gap-1.5">
            <Flame size={11} className="text-rose" />
            Burnout Tracker · This Week
          </p>
          <h3 className="font-serif text-[26px] font-bold text-charcoal leading-[1.05]">
            {data.latest_score != null ? data.latest_score : '—'}
            <span className="font-sans text-xs font-medium text-mid ml-2 align-middle">
              / 100
            </span>
          </h3>
          <p className="font-sans text-sm text-mid mt-0.5">
            <span style={{ color: cat.color }} className="font-medium capitalize">
              {cat.label}
            </span>
            {data.latest_day && (
              <span className="text-mid/70"> · as of {data.latest_day}</span>
            )}
          </p>
        </div>

        {/* Trend pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-[11px] font-medium"
          style={{ background: `${trend.color}18`, color: trend.color }}
          data-testid="burnout-trend-pill"
        >
          <TrendIcon size={13} />
          {data.trend === 'flat' ? 'Holding steady' : data.trend === 'up' ? `+${data.delta} vs last wk` : `${data.delta} vs last wk`}
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 -mx-2 relative z-10" style={{ minHeight: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={CHART_MARGIN}>
            <defs>
              <linearGradient id="burnoutFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8A84C" stopOpacity={0.55} />
                <stop offset="55%" stopColor="#D4925A" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#C0726A" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="burnoutStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"  stopColor="#E8A84C" />
                <stop offset="60%" stopColor="#D4925A" />
                <stop offset="100%" stopColor="#C0726A" />
              </linearGradient>
              <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.6" />
              </filter>
            </defs>

            <CartesianGrid stroke="rgba(63,58,52,0.06)" strokeDasharray={GRID_STROKE_DASH} vertical={false} />
            <XAxis
              dataKey="day"
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              dy={4}
            />
            <YAxis
              domain={CHART_DOMAIN_Y}
              ticks={CHART_TICKS_Y}
              tick={AXIS_TICK_STYLE_Y}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<ChartTooltip />} cursor={TOOLTIP_CURSOR} />

            <Area
              type="natural"
              dataKey="score"
              stroke="url(#burnoutStroke)"
              strokeWidth={2.4}
              fill="url(#burnoutFill)"
              filter="url(#softBlur)"
              connectNulls={false}
              activeDot={AREA_ACTIVE_DOT}
              dot={AREA_DOT}
              isAnimationActive
              animationDuration={900}
            />

            {todayPoint && todayPoint.score != null && (
              <ReferenceDot
                x={todayPoint.day}
                y={todayPoint.score}
                r={7}
                fill="#C0726A"
                stroke="#fff"
                strokeWidth={2.5}
                ifOverflow="extendDomain"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer — legend + summary */}
      <div className="mt-3 pt-3 border-t border-eunoia-border/60 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'linear-gradient(135deg,#E8A84C,#C0726A)' }} />
            <span className="font-sans text-[11px] text-mid">Daily burnout 0–100</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-mid" />
            <span className="font-sans text-[11px] text-mid">Sun → Sat</span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-sans text-[10px] uppercase tracking-wide text-mid/80">Avg</span>
          <span className="font-serif text-sm font-semibold text-charcoal ml-1.5">{data.current_avg}</span>
          <span className="text-mid/60 text-[11px] mx-1">vs</span>
          <span className="font-sans text-xs text-mid">
            {data.previous_avg != null ? data.previous_avg : '—'}
          </span>
          <span className="font-sans text-[10px] text-mid/60 ml-1">last wk</span>
        </div>
      </div>

      {/* Supportive caption */}
      <p className="mt-3 font-sans text-[11px] text-mid/80 leading-relaxed italic relative z-10">
        {trend.help}
      </p>
    </div>
  );
}
