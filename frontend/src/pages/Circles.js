import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Users, MessageSquare, ArrowRight } from 'lucide-react';

const tagColors = {
  sleep: 'bg-eunoia-blue/10 text-eunoia-blue',
  'shift-work': 'bg-lavender/10 text-lavender',
  exhaustion: 'bg-rose/10 text-rose',
  transition: 'bg-accent/10 text-accent',
  imposter: 'bg-lavender/10 text-lavender',
  overwhelm: 'bg-rose/10 text-rose',
  anxiety: 'bg-accent-light/10 text-accent',
  hidden: 'bg-mid/10 text-mid',
  'high-functioning': 'bg-eunoia-blue/10 text-eunoia-blue',
  burnout: 'bg-charcoal/10 text-charcoal',
  coping: 'bg-sage/10 text-sage',
  solidarity: 'bg-eunoia-blue/10 text-eunoia-blue',
};

export default function Circles() {
  const { api } = useAuth();
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForums = async () => {
      try {
        const { data } = await api('get', '/forums');
        setForums(data.forums);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchForums();
  }, [api]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center pt-16">
        <p className="font-sans text-mid text-sm">Loading circles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16 px-4" data-testid="circles-page">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mb-3">Circles</h1>
          <p className="font-sans text-mid text-base">Anonymous peer communities. Moderated for safety, designed for solidarity.</p>
        </div>

        <div className="space-y-5">
          {forums.map((forum, i) => (
            <Link
              key={forum.id}
              to={`/circles/${forum.id}`}
              data-testid={`circle-${forum.id}`}
              className={`block bg-card-bg rounded-eunoia shadow-eunoia p-6 hover:-translate-y-[2px] hover:shadow-eunoia-hover transition-all duration-300 no-underline animate-fade-up stagger-${i + 1}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-serif text-xl font-semibold text-charcoal mb-2">{forum.name}</h3>
                  <p className="font-sans text-sm text-mid leading-relaxed mb-3">{forum.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {forum.tags?.map(tag => (
                      <span key={tag} className={`px-2.5 py-1 rounded-full text-[11px] font-sans font-medium ${tagColors[tag] || 'bg-mid/10 text-mid'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 font-sans text-xs text-mid">
                    <span className="flex items-center gap-1"><Users size={12} /> {forum.seeded_members_count} members</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {forum.post_count || 0} posts</span>
                  </div>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-charcoal/5 flex items-center justify-center">
                  <ArrowRight size={16} className="text-mid" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center font-sans text-xs text-mid leading-relaxed">
          All posts are moderated before publishing. No medication advice or diagnostic language allowed.
        </p>
      </div>
    </div>
  );
}
