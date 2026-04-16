import React from 'react';
import { Stethoscope, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

/**
 * SafetyReferralModal
 * Shown when the moderation API returns status === 'seeking_prescription'.
 * This is the "please see a licensed clinician" guardrail — NOT a crisis modal.
 *
 * Props:
 *   onClose: () => void
 *   message: string (from moderation response; falls back to default copy)
 *   flaggedText: string (optional — the user's snippet that triggered the flag)
 */
export default function SafetyReferralModal({ onClose, message, flaggedText }) {
  const copy =
    message ||
    'Eunoia is a peer-support space, not a clinical service. For medicine, prescriptions, dosages, or a formal diagnosis, please consult a licensed physician or psychiatrist — they can review your history safely.';

  const handleFindClinician = () => {
    // Prototype simulation — real directory would be integrated here.
    toast('Clinician directory coming soon. For now, please reach out to your GP or a licensed psychiatrist in your area.', {
      duration: 4500,
      style: {
        fontFamily: 'DM Sans',
        background: 'var(--warm-white)',
        color: 'var(--charcoal)',
        border: '1px solid var(--border)',
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" data-testid="safety-referral-modal">
      <div className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-lg mx-4 bg-warm-white rounded-eunoia shadow-2xl p-8 animate-fade-up"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-charcoal/5 text-mid transition-colors"
          data-testid="safety-referral-close"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Icon header */}
        <div className="flex items-center justify-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(192,114,106,0.12)' }}
          >
            <Stethoscope size={26} className="text-rose" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl font-bold text-charcoal mb-3">
            For prescriptions, please speak to a physician.
          </h2>
          <p className="text-mid font-sans text-[15px] leading-relaxed">{copy}</p>
        </div>

        {flaggedText && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="font-sans text-xs text-amber-700 leading-relaxed">
              <span className="font-medium">Detected in your message:</span> &ldquo;{flaggedText}&rdquo;
            </p>
          </div>
        )}

        {/* Why section */}
        <div className="mb-6 px-4 py-4 rounded-xl bg-sage/8 border border-sage/15">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-sage mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-sans text-sm font-medium text-charcoal mb-1">
                Why Eunoia won&rsquo;t answer this
              </p>
              <p className="font-sans text-xs text-mid leading-relaxed">
                Peer support helps with being heard, feeling less alone, and learning coping practices.
                It does not replace a clinician who can review your medical history, interactions, and
                dosage safety. We never want to give advice that could hurt you.
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={handleFindClinician}
            data-testid="safety-referral-find-clinician"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-charcoal text-white font-sans text-sm font-medium hover:-translate-y-[1px] transition-all"
          >
            Find a clinician near me
            <ExternalLink size={14} />
          </button>

          <button
            onClick={onClose}
            data-testid="safety-referral-understood"
            className="w-full px-6 py-3 rounded-full border border-eunoia-border text-charcoal font-sans text-sm font-medium hover:bg-charcoal/[0.03] transition-all"
          >
            I understand — let me rewrite
          </button>
        </div>

        <p className="mt-6 text-[11px] text-mid text-center font-sans leading-relaxed">
          Eunoia provides peer support and screening tools only. It is not a substitute for professional
          medical advice, diagnosis, or treatment.
        </p>
      </div>
    </div>
  );
}
