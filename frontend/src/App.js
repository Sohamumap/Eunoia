import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import AtmosphericBg from '@/components/AtmosphericBg';
import Landing from '@/pages/Landing';
import Signup from '@/pages/Signup';
import Onboarding from '@/pages/Onboarding';
import Assessment from '@/pages/Assessment';
import Profile from '@/pages/Profile';
import Hub from '@/pages/Hub';
import Circles from '@/pages/Circles';
import CircleThread from '@/pages/CircleThread';
import Companion from '@/pages/Companion';
import DataSettings from '@/pages/DataSettings';
import Home from '@/pages/Home';

function AppLayout() {
  const location = useLocation();
  const hideNav = ['/', '/signup'].includes(location.pathname);

  return (
    <>
      <AtmosphericBg />
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/hub" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
        <Route path="/circles" element={<ProtectedRoute><Circles /></ProtectedRoute>} />
        <Route path="/circles/:id" element={<ProtectedRoute><CircleThread /></ProtectedRoute>} />
        <Route path="/companion" element={<ProtectedRoute><Companion /></ProtectedRoute>} />
        <Route path="/settings/data" element={<ProtectedRoute><DataSettings /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
