import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CrisisModal from '@/components/CrisisModal';
import { Heart, Home as HomeIcon, BookOpen, Users, Compass, User, Settings, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCrisis, setShowCrisis] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/home', label: 'Home', icon: HomeIcon },
    { path: '/companion', label: 'Companion', icon: BookOpen },
    { path: '/circles', label: 'Circles', icon: Users },
    { path: '/hub', label: 'Hub', icon: Compass },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings/data', label: 'Data', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav" data-testid="navbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to={user ? '/home' : '/'} className="flex items-center gap-2 no-underline" data-testid="nav-logo">
              <span className="font-serif text-2xl font-bold text-charcoal tracking-tight">Eunoia</span>
              <span className="text-accent text-xs font-sans font-light hidden sm:inline tracking-wide" style={{ marginTop: '4px' }}>beautiful thinking</span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    data-testid={`nav-${label.toLowerCase()}`}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans transition-all duration-200 no-underline ${
                      isActive(path) ? 'bg-charcoal/5 text-charcoal font-medium' : 'text-mid hover:text-charcoal hover:bg-charcoal/[0.03]'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCrisis(true)}
                data-testid="get-help-now-btn"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-sans font-medium text-white transition-all duration-200 animate-pulse-crisis"
                style={{ backgroundColor: 'var(--rose)' }}
              >
                <Heart size={14} fill="white" />
                <span className="hidden sm:inline">Get Help Now</span>
              </button>

              {user && (
                <>
                  <button
                    onClick={handleLogout}
                    data-testid="logout-btn"
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-mid hover:text-charcoal transition-colors"
                  >
                    <LogOut size={15} />
                  </button>
                  <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 text-mid hover:text-charcoal"
                    data-testid="mobile-menu-btn"
                  >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && user && (
            <div className="md:hidden pb-4 border-t border-eunoia-border pt-3 animate-fade-up">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm no-underline ${
                    isActive(path) ? 'bg-charcoal/5 text-charcoal font-medium' : 'text-mid'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 text-sm text-mid w-full text-left">
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}
    </>
  );
}
