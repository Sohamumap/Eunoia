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
    <GlassCard hover onClick={onClick} className="p-6">
      <IdentityEmblem userId={circle.id} size="md" className="mb-4" />
      
      <h3 className="text-xl font-serif text-charcoal mb-2">
        {circle.name}
      </h3>
      
      <p className="text-sm text-mid mb-4 leading-relaxed">
        {circle.description}
      </p>
      
      {/* Tags */}
      {circle.tags && circle.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {circle.tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs font-medium bg-warm-white/60 text-charcoal border border-charcoal/10"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Member Count */}
      <div className="flex items-center gap-2 text-sm text-mid mb-3">
        <Users size={14} />
        <span>{circle.member_count || circle.seeded_members_count || 0} members</span>
      </div>
      
      {/* Activity Status */}
      <div className="flex items-center gap-2 text-sm text-charcoal">
        <span>{activity.emoji}</span>
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
        {/* Header */}
        <div className="mb-12 text-center animate-fade-up">
          <h1 className="text-4xl sm:text-5xl font-serif text-charcoal mb-4">
            Find your cohort.
          </h1>
          <p className="text-lg text-mid leading-relaxed">
            Anonymous circles for the specific kind of hard you're carrying.
          </p>
        </div>

        {/* Circle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up stagger-2">
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
