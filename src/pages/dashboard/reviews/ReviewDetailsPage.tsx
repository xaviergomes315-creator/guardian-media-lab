import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, User, Calendar, Star, Reply, MessageSquare, CheckCircle, Clock, ExternalLink,
} from 'lucide-react';
import { reviewsService } from '../../../services/reviewsService';
import { GoogleReview, REVIEW_STATUS_COLORS, REVIEW_STATUS_LABELS } from '../../../types';
import StarRating from '../../../components/reviews/StarRating';

export default function ReviewDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<GoogleReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchReview = async () => {
      setLoading(true);
      try {
        const data = await reviewsService.getById(id);
        setReview(data);
      } catch {
        setReview(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="empty-state glass-card">
        <div className="empty-state-icon">
          <MessageSquare className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-gray-400">Review not found</p>
        <button onClick={() => navigate('/dashboard/reviews/list')} className="btn-secondary mt-4">
          Back to Reviews
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/dashboard/reviews/list')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Reviews
      </button>

      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Review Details
          </h1>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${REVIEW_STATUS_COLORS[review.status]}`}>
            {REVIEW_STATUS_LABELS[review.status]}
          </span>
        </div>

        {/* Customer Profile */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-white/5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0">
            {review.reviewer_photo ? (
              <img src={review.reviewer_photo} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-lg">{review.reviewer_name}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <StarRating rating={review.rating} size="md" />
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(review.review_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Business Location */}
          <div className="p-4 rounded-lg bg-white/5">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Business Location
            </p>
            <p className="text-sm text-white">{review.location_name || 'Not specified'}</p>
          </div>

          {/* Rating Summary */}
          <div className="p-4 rounded-lg bg-white/5">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Star className="w-3 h-3" />
              Rating
            </p>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="md" />
              <span className="text-sm text-white">{review.rating}/5</span>
            </div>
          </div>

          {/* Review Date */}
          <div className="p-4 rounded-lg bg-white/5">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Review Date
            </p>
            <p className="text-sm text-white">
              {new Date(review.review_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Status */}
          <div className="p-4 rounded-lg bg-white/5">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Reply Status
            </p>
            <p className="text-sm text-white capitalize">{review.status.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Full Review */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Full Review</h4>
          <div className="p-4 rounded-lg bg-white/5">
            <p className="text-gray-300 leading-relaxed">
              {review.review_text || 'No review text provided'}
            </p>
          </div>
        </div>

        {/* Reply History */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Reply History</h4>
          {review.reply_text ? (
            <div className="p-4 rounded-lg bg-blue-500/10 border-l-2 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-blue-400">Replied</span>
              </div>
              <p className="text-gray-300 leading-relaxed">{review.reply_text}</p>
              <p className="text-xs text-gray-500 mt-3">
                Replied on {new Date(review.replied_at || '').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {review.replied_by && ' by team member'}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-white/5 border border-dashed border-white/10">
              <p className="text-sm text-gray-400">No reply has been sent yet.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {review.status !== 'replied' && (
            <button
              onClick={() => navigate(`/dashboard/reviews/reply?reviewId=${review.id}`)}
              className="btn-primary flex items-center gap-2"
            >
              <Reply className="w-4 h-4" />
              {review.reply_text ? 'Edit Reply' : 'Write Reply'}
            </button>
          )}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(review.reviewer_name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View on Google
          </a>
        </div>
      </motion.div>
    </div>
  );
}
