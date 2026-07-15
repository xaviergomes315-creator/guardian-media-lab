import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Reply, Sparkles, Send, X, MessageSquare, Plus, Trash2, Save, Edit2, Clock, CheckCircle,
} from 'lucide-react';
import {
  reviewTemplatesService,
  reviewsService,
} from '../../../services/reviewsService';
import {
  GoogleReview,
  ReviewReplyTemplate,
  ReviewTemplateCategory,
  REVIEW_TEMPLATE_CATEGORY_COLORS,
  REVIEW_TEMPLATE_CATEGORY_LABELS,
} from '../../../types';
import StarRating from '../../../components/reviews/StarRating';
import { useAuth } from '../../../contexts/AuthContext';

export default function ReplyManagementPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetReviewId = searchParams.get('reviewId');

  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [templates, setTemplates] = useState<ReviewReplyTemplate[]>([]);
  const [selectedReview, setSelectedReview] = useState<GoogleReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReviewReplyTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', content: '', category: 'general' as ReviewTemplateCategory });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (targetReviewId && reviews.length > 0) {
      const review = reviews.find((r) => r.id === targetReviewId);
      if (review) {
        setSelectedReview(review);
        setReplyText(review.reply_text || `Thank you for your feedback, ${review.reviewer_name.split(' ')[0]}! `);
      }
    }
  }, [targetReviewId, reviews]);

  const loadData = async () => {
    try {
      const [reviewData, templateData] = await Promise.all([
        reviewsService.getAll(),
        reviewTemplatesService.seedDefaultsIfEmpty(),
      ]);
      setReviews(reviewData);
      setTemplates(templateData);
    } catch {
      showToast('error', 'Failed to load data');
    }
  };

  const pendingReviews = useMemo(
    () => reviews.filter((r) => r.status !== 'replied'),
    [reviews]
  );

  const handleSendReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await reviewsService.reply(selectedReview.id, replyText.trim(), profile?.id || '');
      const updated = await reviewsService.getAll();
      setReviews(updated);
      showToast('success', 'Reply sent successfully');
      setSelectedReview(null);
      setReplyText('');
      if (targetReviewId) navigate('/dashboard/reviews/reply');
    } catch {
      showToast('error', 'Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAIReply = async () => {
    if (!selectedReview) return;
    setAiGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const firstName = selectedReview.reviewer_name.split(' ')[0];
    let generated = '';
    if (selectedReview.rating >= 4) {
      generated = `Thank you so much for your wonderful ${selectedReview.rating}-star review, ${firstName}! We're thrilled to hear that you had a great experience with us. Your kind words inspire our team to continue delivering the best service possible. We look forward to serving you again soon!`;
    } else if (selectedReview.rating === 3) {
      generated = `Thank you for your feedback, ${firstName}. We appreciate you taking the time to share your experience. We're constantly working to improve, and your input helps us identify areas where we can do better. Please don't hesitate to reach out directly if there's anything specific we can address.`;
    } else {
      generated = `We're sorry to hear about your experience, ${firstName}, and we take your feedback very seriously. We would love the opportunity to make things right. Please contact us directly so we can understand your concerns better and work towards a resolution. Thank you for bringing this to our attention.`;
    }
    setReplyText(generated);
    setAiGenerating(false);
    showToast('success', 'AI reply generated (placeholder)');
  };

  const applyTemplate = (template: ReviewReplyTemplate) => {
    const firstName = selectedReview?.reviewer_name.split(' ')[0] || '{name}';
    setReplyText(template.content.replace(/\{name\}/g, firstName));
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) return;
    try {
      if (editingTemplate) {
        await reviewTemplatesService.update(editingTemplate.id, templateForm);
        showToast('success', 'Template updated');
      } else {
        await reviewTemplatesService.create(templateForm);
        showToast('success', 'Template created');
      }
      const updated = await reviewTemplatesService.getAll();
      setTemplates(updated);
      setShowTemplateEditor(false);
      setEditingTemplate(null);
      setTemplateForm({ name: '', content: '', category: 'general' });
    } catch {
      showToast('error', 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await reviewTemplatesService.delete(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      showToast('success', 'Template deleted');
    } catch {
      showToast('error', 'Failed to delete template');
    }
  };

  const openTemplateEditor = (template?: ReviewReplyTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({ name: template.name, content: template.content, category: template.category });
    } else {
      setEditingTemplate(null);
      setTemplateForm({ name: '', content: '', category: 'general' });
    }
    setShowTemplateEditor(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Reviews List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Replies
              </h3>
              <span className="text-xs text-gray-400">{pendingReviews.length}</span>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {pendingReviews.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">All caught up!</p>
              ) : (
                pendingReviews.map((review) => (
                  <button
                    key={review.id}
                    onClick={() => {
                      setSelectedReview(review);
                      setReplyText(review.reply_text || `Thank you for your feedback, ${review.reviewer_name.split(' ')[0]}! `);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedReview?.id === review.id
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-white truncate">{review.reviewer_name}</p>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{review.review_text || 'No text'}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(review.review_date).toLocaleDateString()}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Reply Editor */}
        <div className="lg:col-span-2">
          {selectedReview ? (
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Reply className="w-5 h-5" />
                  Reply to Review
                </h3>
                <button onClick={() => { setSelectedReview(null); setReplyText(''); }} className="modal-close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Original Review */}
              <div className="p-4 rounded-lg bg-white/5 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {selectedReview.reviewer_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{selectedReview.reviewer_name}</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={selectedReview.rating} size="sm" />
                      <span className="text-xs text-gray-400">
                        {new Date(selectedReview.review_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{selectedReview.review_text || 'No review text provided'}</p>
              </div>

              {/* Templates Toggle */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Quick Templates</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowTemplatePanel(!showTemplatePanel)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {showTemplatePanel ? 'Hide' : 'Show'} Templates
                    </button>
                    <button
                      onClick={() => openTemplateEditor()}
                      className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      New
                    </button>
                  </div>
                </div>
                {showTemplatePanel && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="group p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <button
                            onClick={() => applyTemplate(template)}
                            className="text-left flex-1"
                          >
                            <p className="text-sm text-gray-300 font-medium">{template.name}</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs border mt-1 ${REVIEW_TEMPLATE_CATEGORY_COLORS[template.category]}`}>
                              {REVIEW_TEMPLATE_CATEGORY_LABELS[template.category]}
                            </span>
                          </button>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openTemplateEditor(template)}
                              className="p-1 rounded hover:bg-white/10 text-gray-400"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{template.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Input */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Your Reply</label>
                  <button
                    onClick={generateAIReply}
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
                  rows={6}
                  placeholder="Write your response..."
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">{replyText.length} characters</p>
                  {selectedReview.reply_text && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Previously replied
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setSelectedReview(null); setReplyText(''); }}
                  className="flex-1 btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isSubmitting}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-12">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <MessageSquare className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400">Select a review from the left to write a reply</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Editor Modal */}
      <AnimatePresence>
        {showTemplateEditor && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTemplateEditor(false)}
          >
            <motion.div
              className="modal-content max-w-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
                <button onClick={() => setShowTemplateEditor(false)} className="modal-close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Template Name</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g. Thank You Response"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as ReviewTemplateCategory })}
                    className="form-select"
                  >
                    <option value="positive" className="bg-gray-900">Positive</option>
                    <option value="neutral" className="bg-gray-900">Neutral</option>
                    <option value="negative" className="bg-gray-900">Negative</option>
                    <option value="general" className="bg-gray-900">General</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Content (use {'{name}'} for customer name)</label>
                  <textarea
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    rows={5}
                    placeholder="Write the template content..."
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowTemplateEditor(false)} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!templateForm.name.trim() || !templateForm.content.trim()}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {editingTemplate ? 'Update' : 'Create'}
                  </button>
                </div>
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
