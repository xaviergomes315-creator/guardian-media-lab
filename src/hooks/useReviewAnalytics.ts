import { useMemo } from 'react';
import { GoogleReview } from '../types';

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export interface MonthlyReviewTrend {
  month: string;
  total: number;
  positive: number;
  negative: number;
  avgRating: number;
}

export interface RatingTrendPoint {
  week: string;
  rating: number;
  count: number;
}

export function useReviewAnalytics(reviews: GoogleReview[]) {
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '0.0';
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingDistribution: RatingDistribution[] = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => {
      const count = reviews.filter((r) => r.rating === rating).length;
      return {
        rating,
        count,
        percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
      };
    });
  }, [reviews]);

  const monthlyTrend: MonthlyReviewTrend[] = useMemo(() => {
    const months: Record<string, { month: string; total: number; positive: number; negative: number; ratingSum: number }> = {};
    reviews.forEach((review) => {
      const date = new Date(review.review_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[monthKey]) {
        months[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          total: 0,
          positive: 0,
          negative: 0,
          ratingSum: 0,
        };
      }
      months[monthKey].total++;
      months[monthKey].ratingSum += review.rating;
      if (review.rating >= 4) months[monthKey].positive++;
      else months[monthKey].negative++;
    });
    return Object.entries(months)
      .map(([key, m]) => ({
        key,
        ...m,
        avgRating: m.total > 0 ? Number((m.ratingSum / m.total).toFixed(1)) : 0,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, ...m }) => m)
      .slice(-6);
  }, [reviews]);

  const ratingTrend: RatingTrendPoint[] = useMemo(() => {
    const weeks: Record<string, { week: string; rating: number; count: number }> = {};
    reviews.forEach((review) => {
      const date = new Date(review.review_date);
      const weekKey = date.toISOString().slice(0, 10);
      if (!weeks[weekKey]) {
        weeks[weekKey] = { week: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), rating: 0, count: 0 };
      }
      weeks[weekKey].rating += review.rating;
      weeks[weekKey].count++;
    });
    return Object.entries(weeks)
      .map(([key, w]) => ({
        key,
        ...w,
        rating: Number((w.rating / w.count).toFixed(1)),
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, ...w }) => w)
      .slice(-14);
  }, [reviews]);

  const positiveReviews = useMemo(() => reviews.filter((r) => r.rating >= 4).length, [reviews]);
  const negativeReviews = useMemo(() => reviews.filter((r) => r.rating < 4).length, [reviews]);
  const responseRate = useMemo(() => {
    if (reviews.length === 0) return 0;
    return Math.round((reviews.filter((r) => r.status === 'replied').length / reviews.length) * 100);
  }, [reviews]);

  const pendingCount = useMemo(() => reviews.filter((r) => r.status !== 'replied').length, [reviews]);
  const repliedCount = useMemo(() => reviews.filter((r) => r.status === 'replied').length, [reviews]);
  const reviewsThisMonth = useMemo(() => {
    const now = new Date();
    return reviews.filter((r) => {
      const d = new Date(r.review_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [reviews]);

  return {
    averageRating,
    ratingDistribution,
    monthlyTrend,
    ratingTrend,
    positiveReviews,
    negativeReviews,
    responseRate,
    pendingCount,
    repliedCount,
    reviewsThisMonth,
  };
}
