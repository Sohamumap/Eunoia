import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Database, BookOpen, BarChart3, Download, Trash2, Shield, AlertTriangle } from 'lucide-react';

export default function DataSettings() {
  const { api } = useAuth();
  const [contributions, setContributions] = useState(null);
  const [consents, setConsents] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api('get', '/data/contributions');
        setContributions(data);
        setConsents(data.consents || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api]);

  const toggleConsent = async (scope) => {
    const newValue = !consents[scope];
    setConsents(prev => ({ ...prev, [scope]: newValue }));
    try {
      await api('put', '/consent/update', { scope, granted: newValue });
    } catch {
      setConsents(prev => ({ ...prev, [scope]: !newValue }));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api('get', '/data/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eunoia-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api('delete', '/data/account');
      window.location.href = '/';
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center pt-16"><p className="font-sans text-mid">Loading...</p></div>;

  const consentItems = [
    { scope: 'research_scales', icon: BarChart3, title: 'Anonymized scale scores', desc: 'Your assessment scores may be included in aggregate academic research.' },
    { scope: 'research_reflections', icon: BookOpen, title: 'Anonymized theme extraction', desc: 'Themes from your reflections may be used for burnout pattern research.' },
    { scope: 'data_trust', icon: Database, title: 'Data cooperative membership', desc: 'Include your data in licensed data trusts with revenue share.' },
  ];

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16 px-4" data-testid="data-settings-page">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mb-3">Data Cooperative</h1>
          <p className="font-sans text-mid text-base">Your data, your rules. You decide what is shared and you benefit from it.</p>
        </div>

        {/* Contribution summary */}
        <div className="bg-card-bg rounded-eunoia shadow-eunoia p-6 mb-6 animate-fade-up stagger-1" data-testid="contribution-summary">
          <div className="grid grid-cols-3 gap-6 text-center mb-6">
            <div>
              <div className="font-serif text-3xl font-bold text-charcoal">{contributions?.reflection_count || 0}</div>
              <div className="font-sans text-xs text-mid mt-1">Reflections</div>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold text-charcoal">{contributions?.assessment_count || 0}</div>
              <div className="font-sans text-xs text-mid mt-1">Assessments</div>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold text-accent">&#x20B9;{contributions?.estimated_quarterly_value || 0}</div>
              <div className="font-sans text-xs text-mid mt-1">Est. quarterly value</div>
            </div>
          </div>
          <p className="font-sans text-xs text-mid text-center leading-relaxed">
            You have contributed {contributions?.reflection_count || 0} reflections and {contributions?.assessment_count || 0} assessment{contributions?.assessment_count !== 1 ? 's' : ''}.
            Estimated quarterly value: &#x20B9;{contributions?.estimated_quarterly_value || 0} &mdash; paid as Eunoia research grants in Phase 2.
          </p>
        </div>

        {/* Consent toggles */}
        <div className="space-y-4 mb-8">
          {consentItems.map((c, i) => (
            <div key={c.scope} className={`bg-card-bg rounded-eunoia shadow-eunoia p-5 animate-fade-up stagger-${i + 2}`} data-testid={`consent-${c.scope}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: consents[c.scope] ? 'rgba(193,123,47,0.08)' : 'rgba(107,107,112,0.05)' }}>
                  <c.icon size={18} className={consents[c.scope] ? 'text-accent' : 'text-mid'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-sans text-sm font-medium text-charcoal">{c.title}</h3>
                    <button
                      onClick={() => toggleConsent(c.scope)}
                      data-testid={`toggle-${c.scope}`}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${consents[c.scope] ? 'bg-accent' : 'bg-eunoia-border'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${consents[c.scope] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <p className="font-sans text-xs text-mid">{c.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contribution history */}
        {contributions?.history?.length > 0 && (
          <div className="bg-card-bg rounded-eunoia shadow-eunoia p-6 mb-8 animate-fade-up stagger-5" data-testid="contribution-history">
            <h3 className="font-serif text-lg font-semibold text-charcoal mb-4">Contribution History</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contributions.history.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-eunoia-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'reflection' ? 'bg-accent/10' : 'bg-eunoia-blue/10'}`}>
                      {item.type === 'reflection' ? <BookOpen size={14} className="text-accent" /> : <BarChart3 size={14} className="text-eunoia-blue" />}
                    </div>
                    <div>
                      <span className="font-sans text-sm text-charcoal">
                        {item.type === 'reflection' ? `Reflection (${item.words}w)` : `Assessment: ${item.scale}`}
                      </span>
                      <span className="font-sans text-xs text-mid ml-2">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="font-sans text-xs font-medium text-sage">&#x20B9;{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-up stagger-6">
          <button
            onClick={handleExport}
            disabled={exporting}
            data-testid="export-data-btn"
            className="flex items-center justify-center gap-2 p-4 rounded-eunoia border border-eunoia-border bg-card-bg font-sans text-sm text-charcoal hover:-translate-y-[1px] hover:shadow-eunoia transition-all disabled:opacity-50"
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Download my data'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            data-testid="delete-account-btn"
            className="flex items-center justify-center gap-2 p-4 rounded-eunoia border border-rose/30 bg-card-bg font-sans text-sm text-rose hover:-translate-y-[1px] hover:shadow-eunoia transition-all"
          >
            <Trash2 size={16} />
            Delete my account
          </button>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="delete-confirm-modal">
            <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-card-bg rounded-eunoia shadow-2xl p-8 max-w-md mx-4 animate-fade-up">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-rose" />
                </div>
                <h3 className="font-serif text-xl font-bold text-charcoal mb-2">Delete your account?</h3>
                <p className="font-sans text-sm text-mid">This permanently removes all your data including reflections, assessments, and wellness profiles. This cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-full border border-eunoia-border text-charcoal font-sans text-sm font-medium">
                  Keep my account
                </button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-full bg-rose text-white font-sans text-sm font-medium disabled:opacity-50" data-testid="confirm-delete-btn">
                  {deleting ? 'Deleting...' : 'Yes, delete everything'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center animate-fade-up stagger-6">
          <p className="font-sans text-xs text-mid leading-relaxed">
            Your data rights are protected under applicable data protection laws including DPDP Act 2023.
            Eunoia provides screening and peer support. It is not therapy, diagnosis, or medical treatment.
          </p>
        </div>
      </div>
    </div>
  );
}
