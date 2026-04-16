import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Check } from 'lucide-react';

const MOODS = [
  { key: 'radiant',  label: 'Radiant',  emoji: '☀️', color: '#E8A84C', desc: 'Bright, open, energised' },
  { key: 'steady',   label: 'Steady',   emoji: '🌱', color: '#7FB88F', desc: 'Grounded, capable' },
  { key: 'tender',   label: 'Tender',   emoji: '🌸', color: '#C8A0B5', desc: 'Sensitive, reflective' },
  { key: 'heavy',    label: 'Heavy',    emoji: '🌧️', color: '#7B6FA5', desc: 'Weighed, tired' },
  { key: 'depleted', label: 'Depleted', emoji: '🌑', color: '#C0726A', desc: 'Running on empty' },
];

export default function MoodSelector({ onSaved, compact = false }) {
  const { api } = useAuth();
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [today, setToday] = useState(null);

  const fetchToday = useCallback(async () => {
    try {
      const { data } = await api('get', '/mood/today');
      if (data.entry) {
        setToday(data.entry);
        setSelected(data.entry.mood);
        setNote(data.entry.note || '');
      }
    } catch (error) {
      console.error('Failed to fetch today mood:', error);
    }
  }, [api]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api('post', '/mood/checkin', { mood: selected, intensity: 3, note });
      setSaved(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaved(false), 2000);
      await fetchToday();
    } catch (error) {
      console.error('Failed to save mood:', error);
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div data-testid="mood-selector">
      {!compact && (
        <div className="mb-4">
          <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-mid mb-2">Today&apos;s Check-in</p>
          <h3 className="font-serif text-2xl font-semibold text-charcoal mb-1">
            {today ? 'You felt' : 'How are you, really?'}
          </h3>
          {!today && <p className="font-sans text-sm text-mid">One tap. No judgment. Takes 5 seconds.</p>}
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 mb-4">
        {MOODS.map(m => {
          const isSel = selected === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setSelected(m.key)}
              data-testid={`mood-${m.key}`}
              className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-300 ${isSel ? 'scale-[1.04]' : 'hover:scale-[1.02]'}`}
              style={{
                background: isSel ? `linear-gradient(160deg, ${m.color}24 0%, ${m.color}10 100%)` : 'rgba(255,255,255,0.6)',
                border: `1.5px solid ${isSel ? m.color : 'rgba(232,228,222,0.7)'}`,
                boxShadow: isSel ? `0 10px 25px -10px ${m.color}80` : '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <span className="text-2xl" style={{ filter: isSel ? 'none' : 'grayscale(0.2)' }}>{m.emoji}</span>
              <span className="font-sans text-[10px] font-medium" style={{ color: isSel ? m.color : 'var(--mid)' }}>{m.label}</span>
              {isSel && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: m.color }}>
                  <Check size={10} className="text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && !compact && (
        <div className="animate-fade-up">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 280))}
            placeholder="Optional — one line about why (you don&apos;t owe anyone a story)"
            rows={2}
            data-testid="mood-note"
            className="w-full p-3 rounded-xl border border-eunoia-border bg-white/70 font-sans text-sm text-charcoal placeholder:text-mid/50 resize-none focus:outline-none focus:border-accent/40 transition-all"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="font-sans text-[11px] text-mid">{note.length}/280</p>
            <button
              onClick={handleSave}
              disabled={saving}
              data-testid="mood-save"
              className="px-5 py-2 rounded-full bg-charcoal text-white font-sans text-sm font-medium hover:-translate-y-[1px] transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : today ? 'Update' : 'Log my mood'}
            </button>
          </div>
        </div>
      )}
      {today && compact && (
        <p className="font-sans text-xs text-mid mt-2">Logged today — tap to change</p>
      )}
    </div>
  );
}

export { MOODS };
