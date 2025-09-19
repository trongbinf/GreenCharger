export interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  productId: number;
  userId: string;
  orderId?: number;
}

export interface ReviewDto {
  id: number;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  productId: number;
  productName: string;
  userId: string;
  userName: string;
  userAvatar: string;
  orderId?: number;
  isHelpfulByCurrentUser: boolean;
}

export interface CreateReviewDto {
  productId: number;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  orderId?: number;
  requirePurchase: boolean;
}

export interface UpdateReviewDto {
  rating: number;
  title: string;
  comment: string;
  images: string[];
}

export interface ReviewStatsDto {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}