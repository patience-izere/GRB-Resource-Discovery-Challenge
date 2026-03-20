import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export type CtaActionType = 'submit' | 'correct' | 'request';

interface GapCtaModalProps {
  isOpen: boolean;
  onClose: () => void;
  gapTitle: string;
  gapDescription: string;
  actionType?: CtaActionType;
  affectedStudyId?: string;
  affectedStudyTitle?: string;
}

const ctaConfigs = {
  submit: {
    title: 'Submit Missing Data',
    icon: '📤',
    description: 'Share resources, studies, or data to fill this gap',
    placeholder: 'Describe the data you\'d like to submit and provide a source or contact details...',
    buttonText: 'Submit',
    successMessage: 'Thank you! Your submission has been recorded.',
  },
  correct: {
    title: 'Request Data Correction',
    icon: '✏️',
    description: 'Report inaccuracies or outdated information',
    placeholder: 'Explain what needs to be corrected and provide the correct information...',
    buttonText: 'Submit Correction',
    successMessage: 'Your correction request has been sent to the data team.',
  },
  request: {
    title: 'Request Data Update',
    icon: '🔄',
    description: 'Prioritize updates to this data gap',
    placeholder: 'Explain why this data is important and what priority level it should have...',
    buttonText: 'Request Update',
    successMessage: 'Your update request has been recorded and will be reviewed.',
  },
};

export default function GapCtaModal({ 
  isOpen, 
  onClose, 
  gapTitle, 
  gapDescription, 
  actionType = 'submit',
  affectedStudyId,
  affectedStudyTitle 
}: GapCtaModalProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const config = ctaConfigs[actionType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !email.trim() || !name.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send to backend
      const response = await fetch('/api/gap-actions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType,
          gap_title: gapTitle,
          affected_study_id: affectedStudyId,
          affected_study_title: affectedStudyTitle,
          message,
          email,
          name,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setMessage('');
          setEmail('');
          setName('');
        }, 2000);
      } else {
        alert('Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-light-gray">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="font-display font-bold text-rich-black">{config.title}</h3>
              <p className="text-xs text-dark-gray">{gapTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-medium-gray hover:text-dark-gray"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mb-3" />
              <p className="text-sm font-semibold text-rich-black">{config.successMessage}</p>
              <p className="text-xs text-dark-gray mt-2">
                Our team will review your submission within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Gap Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">Gap Summary</p>
                <p className="text-sm text-blue-900">{gapDescription}</p>
              </div>

              {/* Affected Study */}
              {affectedStudyTitle && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1">Related Study</p>
                  <p className="text-sm text-amber-900">{affectedStudyTitle}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-dark-gray uppercase tracking-wider mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rwanda-blue text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-dark-gray uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rwanda-blue text-sm"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-dark-gray uppercase tracking-wider mb-2">
                  {actionType === 'submit' ? 'Data Description' : 'Message'}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={config.placeholder}
                  rows={6}
                  className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rwanda-blue text-sm resize-none"
                />
                <p className="text-xs text-dark-gray mt-1">Minimum 10 characters required</p>
              </div>

              {/* Info Alert */}
              <div className="bg-light-gray rounded-lg p-3 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-medium-gray shrink-0 mt-0.5" />
                <p className="text-xs text-dark-gray">
                  Your submission will be reviewed by our data team. We may follow up with you for clarification.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="p-4 border-t border-light-gray flex justify-end gap-2 bg-off-white">
            <button
              onClick={onClose}
              className="btn-ghost py-2 px-4 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !message.trim() || !email.trim() || !name.trim()}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> {config.buttonText}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
