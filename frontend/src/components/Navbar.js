import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CrisisModal from '@/components/CrisisModal';
import Logo from '@/components/Logo';
import { Heart, Home as HomeIcon, BookOpen, Users, Compass, User, Settings, LogOut, Menu, X, Mail, Trophy } from 'lucide-react';

export default function Navbar() {
  const { user, logout, api } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCrisis, setShowCrisis] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [karma, setKarma] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Fetch karma
      api('get', '/user/me/karma').then(({ data }) => {
        setKarma(data);
      }).catch(() => {});

      // Fetch unread message count
      api('get', '/messages/inbox').then(({ data }) => {
        setUnreadCount(data.unread_count || 0);
      }).catch(() => {});
    }
  }, [user, api]);

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
            <div className="flex items-center gap-3">
              <Logo to={user ? '/home' : '/'} size="md" data-testid="nav-logo" />
              <span className="text-accent text-xs font-sans font-medium hidden sm:inline tracking-wide" style={{ marginTop: '2px' }}>beautiful thinking</span>
            </div>

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
              {user && karma && (
                <Link
                  to={`/user/${user.id}`}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-sans text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                  title="Your karma"
                >
                  <Trophy size={14} className="text-orange-500" />
                  <span className="font-bold">{karma.total_karma.toLocaleString()}</span>
                </Link>
              )}

              {user && (
                <Link
                  to="/inbox"
                  className="relative hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-sans text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                  title="Messages"
                >
                  <Mail size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

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
