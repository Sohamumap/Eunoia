import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Mail, Globe, Briefcase } from 'lucide-react';

const locales = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'AE', label: 'UAE' },
  { value: 'OTHER', label: 'Other' },
];

const roles = [
  { value: 'resident', label: 'Medical Resident' },
  { value: 'physician', label: 'Physician / Doctor' },
  { value: 'student', label: 'Medical Student / Intern' },
  { value: 'other', label: 'Other profession' },
];

export default function Signup() {
  const { signup, login, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [locale, setLocale] = useState('IN');
  const [role, setRole] = useState('resident');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewName, setPreviewName] = useState('');

  if (user) { navigate('/home'); return null; }

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await signup(email, locale, role);
      setPreviewName(data.user.display_name);
      navigate('/onboarding');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email);
      navigate('/home');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" data-testid="signup-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-fade-up">
          <Link to="/" className="no-underline">
            <h1 className="font-serif text-4xl font-bold text-charcoal mb-2">Eunoia</h1>
          </Link>
          <p className="font-sans text-mid text-sm">
            {mode === 'signup' ? 'Create your anonymous account' : 'Welcome back'}
          </p>
        </div>

        <div className="soft-card no-hover p-8 animate-fade-up stagger-2">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-8 p-1 bg-cream rounded-xl">
            <button
              onClick={() => setMode('signup')}
              data-testid="mode-signup"
              className={`flex-1 py-2.5 rounded-lg font-sans text-sm font-medium transition-all duration-200 ${
                mode === 'signup' ? 'bg-card-bg text-charcoal shadow-sm' : 'text-mid hover:text-charcoal'
              }`}
            >
              Sign up
            </button>
            <button
              onClick={() => setMode('login')}
              data-testid="mode-login"
              className={`flex-1 py-2.5 rounded-lg font-sans text-sm font-medium transition-all duration-200 ${
                mode === 'login' ? 'bg-card-bg text-charcoal shadow-sm' : 'text-mid hover:text-charcoal'
              }`}
            >
              Sign in
            </button>
          </div>

          <form onSubmit={mode === 'signup' ? handleSignup : handleLogin}>
            {/* Email */}
            <div className="mb-5">
              <label className="block font-sans text-sm font-medium text-charcoal mb-2">
                <Mail size={14} className="inline mr-1.5 text-mid" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                data-testid="email-input"
                placeholder="your.email@hospital.org"
                className="w-full px-4 py-3 rounded-xl border border-eunoia-border bg-warm-white font-sans text-sm text-charcoal placeholder:text-mid/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>

            {mode === 'signup' && (
              <>
                {/* Locale */}
                <div className="mb-5">
                  <label className="block font-sans text-sm font-medium text-charcoal mb-2">
                    <Globe size={14} className="inline mr-1.5 text-mid" />
                    Where are you based?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {locales.map(l => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLocale(l.value)}
                        data-testid={`locale-${l.value}`}
                        className={`py-2.5 px-3 rounded-xl border font-sans text-xs font-medium transition-all duration-200 ${
                          locale === l.value
                            ? 'border-accent bg-accent/5 text-accent'
                            : 'border-eunoia-border text-mid hover:border-charcoal/20'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role */}
                <div className="mb-5">
                  <label className="block font-sans text-sm font-medium text-charcoal mb-2">
                    <Briefcase size={14} className="inline mr-1.5 text-mid" />
                    What best describes you?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        data-testid={`role-${r.value}`}
                        className={`py-2.5 px-3 rounded-xl border font-sans text-xs font-medium transition-all duration-200 text-left ${
                          role === r.value
                            ? 'border-accent bg-accent/5 text-accent'
                            : 'border-eunoia-border text-mid hover:border-charcoal/20'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="mb-6 p-3 rounded-xl bg-cream/80 border border-eunoia-border">
                  <p className="font-sans text-xs text-mid text-center">
                    You will appear as <span className="font-medium text-charcoal">{role === 'resident' ? 'Resident' : role === 'physician' ? 'Dr' : role === 'student' ? 'Intern' : 'Member'}_{Math.floor(1000 + Math.random() * 9000)}</span>
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose/10 border border-rose/20" data-testid="auth-error">
                <p className="font-sans text-sm text-rose">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="auth-submit-btn"
              className="w-full py-3.5 rounded-full bg-charcoal text-white font-sans font-medium text-sm hover:-translate-y-[1px] hover:shadow-eunoia-hover transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create anonymous account' : 'Sign in with email'}
              {!loading && <ArrowRight size={16} />}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={async () => {
                  setEmail('demo@eunoia.app');
                  setLoading(true);
                  try {
                    await login('demo@eunoia.app');
                    navigate('/home');
                  } catch (err) {
                    setError('Demo login failed');
                  } finally { setLoading(false); }
                }}
                data-testid="demo-login-btn"
                className="w-full mt-3 py-2.5 rounded-full border border-dashed border-accent/40 text-accent font-sans text-xs hover:bg-accent/5 transition-all"
              >
                Try demo account · demo@eunoia.app
              </button>
            )}
          </form>
        </div>

        <p className="mt-8 text-center font-sans text-xs text-mid leading-relaxed max-w-sm mx-auto">
          Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment.
        </p>
      </div>
    </div>
  );
}
