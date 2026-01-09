import { Project } from "./project";

// Review status enum - reviews must be approved by owner before appearing
export enum ReviewStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface Review {
  id: string;
  project_id: string;
  user_id: string;
  user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: boolean;
  status: ReviewStatus;
  rejection_reason?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewDto {
  project_id: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface ApproveReviewDto {
  status: ReviewStatus.APPROVED | ReviewStatus.REJECTED;
  rejection_reason?: string;
}

export interface ProjectReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  reviews: Review[];
}

export interface PaginatedReviewsResponse {
  items: Review[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
  stats: {
    average_rating: number;
    rating_distribution: Record<number, number>;
  };
}
