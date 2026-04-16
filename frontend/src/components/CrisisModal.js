import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Phone, MessageCircle, X } from 'lucide-react';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function CrisisModal({ onClose, autoLocale }) {
  const { user, api } = useAuth();
  const [helplines, setHelplines] = useState([]);
  const [peerRequested, setPeerRequested] = useState(false);
  const locale = autoLocale || user?.locale || 'IN';

  useEffect(() => {
    const fetchHelplines = async () => {
      try {
        const { data } = await axios.get(`${BACKEND}/api/crisis/helplines/${locale}`);
        setHelplines(data.helplines);
      } catch {
        setHelplines([
          { name: 'Emergency Services', number: '911 / 112', tel: 'tel:112' }
        ]);
      }
    };
    fetchHelplines();
  }, [locale]);

  const logCrisis = async (action) => {
    if (!api) return;
    try {
      await api('post', '/crisis/log', {
        trigger_text: 'manual_or_detected',
        helpline_shown: helplines.map(h => h.name).join(', '),
        action_taken: action,
      });
    } catch (error) {
      console.error('Failed to log crisis event:', error);
    }
  };

  const handleDial = (helpline) => {
    logCrisis('dialed');
    if (helpline.tel) window.open(helpline.tel, '_self');
  };

  const handlePeer = () => {
    logCrisis('opened_peer');
    setPeerRequested(true);
  };

  const handleDismiss = () => {
    logCrisis('dismissed');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" data-testid="crisis-modal">
      <div className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm" onClick={handleDismiss} />
      <div className="relative w-full max-w-lg mx-4 bg-warm-white rounded-eunoia shadow-2xl p-8 animate-fade-up" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-charcoal/5 text-mid transition-colors"
          data-testid="crisis-modal-close"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl font-bold text-charcoal mb-3">
            It sounds like you are carrying a lot right now.
          </h2>
          <p className="text-mid font-sans text-base">
            You are not alone. Please reach out to someone who can help.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {helplines.map((h, i) => (
            <button
              key={i}
              onClick={() => handleDial(h)}
              data-testid={`crisis-helpline-${i}`}
              className="w-full flex items-center gap-4 p-4 rounded-lg bg-card-bg border border-eunoia-border hover:border-rose hover:shadow-eunoia transition-all duration-200 text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(192,114,106,0.1)' }}>
                <Phone size={18} className="text-rose" />
              </div>
              <div>
                <div className="font-sans font-medium text-charcoal">{h.name}</div>
                <div className="font-sans text-sm text-accent font-medium">{h.number}</div>
              </div>
            </button>
          ))}
        </div>

        {!peerRequested ? (
          <button
            onClick={handlePeer}
            data-testid="crisis-peer-btn"
            className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-eunoia-border hover:border-accent text-mid hover:text-charcoal transition-all duration-200 font-sans text-sm"
          >
            <MessageCircle size={16} />
            Talk to a peer who has been there
          </button>
        ) : (
          <div className="w-full p-4 rounded-lg bg-sage/10 text-center animate-fade-up" data-testid="crisis-peer-confirmation">
            <p className="font-sans text-sage font-medium text-sm">
              A peer will reach out within 15 minutes. You are not alone.
            </p>
          </div>
        )}

        <button
          onClick={handleDismiss}
          data-testid="crisis-keep-journaling-btn"
          className="w-full mt-4 p-3 text-center text-mid hover:text-charcoal font-sans text-sm transition-colors rounded-lg hover:bg-charcoal/[0.03]"
        >
          Keep journaling privately
        </button>

        <p className="mt-6 text-xs text-mid text-center font-sans leading-relaxed">
          Eunoia never auto-dials a helpline. Every call is your choice.
          If this feels severe, please call one of the numbers above.
        </p>
      </div>
    </div>
  );
}
