import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import GlassCard from '@/components/GlassCard';
import IdentityEmblem from '@/components/IdentityEmblem';
import { Users } from 'lucide-react';

const getActivityStatus = (circleId) => {
  // Simulate activity status based on circle
  const statuses = [
    { emoji: '🌊', text: 'The circle is carrying a lot right now' },
    { emoji: '✅', text: 'Resonance is high today' },
    { emoji: '🌙', text: 'A quiet space for reflection' },
    { emoji: '💫', text: 'New voices joining in' }
  ];
  const hash = circleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return statuses[hash % statuses.length];
};

function CircleCard({ circle, onClick }) {
  const activity = getActivityStatus(circle.id);
  
  return (
    <GlassCard hover onClick={onClick} className="p-7 hover-lift">
      <IdentityEmblem userId={circle.id} size="md" className="mb-5" />
      
      <h3 className="text-2xl font-serif text-charcoal mb-3 font-semibold">
        {circle.name}
      </h3>
      
      <p className="text-base text-mid mb-5 leading-relaxed">
        {circle.description}
      </p>
      
      {/* Tags */}
      {circle.tags && circle.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {circle.tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-warm-white/70 text-charcoal border border-charcoal/15"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Member Count */}
      <div className="flex items-center gap-2 text-base text-mid mb-4 font-medium">
        <Users size={16} />
        <span>{circle.member_count || circle.seeded_members_count || 0} members</span>
      </div>
      
      {/* Activity Status */}
      <div className="flex items-center gap-2 text-base text-charcoal font-medium">
        <span className="text-lg">{activity.emoji}</span>
        <span className="italic">{activity.text}</span>
      </div>
    </GlassCard>
  );
}

export default function Circles() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCircles = async () => {
      try {
        const { data } = await api('get', '/forums');
        setCircles(data.forums || []);
      } catch (err) {
        console.error('Error fetching circles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCircles();
  }, [api]);

  const handleCircleClick = (circleId) => {
    navigate(`/circles/${circleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-mid">Loading circles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header - Bold typography */}
        <div className="mb-16 text-center animate-fade-up">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-charcoal mb-5 font-bold leading-[1.02]">
            Find your cohort.
          </h1>
          <p className="text-xl text-mid leading-relaxed font-medium max-w-2xl mx-auto">
            Anonymous circles for the specific kind of hard you're carrying.
          </p>
        </div>

        {/* Circle Grid - Staggered reveal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 animate-fade-up stagger-2">
          {circles.map((circle) => (
            <CircleCard
              key={circle.id}
              circle={circle}
              onClick={() => handleCircleClick(circle.id)}
            />
          ))}
        </div>

        {circles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-mid">No circles available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
