import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Eye, Reply, Star, Trash2, MapPin, MessageSquare, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { ReviewsOutletContext } from '../../../types/reviews';
import { ReviewStatus, REVIEW_STATUS_COLORS, REVIEW_STATUS_LABELS } from '../../../types';
import { reviewsService } from '../../../services/reviewsService';
import StarRating from '../../../components/reviews/StarRating';

const ITEMS_PER_PAGE = 10;

type RatingFilter = 'all' | 1 | 2 | 3 | 4 | 5;
type SentimentFilter = 'all' | 'positive' | 'negative';
type DateFilter = 'all' | '7d' | '30d' | '90d';

export default function ReviewsListPage() {
  const { reviews, loading, fetchReviews, showToast } = useOutletContext<ReviewsOutletContext>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch =
        review.reviewer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.review_text?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter;
      const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
      const matchesSentiment =
        sentimentFilter === 'all' ||
        (sentimentFilter === 'positive' && review.rating >= 4) ||
        (sentimentFilter === 'negative' && review.rating < 4);

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const reviewDate = new Date(review.review_date);
        const now = new Date();
        const daysAgo = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
        const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        matchesDate = reviewDate >= cutoff;
      }

      return matchesSearch && matchesRating && matchesStatus && matchesSentiment && matchesDate;
    });
  }, [reviews, searchQuery, ratingFilter, statusFilter, sentimentFilter, dateFilter]);

  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentReviews = filteredReviews.slice(indexOfFirst, indexOfLast);

  const handleStarToggle = async (reviewId: string, currentStarred: boolean) => {
    try {
      await reviewsService.star(reviewId, !currentStarred);
      await fetchReviews();
      showToast('success', currentStarred ? 'Review unstarred' : 'Review starred');
    } catch {
      showToast('error', 'Failed to update review');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reviewsService.delete(id);
      await fetchReviews();
      setDeleteConfirm(null);
      showToast('success', 'Review deleted');
    } catch {
      showToast('error', 'Failed to delete review');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRatingFilter('all');
    setStatusFilter('all');
    setSentimentFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || ratingFilter !== 'all' || statusFilter !== 'all' || sentimentFilter !== 'all' || dateFilter !== 'all';

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by reviewer name or content..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={sentimentFilter}
            onChange={(e) => { setSentimentFilter(e.target.value as SentimentFilter); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white"
          >
            <option value="all" className="bg-gray-900">All Sentiment</option>
            <option value="positive" className="bg-gray-900">Positive (4-5)</option>
            <option value="negative" className="bg-gray-900">Negative (1-3)</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ReviewStatus | 'all'); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white"
          >
            <option value="all" className="bg-gray-900">All Status</option>
            <option value="new" className="bg-gray-900">New</option>
            <option value="pending_reply" className="bg-gray-900">Pending Reply</option>
            <option value="replied" className="bg-gray-900">Replied</option>
          </select>
          <select
            value={ratingFilter === 'all' ? 'all' : String(ratingFilter)}
            onChange={(e) => { setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as RatingFilter); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white"
          >
            <option value="all" className="bg-gray-900">All Ratings</option>
            <option value="5" className="bg-gray-900">5 Stars</option>
            <option value="4" className="bg-gray-900">4 Stars</option>
            <option value="3" className="bg-gray-900">3 Stars</option>
            <option value="2" className="bg-gray-900">2 Stars</option>
            <option value="1" className="bg-gray-900">1 Star</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value as DateFilter); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white"
          >
            <option value="all" className="bg-gray-900">All Time</option>
            <option value="7d" className="bg-gray-900">Last 7 Days</option>
            <option value="30d" className="bg-gray-900">Last 30 Days</option>
            <option value="90d" className="bg-gray-900">Last 90 Days</option>
          </select>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="btn-secondary flex items-center gap-2 px-4">
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {currentReviews.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-state-icon">
              <MessageSquare className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400">No reviews found</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-sm text-blue-400 hover:text-blue-300 mt-2">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          currentReviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="glass-card p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0">
                  {review.reviewer_photo ? (
                    <img src={review.reviewer_photo} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {review.reviewer_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{review.reviewer_name}</p>
                        {review.starred && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-gray-400">
                          {new Date(review.review_date).toLocaleDateString()}
                        </span>
                        {review.location_name && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {review.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${REVIEW_STATUS_COLORS[review.status]}`}>
                      {REVIEW_STATUS_LABELS[review.status]}
                    </span>
                  </div>

                  {review.review_text && (
                    <p className="mt-3 text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {review.review_text}
                    </p>
                  )}

                  {review.reply_text && (
                    <div className="mt-3 pl-4 border-l-2 border-blue-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-400">Your Reply</span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{review.reply_text}</p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/dashboard/reviews/${review.id}`)}
                      className="btn-secondary text-xs flex items-center gap-1 px-3 py-2"
                    >
                      <Eye className="w-3 h-3" />
                      View Details
                    </button>
                    {review.status !== 'replied' && (
                      <button
                        onClick={() => navigate(`/dashboard/reviews/reply?reviewId=${review.id}`)}
                        className="btn-primary text-xs flex items-center gap-1 px-3 py-2"
                      >
                        <Reply className="w-3 h-3" />
                        Reply
                      </button>
                    )}
                    <button
                      onClick={() => handleStarToggle(review.id, review.starred)}
                      className={`btn-secondary text-xs flex items-center gap-1 px-3 py-2 ${review.starred ? 'text-yellow-400' : ''}`}
                    >
                      <Star className={`w-3 h-3 ${review.starred ? 'fill-yellow-400' : ''}`} />
                      {review.starred ? 'Starred' : 'Star'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(review.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredReviews.length)} of {filteredReviews.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <motion.div
            className="modal-content max-w-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Review</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
