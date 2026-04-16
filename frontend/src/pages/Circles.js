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
      
      <h3 className="text-xl font-serif text-white mb-2">
        {circle.name}
      </h3>
      
      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
        {circle.description}
      </p>
      
      {/* Tags */}
      {circle.tags && circle.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {circle.tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs font-medium bg-black/30 text-gray-300 border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Member Count */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <Users size={14} />
        <span>{circle.member_count || circle.seeded_members_count || 0} members</span>
      </div>
      
      {/* Activity Status */}
      <div className="flex items-center gap-2 text-sm text-gray-300">
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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #2C1810 0%, #1a1410 100%)'
        }}
      >
        <p className="text-gray-400">Loading circles...</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pt-20 pb-24 px-4"
      style={{
        background: 'linear-gradient(135deg, #2C1810 0%, #1a1410 100%)',
        backgroundImage: `
          linear-gradient(135deg, rgba(44, 24, 16, 0.95) 0%, rgba(26, 20, 16, 0.95) 100%),
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
        `
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center animate-fade-up">
          <h1 className="text-4xl sm:text-5xl font-serif text-white mb-4">
            Find your cohort.
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
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
            <p className="text-gray-400">No circles available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
