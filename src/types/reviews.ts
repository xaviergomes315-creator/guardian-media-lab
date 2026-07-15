import { Dispatch, SetStateAction } from 'react';
import { GoogleReview } from './index';
import { useReviewAnalytics } from '../hooks/useReviewAnalytics';

export interface ReviewsOutletContext {
  reviews: GoogleReview[];
  loading: boolean;
  fetchReviews: () => Promise<void>;
  analytics: ReturnType<typeof useReviewAnalytics>;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export type SetState<T> = Dispatch<SetStateAction<T>>;
