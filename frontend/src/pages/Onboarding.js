import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Check, ArrowRight, Shield, BookOpen, Database } from 'lucide-react';

const consentScopes = [
  {
    scope: 'research_scales',
    icon: BookOpen,
    title: 'Anonymized scale scores',
    desc: 'Your PHQ-9, GAD-7, MBI, and UCLA-3 scores may be included in aggregate, anonymized academic research. No identifying information is ever shared.',
    defaultOn: true,
  },
  {
    scope: 'research_reflections',
    icon: Shield,
    title: 'Anonymized theme extraction',
    desc: 'Themes (not raw text) from your reflections may be extracted for research on burnout patterns. Your words are never shared directly.',
    defaultOn: false,
  },
  {
    scope: 'data_trust',
    icon: Database,
    title: 'Data cooperative membership',
    desc: 'Include your anonymized data in licensed data trusts. You receive a share of any commercial value generated. Estimated quarterly payout begins at Phase 2.',
    defaultOn: false,
  },
];

export default function Onboarding() {
  const { user, completeOnboarding, api } = useAuth();
  const navigate = useNavigate();
  const [consents, setConsents] = useState({
    research_scales: true,
    research_reflections: false,
    data_trust: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.onboarded) navigate('/assessment');
  }, [user, navigate]);

  const toggleConsent = (scope) => {
    setConsents(prev => ({ ...prev, [scope]: !prev[scope] }));
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      for (const [scope, granted] of Object.entries(consents)) {
        await api('put', '/consent/update', { scope, granted });
      }
      await completeOnboarding();
      navigate('/assessment');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12" data-testid="onboarding-page">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10 animate-fade-up">
          <p className="font-sans text-sm text-accent font-medium mb-2">Welcome, {user?.display_name}</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mb-3">Your data, your rules.</h1>
          <p className="font-sans text-mid text-base max-w-md mx-auto">
            Choose what you are comfortable sharing. You can change these anytime in settings.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {consentScopes.map((c, i) => (
            <div
              key={c.scope}
              className={`bg-card-bg rounded-eunoia p-6 shadow-eunoia border transition-all duration-300 animate-fade-up stagger-${i + 1} ${
                consents[c.scope] ? 'border-accent/30' : 'border-eunoia-border'
              }`}
              data-testid={`consent-${c.scope}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: consents[c.scope] ? 'rgba(193,123,47,0.08)' : 'rgba(107,107,112,0.05)' }}>
                  <c.icon size={18} className={consents[c.scope] ? 'text-accent' : 'text-mid'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-sans text-sm font-medium text-charcoal">{c.title}</h3>
                    <button
                      onClick={() => toggleConsent(c.scope)}
                      data-testid={`consent-toggle-${c.scope}`}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        consents[c.scope] ? 'bg-accent' : 'bg-eunoia-border'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        consents[c.scope] ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  <p className="font-sans text-xs text-mid leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="bg-warm-white rounded-eunoia p-5 mb-8 border border-eunoia-border animate-fade-up stagger-4">
          <p className="font-sans text-xs text-mid leading-relaxed">
            <span className="font-medium text-charcoal">Important:</span> Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment.
            Always consult a licensed clinician for care. Your data rights are protected under applicable data protection laws including DPDP Act 2023.
          </p>
        </div>

        <button
          onClick={handleContinue}
          disabled={loading}
          data-testid="onboarding-continue-btn"
          className="w-full py-4 rounded-full bg-charcoal text-white font-sans font-medium text-sm hover:-translate-y-[1px] hover:shadow-eunoia-hover transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 animate-fade-up stagger-5"
        >
          {loading ? 'Saving...' : 'Continue to your check-in'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
