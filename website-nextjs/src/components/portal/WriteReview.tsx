'use client';

import { useState } from 'react';
import { Star, Send, Loader2, X } from 'lucide-react';

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
      setError('Please select a rating');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmit({ rating, comment: comment.trim() });
      setSuccess(true);
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center animate-fade-in-up">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Star size={24} className="text-emerald-400 fill-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Thank You!</h3>
        <p className="text-sm text-gray-400 mt-1">Your review for {companyName} has been published.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Write a Review</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Share your experience with {companyName}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Star Rating */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-125"
            >
              <Star
                size={28}
                className={`transition-colors ${
                  star <= (hoveredStar || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>
        {(hoveredStar > 0 || rating > 0) && (
          <p className={`text-xs font-semibold ${
            (hoveredStar || rating) >= 4 ? 'text-emerald-400' :
            (hoveredStar || rating) >= 3 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {ratingLabels[hoveredStar || rating]}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400 font-medium">Your Review</label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience..."
          maxLength={1000}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 resize-none transition-colors"
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-600">Minimum 10 characters</p>
          <p className={`text-[10px] ${comment.length > 900 ? 'text-amber-400' : 'text-gray-600'}`}>
            {comment.length}/1000
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/15">
          <p className="text-[11px] text-rose-400">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}
