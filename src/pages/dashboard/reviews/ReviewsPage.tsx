import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MessageSquare,
  TrendingUp,
  Search,
  Reply,
  Trash2,
  Download,
  Clock,
  CheckCircle,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  Settings,
  BarChart3,
  MapPin,
  User,
  ExternalLink,
  FileText,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ThumbsUp,
  ChevronDown,
  Link,
  Bell,
  Save,
  Eye,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { supabase } from '../../../lib/supabase';
import { aiService } from '../../../services/api';
import { GoogleReview, ReviewStatus } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

const ITEMS_PER_PAGE = 10;

const REVIEW_STATUS_COLORS: Record<ReviewStatus, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  replied: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending_reply: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  new: 'New',
  replied: 'Replied',
  pending_reply: 'Pending Reply',
};

const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  cyan: '#06b6d4',
  yellow: '#eab308',
  green: '#22c55e',
};

type ViewTab = 'reviews' | 'analytics' | 'settings';

interface ReplyTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
}

const DEFAULT_TEMPLATES: ReplyTemplate[] = [
  { id: '1', name: 'Thank You (Positive)', content: 'Thank you so much for your wonderful review! We are thrilled to hear that you had a great experience with us. Your feedback means a lot to our team, and we look forward to serving you again!', is_default: true },
  { id: '2', name: 'Appreciation', content: 'We truly appreciate you taking the time to share your experience. It\'s customers like you that make our business thrive. Thank you for your support!', is_default: false },
  { id: '3', name: 'Address Concern', content: 'Thank you for your feedback. We\'re sorry to hear about your experience and would like to make it right. Please contact us directly so we can address your concerns personally.', is_default: false },
  { id: '4', name: 'Professional', content: 'We appreciate your review and value your feedback. Our team is committed to providing the best service possible, and we\'ll use your comments to improve.', is_default: false },
];

export default function ReviewsPage() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<GoogleReview | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('reviews');
  const [templates] = useState<ReplyTemplate[]>(DEFAULT_TEMPLATES);
  const [showTemplates, setShowTemplates] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    isConnected: false,
    businessName: '',
    location: '',
    autoSync: false,
    syncInterval: 'daily',
    notifyNewReviews: true,
    notifyNegativeReviews: true,
    notifyPendingReplies: true,
  });

  useEffect(() => {
    fetchReviews();
    loadSettings();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('google_reviews')
      .select('*')
      .order('review_date', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      showToast('error', 'Failed to load reviews');
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('googleReviewsSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('googleReviewsSettings', JSON.stringify(updated));
    showToast('success', 'Settings saved');
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from('google_reviews')
      .update({
        reply_text: replyText.trim(),
        replied_at: new Date().toISOString(),
        replied_by: profile?.id,
        status: 'replied',
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedReview.id);

    if (error) {
      showToast('error', 'Failed to send reply');
    } else {
      setReviews(prev =>
        prev.map(r => r.id === selectedReview.id ? {
          ...r,
          reply_text: replyText.trim(),
          replied_at: new Date().toISOString(),
          status: 'replied',
        } : r)
      );
      setShowReplyModal(false);
      setSelectedReview(null);
      setReplyText('');
      showToast('success', 'Reply sent successfully');
    }
    setIsSubmitting(false);
  };

  const handleStarToggle = async (reviewId: string, currentStarred: boolean) => {
    const { error } = await supabase
      .from('google_reviews')
      .update({ starred: !currentStarred, updated_at: new Date().toISOString() })
      .eq('id', reviewId);

    if (error) {
      showToast('error', 'Failed to update');
    } else {
      setReviews(prev =>
        prev.map(r => r.id === reviewId ? { ...r, starred: !currentStarred } : r)
      );
      showToast('success', currentStarred ? 'Review unstarred' : 'Review starred');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('google_reviews').delete().eq('id', id);
    if (error) {
      showToast('error', 'Failed to delete review');
    } else {
      setReviews(prev => prev.filter(r => r.id !== id));
      setDeleteConfirm(null);
      showToast('success', 'Review deleted');
    }
  };

  const handleExportCSV = () => {
    if (filteredReviews.length === 0) {
      showToast('error', 'No reviews to export');
      return;
    }
    const headers = ['Reviewer', 'Rating', 'Review', 'Reply', 'Status', 'Date', 'Location'];
    const rows = filteredReviews.map(r => [
      r.reviewer_name,
      r.rating,
      r.review_text || '',
      r.reply_text || '',
      r.status,
      new Date(r.review_date).toLocaleDateString(),
      r.location_name || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-reviews-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Reviews exported to CSV');
  };

  const handleExportPDF = () => {
    if (filteredReviews.length === 0) {
      showToast('error', 'No reviews to export');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Reviews Export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat { background: #f5f5f5; padding: 15px; border-radius: 8px; flex: 1; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .review { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .reviewer { font-weight: bold; }
          .rating { color: #f59e0b; }
          .date { color: #666; font-size: 12px; }
          .review-text { margin: 10px 0; line-height: 1.6; }
          .reply { background: #f0f9ff; padding: 10px; border-left: 3px solid #3b82f6; margin-top: 10px; }
          .reply-label { font-weight: bold; color: #3b82f6; font-size: 12px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>Google Business Reviews Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${reviews.length}</div>
            <div>Total Reviews</div>
          </div>
          <div class="stat">
            <div class="stat-value">${averageRating}</div>
            <div>Average Rating</div>
          </div>
          <div class="stat">
            <div class="stat-value">${reviews.filter(r => r.status === 'replied').length}</div>
            <div>Replied</div>
          </div>
          <div class="stat">
            <div class="stat-value">${reviews.filter(r => r.status !== 'replied').length}</div>
            <div>Pending</div>
          </div>
        </div>
        ${filteredReviews.map(r => `
          <div class="review">
            <div class="review-header">
              <span class="reviewer">${r.reviewer_name}</span>
              <span class="rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            <div class="date">${new Date(r.review_date).toLocaleDateString()} ${r.location_name ? `- ${r.location_name}` : ''}</div>
            <div class="review-text">${r.review_text || 'No review text'}</div>
            ${r.reply_text ? `
              <div class="reply">
                <div class="reply-label">Our Response:</div>
                ${r.reply_text}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      showToast('success', 'PDF export ready');
    }
  };

  const generateAIReply = async (review: GoogleReview) => {
    setAiGenerating(true);
    try {
      const prompt = `Write a professional, warm, and appropriate response to this customer review:
Reviewer Name: ${review.reviewer_name}
Rating: ${review.rating} Stars
Review Text: "${review.review_text || 'No comment text left.'}"

Ensure the response addresses the review rating. If positive (4-5 stars), express deep gratitude. If neutral (3 stars), thank them and offer direct support for improvements. If negative (1-2 stars), apologize politely and request them to contact us directly to resolve it. Keep the reply concise and professional.`;

      const generatedReply = await aiService.generate.generateText(prompt, {
        auto_save_history: false // Do not pollute AI History tab with review replies
      });

      setReplyText(generatedReply);
      showToast('success', 'AI reply generated');
    } catch (err: any) {
      console.error('Failed to generate AI reply:', err);
      showToast('error', err.message || 'Failed to generate AI reply. Please check your Gemini settings.');
    } finally {
      setAiGenerating(false);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
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

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
    }));
  }, [reviews]);

  const monthlyReviews = useMemo(() => {
    const months: Record<string, { month: string; total: number; positive: number; negative: number }> = {};
    reviews.forEach(review => {
      const date = new Date(review.review_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[monthKey]) {
        months[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          total: 0,
          positive: 0,
          negative: 0,
        };
      }
      months[monthKey].total++;
      if (review.rating >= 4) months[monthKey].positive++;
      else months[monthKey].negative++;
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [reviews]);

  const ratingTrend = useMemo(() => {
    const weeks: Record<string, { week: string; rating: number; count: number }> = {};
    reviews.forEach(review => {
      const date = new Date(review.review_date);
      const weekKey = date.toISOString().slice(0, 10);
      if (!weeks[weekKey]) {
        weeks[weekKey] = { week: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), rating: 0, count: 0 };
      }
      weeks[weekKey].rating += review.rating;
      weeks[weekKey].count++;
    });
    return Object.values(weeks)
      .map(w => ({ ...w, rating: Number((w.rating / w.count).toFixed(1)) }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-14);
  }, [reviews]);

  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const negativeReviews = reviews.filter(r => r.rating < 4).length;
  const responseRate = reviews.length > 0
    ? Math.round((reviews.filter(r => r.status === 'replied').length / reviews.length) * 100)
    : 0;

  const stats = [
    { label: 'Total Reviews', value: reviews.length, icon: MessageSquare, color: 'from-blue-500 to-cyan-500' },
    { label: 'Average Rating', value: averageRating, icon: Star, color: 'from-yellow-500 to-orange-500' },
    { label: 'Response Rate', value: `${responseRate}%`, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { label: 'Pending Replies', value: reviews.filter(r => r.status !== 'replied').length, icon: Clock, color: 'from-purple-500 to-pink-500' },
  ];

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            Google Business Reviews
          </h1>
          <p className="text-sm text-gray-400 mt-1">Monitor, analyze, and respond to customer reviews</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (activeTab === 'settings') saveSettings(settings);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sync
          </button>
          <div className="relative">
            <button
              onClick={() => {}}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        {[
          { id: 'reviews', label: 'Reviews', icon: MessageSquare },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ViewTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <>
          {/* Stats */}
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
              </motion.div>
            ))}
          </div>

          {/* Rating Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div
              className="glass-card p-4 lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Rating Breakdown</h3>
              <div className="space-y-3">
                {ratingDistribution.map(({ rating, count }) => {
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <button
                        onClick={() => setRatingFilter(ratingFilter === rating ? 'all' : rating as any)}
                        className={`flex items-center gap-1 min-w-[70px] ${ratingFilter === rating ? 'text-blue-400' : 'text-gray-400'}`}
                      >
                        <span className="text-sm">{rating}</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      </button>
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
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              className="glass-card p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Sentiment</h3>
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
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-400">Positive ({positiveReviews})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-400">Negative ({negativeReviews})</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="glass-card p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search reviews..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={sentimentFilter}
                onChange={(e) => { setSentimentFilter(e.target.value as any); setCurrentPage(1); }}
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
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value as any); setCurrentPage(1); }}
                className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="all" className="bg-gray-900">All Time</option>
                <option value="7d" className="bg-gray-900">Last 7 Days</option>
                <option value="30d" className="bg-gray-900">Last 30 Days</option>
                <option value="90d" className="bg-gray-900">Last 90 Days</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="btn-secondary flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading reviews...</p>
              </div>
            ) : currentReviews.length === 0 ? (
              <div className="text-center py-12 glass-card">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No reviews found</p>
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
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0">
                      {review.reviewer_photo ? (
                        <img src={review.reviewer_photo} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {review.reviewer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white">{review.reviewer_name}</p>
                            {review.starred && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {renderStars(review.rating)}
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

                      {/* Reply Section */}
                      {review.reply_text && (
                        <div className="mt-3 pl-4 border-l-2 border-blue-500/30">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-blue-400">Your Reply</span>
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          </div>
                          <p className="text-xs text-gray-400">{review.reply_text}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setShowDetailsModal(true);
                          }}
                          className="btn-secondary text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View Details
                        </button>
                        {review.status !== 'replied' && (
                          <button
                            onClick={() => {
                              setSelectedReview(review);
                              setReplyText(`Thank you for your feedback, ${review.reviewer_name.split(' ')[0]}! We appreciate you taking the time to share your experience. `);
                              setShowReplyModal(true);
                            }}
                            className="btn-primary text-xs flex items-center gap-1"
                          >
                            <Reply className="w-3 h-3" />
                            Reply
                          </button>
                        )}
                        <button
                          onClick={() => handleStarToggle(review.id, review.starred)}
                          className={`btn-secondary text-xs flex items-center gap-1 ${review.starred ? 'text-yellow-400' : ''}`}
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Average Rating</p>
                  <p className="text-3xl font-bold text-white mt-1">{averageRating}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {renderStars(Math.round(parseFloat(averageRating)), 'md')}
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Reviews</p>
                  <p className="text-3xl font-bold text-white mt-1">{reviews.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {reviews.filter(r => {
                  const reviewDate = new Date(r.review_date);
                  const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return reviewDate >= monthAgo;
                }).length} this month
              </p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Positive Reviews</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">{positiveReviews}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <ThumbsUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {reviews.length > 0 ? Math.round((positiveReviews / reviews.length) * 100) : 0}% of total
              </p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Needs Attention</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">{negativeReviews}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {reviews.filter(r => r.rating < 4 && r.status !== 'replied').length} pending reply
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Rating Trend */}
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Rating Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratingTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="week" stroke="#6b7280" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} stroke="#6b7280" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="rating" stroke="#eab308" strokeWidth={2} dot={{ fill: '#eab308', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Reviews */}
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Monthly Reviews</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyReviews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="positive" fill="#22c55e" name="Positive" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="negative" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Rating Distribution Chart */}
          <div className="glass-card p-4">
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
                      <Cell key={index} fill={entry.rating >= 4 ? '#22c55e' : entry.rating === 3 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Google Business Connection */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Link className="w-5 h-5" />
              Google Business Connection
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${settings.isConnected ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    {settings.isConnected ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <ExternalLink className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {settings.isConnected ? 'Connected to Google Business' : 'Not Connected'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {settings.isConnected ? settings.businessName || 'Business connected' : 'Connect to sync reviews automatically'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!settings.isConnected) {
                      showToast('success', 'Connection placeholder - API integration needed');
                    }
                  }}
                  className={`btn-${settings.isConnected ? 'secondary' : 'primary'} flex items-center gap-2`}
                >
                  {settings.isConnected ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Connected
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      Connect Google
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={settings.businessName}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                    placeholder="Your Business Name"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Location</label>
                  <input
                    type="text"
                    value={settings.location}
                    onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sync Settings */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Auto Sync Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Enable Auto Sync</p>
                  <p className="text-sm text-gray-400">Automatically fetch new reviews</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoSync: !settings.autoSync })}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.autoSync ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.autoSync ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {settings.autoSync && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sync Interval</label>
                  <select
                    value={settings.syncInterval}
                    onChange={(e) => setSettings({ ...settings, syncInterval: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white"
                  >
                    <option value="hourly" className="bg-gray-900">Every Hour</option>
                    <option value="daily" className="bg-gray-900">Daily</option>
                    <option value="weekly" className="bg-gray-900">Weekly</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </h3>
            <div className="space-y-4">
              {[
                { key: 'notifyNewReviews', label: 'New Reviews', description: 'Get notified when you receive a new review' },
                { key: 'notifyNegativeReviews', label: 'Negative Reviews', description: 'Get alerted on reviews with 3 stars or less' },
                { key: 'notifyPendingReplies', label: 'Pending Replies', description: 'Reminder for reviews that need a response' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings[item.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => saveSettings(settings)}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      <AnimatePresence>
        {showReplyModal && selectedReview && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReplyModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-2xl w-full my-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Reply className="w-5 h-5" />
                  Reply to Review
                </h3>
                <button onClick={() => setShowReplyModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Original Review */}
              <div className="p-4 rounded-lg bg-white/5 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {selectedReview.reviewer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{selectedReview.reviewer_name}</p>
                    <div className="flex items-center gap-2">
                      {renderStars(selectedReview.rating)}
                      <span className="text-xs text-gray-400">
                        {new Date(selectedReview.review_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{selectedReview.review_text || 'No review text provided'}</p>
              </div>

              {/* Templates */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Quick Templates</label>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {showTemplates ? 'Hide' : 'Show'} Templates
                  </button>
                </div>
                {showTemplates && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setReplyText(template.content.replace('{name}', selectedReview.reviewer_name.split(' ')[0]))}
                        className="p-3 text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 transition-colors"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Input */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Your Reply</label>
                  <button
                    onClick={() => generateAIReply(selectedReview)}
                    disabled={aiGenerating}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows={5}
                  placeholder="Write your response..."
                />
                <p className="text-xs text-gray-500 mt-1">{replyText.length} characters</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="flex-1 btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || isSubmitting}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedReview && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-2xl w-full my-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Review Details
                </h3>
                <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Customer Profile */}
              <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-white/5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                  {selectedReview.reviewer_photo ? (
                    <img src={selectedReview.reviewer_photo} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white text-lg">{selectedReview.reviewer_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {renderStars(selectedReview.rating, 'md')}
                    <span className="text-sm text-gray-400">
                      {new Date(selectedReview.review_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${REVIEW_STATUS_COLORS[selectedReview.status]}`}>
                    {REVIEW_STATUS_LABELS[selectedReview.status]}
                  </span>
                </div>
              </div>

              {/* Business Location */}
              {selectedReview.location_name && (
                <div className="mb-4 p-3 rounded-lg bg-white/5 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-300">{selectedReview.location_name}</span>
                </div>
              )}

              {/* Review Text */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Review</h4>
                <p className="text-gray-300 leading-relaxed">
                  {selectedReview.review_text || 'No review text provided'}
                </p>
              </div>

              {/* Reply History */}
              {selectedReview.reply_text && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Your Response</h4>
                  <div className="p-4 rounded-lg bg-blue-500/10 border-l-2 border-blue-500">
                    <p className="text-gray-300">{selectedReview.reply_text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Replied on {new Date(selectedReview.replied_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedReview.status !== 'replied' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setReplyText(`Thank you for your feedback, ${selectedReview.reviewer_name.split(' ')[0]}! `);
                      setShowReplyModal(true);
                    }}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <Reply className="w-4 h-4" />
                    Write Reply
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
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
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-white text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
