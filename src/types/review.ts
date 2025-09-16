export interface ReviewCategory {
  category: string;
  rating: number;
}

export interface Review {
  id: number;
  type: string;
  status: string;
  rating: number;
  publicReview: string;
  reviewCategory: ReviewCategory[];
  submittedAt: string;
  guestName: string;
  listingName: string;
  listingId: number;
  channel: string;
  approved: boolean;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  approvedReviews: number;
  pendingReviews: number;
  channelDistribution: Record<string, number>;
  categoryAverages: Record<string, number>;
}

export interface PropertyStats {
  listingId: number;
  listingName: string;
  totalReviews: number;
  averageRating: number;
  approvedReviews: number;
  pendingReviews: number;
  recentReviews: Review[];
}
