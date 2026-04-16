import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-mid font-sans text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/signup" replace />;
  return children;
}
