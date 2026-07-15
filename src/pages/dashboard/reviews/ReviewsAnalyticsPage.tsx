import { motion } from 'framer-motion';
import {
  Star, MessageSquare, ThumbsUp, AlertCircle, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
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
  cyan: '#06b6d4',
};

export default function ReviewsAnalyticsPage() {
  const { reviews, loading, analytics } = useOutletContext<ReviewsOutletContext>();
  const {
    averageRating,
    ratingDistribution,
    monthlyTrend,
    ratingTrend,
    positiveReviews,
    negativeReviews,
    responseRate,
    pendingCount,
    reviewsThisMonth,
  } = analytics;

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
      </div>
    );
  }

  const sentimentData = [
    { name: 'Positive', value: positiveReviews, color: CHART_COLORS.success },
    { name: 'Negative', value: negativeReviews, color: CHART_COLORS.danger },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Average Rating',
            value: averageRating,
            icon: Star,
            color: 'from-yellow-500 to-orange-500',
            extra: <StarRating rating={Math.round(parseFloat(averageRating))} size="sm" />,
          },
          {
            label: 'Total Reviews',
            value: reviews.length,
            icon: MessageSquare,
            color: 'from-blue-500 to-cyan-500',
            extra: <p className="text-xs text-gray-500 mt-3">{reviewsThisMonth} this month</p>,
          },
          {
            label: 'Positive Reviews',
            value: positiveReviews,
            icon: ThumbsUp,
            color: 'from-green-500 to-emerald-500',
            extra: (
              <p className="text-xs text-gray-500 mt-3">
                {reviews.length > 0 ? Math.round((positiveReviews / reviews.length) * 100) : 0}% of total
              </p>
            ),
          },
          {
            label: 'Needs Attention',
            value: negativeReviews,
            icon: AlertCircle,
            color: 'from-red-500 to-rose-500',
            extra: <p className="text-xs text-gray-500 mt-3">{pendingCount} pending reply</p>,
          },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.label === 'Needs Attention' ? 'text-red-400' : stat.label === 'Positive Reviews' ? 'text-green-400' : 'text-white'}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-3">{stat.extra}</div>
          </motion.div>
        ))}
      </div>

      {/* Response Rate Banner */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Response Rate
            </h3>
            <p className="text-sm text-gray-400 mt-1">Percentage of reviews that have been replied to</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">{responseRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Response Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{reviews.length - pendingCount}</p>
              <p className="text-xs text-gray-500 mt-1">Replied</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
              <p className="text-xs text-gray-500 mt-1">Pending</p>
            </div>
          </div>
        </div>
        <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${responseRate}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rating Trend */}
        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Rating Trend Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="week" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 5]} stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="rating" stroke={CHART_COLORS.yellow} strokeWidth={2} dot={{ fill: CHART_COLORS.yellow, r: 3 }} name="Avg Rating" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Reviews - Positive vs Negative */}
        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Reviews (Positive vs Negative)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="positive" stackId="a" fill={CHART_COLORS.success} name="Positive" radius={[0, 0, 0, 0]} />
                <Bar dataKey="negative" stackId="a" fill={CHART_COLORS.danger} name="Negative" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Rating Distribution + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          className="glass-card p-4 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Rating Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis dataKey="rating" type="category" stroke="#6b7280" tick={{ fontSize: 10 }} width={30} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {ratingDistribution.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.rating >= 4 ? CHART_COLORS.success : entry.rating === 3 ? CHART_COLORS.warning : CHART_COLORS.danger}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Positive vs Negative</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ value }) => value}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Positive ({positiveReviews})</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Negative ({negativeReviews})</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
