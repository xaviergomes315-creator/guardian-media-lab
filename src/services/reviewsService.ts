import { supabase } from '../lib/supabase';
import {
  GoogleReview,
  ReviewReplyTemplate,
  ReviewSettings,
  ReviewStatus,
  ReviewTemplateCategory,
  ReviewSyncInterval,
} from '../types';

const DEFAULT_TEMPLATES: Omit<ReviewReplyTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Thank You (Positive)',
    content:
      'Thank you so much for your wonderful review, {name}! We are thrilled to hear that you had a great experience with us. Your feedback means the world to our team, and we look forward to serving you again!',
    category: 'positive',
    is_default: true,
  },
  {
    name: 'Appreciation',
    content:
      "We truly appreciate you taking the time to share your experience, {name}. It's customers like you that make our business thrive. Thank you for your continued support!",
    category: 'positive',
    is_default: false,
  },
  {
    name: 'Address Concern',
    content:
      "Thank you for your feedback, {name}. We're sorry to hear about your experience and would like to make it right. Please contact us directly so we can address your concerns personally.",
    category: 'negative',
    is_default: false,
  },
  {
    name: 'Neutral Acknowledgment',
    content:
      'Thank you for your review, {name}. We appreciate your feedback and are always looking for ways to improve. Please let us know if there is anything we can do to enhance your experience.',
    category: 'neutral',
    is_default: false,
  },
  {
    name: 'Professional Response',
    content:
      "We appreciate your review and value your feedback, {name}. Our team is committed to providing the best service possible, and we'll use your comments to improve.",
    category: 'general',
    is_default: false,
  },
];

export const reviewsService = {
  async getAll(): Promise<GoogleReview[]> {
    const { data, error } = await supabase
      .from('google_reviews')
      .select('*')
      .order('review_date', { ascending: false });
    if (error) throw error;
    return (data || []) as GoogleReview[];
  },

  async getById(id: string): Promise<GoogleReview | null> {
    const { data, error } = await supabase
      .from('google_reviews')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as GoogleReview | null;
  },

  async reply(id: string, replyText: string, repliedBy: string): Promise<GoogleReview | null> {
    const { data, error } = await supabase
      .from('google_reviews')
      .update({
        reply_text: replyText,
        replied_at: new Date().toISOString(),
        replied_by: repliedBy,
        status: 'replied' as ReviewStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as GoogleReview | null;
  },

  async updateStatus(id: string, status: ReviewStatus): Promise<GoogleReview | null> {
    const { data, error } = await supabase
      .from('google_reviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as GoogleReview | null;
  },

  async star(id: string, starred: boolean): Promise<GoogleReview | null> {
    const { data, error } = await supabase
      .from('google_reviews')
      .update({ starred, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as GoogleReview | null;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('google_reviews').delete().eq('id', id);
    if (error) throw error;
  },

  async getStats() {
    const { count: total } = await supabase
      .from('google_reviews')
      .select('*', { count: 'exact', head: true });

    const { data: ratings } = await supabase.from('google_reviews').select('rating');
    const avgRating =
      ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    const { count: pending } = await supabase
      .from('google_reviews')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'pending_reply']);

    const { count: replied } = await supabase
      .from('google_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'replied');

    return {
      total: total || 0,
      avgRating,
      pending: pending || 0,
      replied: replied || 0,
    };
  },
};

export const reviewTemplatesService = {
  async getAll(): Promise<ReviewReplyTemplate[]> {
    const { data, error } = await supabase
      .from('google_review_templates')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as ReviewReplyTemplate[];
  },

  async create(template: {
    name: string;
    content: string;
    category: ReviewTemplateCategory;
    is_default?: boolean;
  }): Promise<ReviewReplyTemplate | null> {
    const { data, error } = await supabase
      .from('google_review_templates')
      .insert(template)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as ReviewReplyTemplate | null;
  },

  async update(
    id: string,
    updates: Partial<Pick<ReviewReplyTemplate, 'name' | 'content' | 'category' | 'is_default'>>
  ): Promise<ReviewReplyTemplate | null> {
    const { data, error } = await supabase
      .from('google_review_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as ReviewReplyTemplate | null;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('google_review_templates').delete().eq('id', id);
    if (error) throw error;
  },

  async seedDefaultsIfEmpty(): Promise<ReviewReplyTemplate[]> {
    const existing = await this.getAll();
    if (existing.length > 0) return existing;
    const created = await Promise.all(DEFAULT_TEMPLATES.map((t) => this.create(t)));
    return created.filter((t): t is ReviewReplyTemplate => t !== null);
  },
};

export const reviewSettingsService = {
  async get(): Promise<ReviewSettings | null> {
    const { data, error } = await supabase
      .from('google_review_settings')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data as ReviewSettings | null;
  },

  async upsert(settings: {
    is_connected?: boolean;
    business_name?: string | null;
    location?: string | null;
    auto_sync?: boolean;
    sync_interval?: ReviewSyncInterval;
    notify_new_reviews?: boolean;
    notify_negative_reviews?: boolean;
    notify_pending_replies?: boolean;
    last_synced_at?: string | null;
  }): Promise<ReviewSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('google_review_settings')
      .upsert(
        { ...settings, user_id: user.id },
        { onConflict: 'user_id' }
      )
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as ReviewSettings | null;
  },
};
