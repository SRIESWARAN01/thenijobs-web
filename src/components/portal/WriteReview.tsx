'use client';

import { useState } from 'react';
import { Star, Send, X, AlertCircle } from 'lucide-react';

interface WriteReviewProps {
  companyId: string;
  companyName: string;
  onSubmit: (data: { rating: number; comment: string }) => Promise<void>;
  onClose?: () => void;
}

export function WriteReview({ companyId, companyName, onSubmit, onClose }: WriteReviewProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating of 1 to 5 stars');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Please write a review comment with at least 10 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmit({ rating, comment: comment.trim() });
      setSuccess(true);
      setTimeout(() => {
        onClose?.();
      }, 2200);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div 
        role="alert"
        aria-live="polite"
        className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 text-center animate-fade-in-up shadow-2xl max-w-md mx-auto"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Star size={28} className="text-emerald-400 fill-emerald-400 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 font-outfit">Thank You!</h3>
        <p className="text-sm text-slate-300 mt-2 font-medium">Your review for <span className="text-emerald-400 font-bold">{companyName}</span> has been successfully published.</p>
      </div>
    );
  }

  return (
    <div 
      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 animate-fade-in-up shadow-2xl max-w-md mx-auto"
      role="form"
      aria-label={`Write a review for ${companyName}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-100 tracking-tight font-outfit">Write a Review</h3>
          <p className="text-xs text-slate-350 mt-1 font-medium">Share your experience with <span className="text-slate-100 font-semibold">{companyName}</span></p>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            aria-label="Close review form"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Star Rating Selection */}
      <div className="text-center bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 space-y-3">
        <span className="block text-xs font-bold text-slate-350 uppercase tracking-widest">Select Rating</span>
        <div className="flex items-center justify-center gap-2.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= (hoveredStar || rating);
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''} - ${ratingLabels[star]}`}
                className="p-1.5 transition-all hover:scale-125 focus:scale-125 focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg group"
              >
                <Star
                  size={32}
                  className={`transition-all duration-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] ${
                    isActive
                      ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                />
              </button>
            );
          })}
        </div>
        
        {/* Dynamic Label with WCAG AA Color Contrast */}
        <div className="h-5 flex items-center justify-center">
          {(hoveredStar > 0 || rating > 0) && (
            <p className={`text-xs font-black uppercase tracking-wider ${
              (hoveredStar || rating) >= 4 ? 'text-emerald-400' :
              (hoveredStar || rating) >= 3 ? 'text-amber-400' : 'text-rose-450'
            }`}>
              {ratingLabels[hoveredStar || rating]}
            </p>
          )}
        </div>
      </div>

      {/* Comment Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="review-comment-textarea" className="text-xs text-slate-300 font-bold tracking-wide">
            Your Written Review
          </label>
          <span className="text-[10px] text-slate-400 font-semibold bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
            Required
          </span>
        </div>
        <textarea
          id="review-comment-textarea"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe your experience with this business (quality, service, delivery...)"
          maxLength={1000}
          aria-required="true"
          className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all"
        />
        <div className="flex items-center justify-between text-[11px] font-medium">
          <p className="text-slate-400">Minimum 10 characters</p>
          <p className={comment.length > 900 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
            {comment.length} / 1000
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          role="alert" 
          className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-rose-950/40 border-2 border-rose-800/40 text-rose-300 animate-shake"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
          <p className="text-xs font-semibold leading-snug">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-violet-950/20"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <Send size={12} />
            <span>Submit Review</span>
          </>
        )}
      </button>
    </div>
  );
}
