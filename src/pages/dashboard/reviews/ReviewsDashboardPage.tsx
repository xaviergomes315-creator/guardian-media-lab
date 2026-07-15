import { motion } from 'framer-motion';
import { MessageSquare, Star, TrendingUp, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useOutletContext } from 'react-router-dom';
import { ReviewsOutletContext } from '../../../types/reviews';
import StarRating from '../../../components/reviews/StarRating';

const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  yellow: '#eab308',
};

export default function ReviewsDashboardPage() {
  const { reviews, loading, analytics } = useOutletContext<ReviewsOutletContext>();
  const { averageRating, ratingDistribution, monthlyTrend, positiveReviews, negativeReviews, responseRate, pendingCount, reviewsThisMonth } = analytics;

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Reviews', value: reviews.length, icon: MessageSquare, color: 'from-blue-500 to-cyan-500', sub: `${reviewsThisMonth} this month` },
    { label: 'Average Rating', value: averageRating, icon: Star, color: 'from-yellow-500 to-orange-500', sub: 'out of 5.0' },
    { label: 'Response Rate', value: `${responseRate}%`, icon: TrendingUp, color: 'from-green-500 to-emerald-500', sub: `${reviews.length - pendingCount} replied` },
    { label: 'Pending Replies', value: pendingCount, icon: Clock, color: 'from-purple-500 to-pink-500', sub: 'needs attention' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-4"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Rating Distribution + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          className="glass-card p-4 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 min-w-[70px]">
                  <span className="text-sm text-gray-300">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-sm text-white w-12 text-right">{count}</span>
                <span className="text-xs text-gray-500 w-12 text-right">{percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Sentiment Split</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Positive', value: positiveReviews, color: CHART_COLORS.success },
                      { name: 'Negative', value: negativeReviews, color: CHART_COLORS.danger },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {[
                      { name: 'Positive', value: positiveReviews, color: CHART_COLORS.success },
                      { name: 'Negative', value: negativeReviews, color: CHART_COLORS.danger },
                    ].map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Positive ({positiveReviews})</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Negative ({negativeReviews})</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monthly Review Trend */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Review Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="total" stroke={CHART_COLORS.primary} fill="url(#colorTotal)" strokeWidth={2} name="Total" />
              <Area type="monotone" dataKey="positive" stroke={CHART_COLORS.success} fill="url(#colorPositive)" strokeWidth={2} name="Positive" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Reviews Preview */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Reviews</h3>
          <a href="/dashboard/reviews/list" className="text-sm text-blue-400 hover:text-blue-300">
            View all
          </a>
        </div>
        <div className="space-y-3">
          {reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">
                  {review.reviewer_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white text-sm truncate">{review.reviewer_name}</p>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{review.review_text || 'No review text'}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(review.review_date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-center text-gray-400 py-8">No reviews yet</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
