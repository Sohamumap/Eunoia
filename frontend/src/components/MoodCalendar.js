import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MOODS } from './MoodSelector';

const MOOD_COLOR = MOODS.reduce((acc, m) => ({ ...acc, [m.key]: m.color }), {});

export default function MoodCalendar({ days = 91, showStats = true }) {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(null);

  const fetchCalendar = useCallback(async () => {
    try {
      const { data: d } = await api('get', `/mood/calendar?days=${days}`);
      setData(d);
    } catch (error) {
      console.error('Failed to fetch mood calendar:', error);
    } finally { 
      setLoading(false); 
    }
  }, [api, days]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  if (loading) {
    return <div className="skeleton" style={{ height: 160, borderRadius: 18 }} />;
  }
  if (!data) return null;

  // Organize into weeks (columns) from oldest to newest, each column = 7 days
  const cols = [];
  for (let i = 0; i < data.days.length; i += 7) cols.push(data.days.slice(i, i + 7));

  const dayLabels = ['M', '', 'W', '', 'F', '', ''];

  return (
    <div className="w-full" data-testid="mood-calendar">
      <div className="flex items-start gap-3 overflow-x-auto no-scrollbar">
        <div className="flex flex-col gap-1 pt-1 flex-shrink-0">
          {dayLabels.map((l, i) => (
            <span key={`day-label-${l}-${i}`} className="font-mono text-[10px] text-mid h-4 leading-4 w-3">{l}</span>
          ))}
        </div>
        <div className="flex gap-1 flex-1 min-w-0">
          {cols.map((col, colIdx) => (
            <div key={`col-${colIdx}`} className="flex flex-col gap-1">
              {col.map((d, dayIdx) => {
                const c = d.mood ? MOOD_COLOR[d.mood] : null;
                return (
                  <div
                    key={d.date || `day-${colIdx}-${dayIdx}`}
                    onMouseEnter={() => setHover(d)}
                    onMouseLeave={() => setHover(null)}
                    data-testid={`cal-cell-${d.date}`}
                    className="w-4 h-4 rounded-[5px] transition-all duration-200 hover:scale-125 cursor-pointer"
                    style={{
                      background: c || 'rgba(232,228,222,0.45)',
                      opacity: c ? 0.85 : 1,
                      boxShadow: c ? `0 2px 6px -2px ${c}80` : 'none',
                    }}
                    title={`${d.date}${d.mood ? ' — ' + d.mood : ' — no entry'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {hover && (
        <div className="mt-3 p-2 rounded-lg bg-white/80 border border-eunoia-border inline-block">
          <p className="font-sans text-xs text-charcoal">
            <span className="font-mono text-mid">{hover.date}</span>
            {hover.mood ? (
              <> · <span className="capitalize font-medium" style={{ color: MOOD_COLOR[hover.mood] }}>{hover.mood}</span></>
            ) : ' · no entry'}
            {hover.note && <span className="text-mid italic"> — &ldquo;{hover.note}&rdquo;</span>}
          </p>
        </div>
      )}

      {showStats && (
        <div className="flex items-center gap-6 mt-5 pt-4 border-t border-eunoia-border">
          <div>
            <p className="font-mono text-[10px] text-mid uppercase tracking-wider">Logged</p>
            <p className="font-serif text-xl text-charcoal">{data.logged_count}<span className="text-mid font-sans text-xs">/{data.total_days}</span></p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-mid uppercase tracking-wider">Streak</p>
            <p className="font-serif text-xl text-charcoal">{data.streak}<span className="text-mid font-sans text-xs"> days</span></p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-mid uppercase tracking-wider">Avg mood</p>
            <p className="font-serif text-xl text-charcoal">{data.avg_value.toFixed(1)}<span className="text-mid font-sans text-xs">/5</span></p>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="font-mono text-[10px] text-mid">less</span>
            {['depleted','heavy','tender','steady','radiant'].map(k => (
              <span key={k} className="w-3 h-3 rounded" style={{ background: MOOD_COLOR[k] }} title={k} />
            ))}
            <span className="font-mono text-[10px] text-mid">more</span>
          </div>
        </div>
      )}
    </div>
  );
}
