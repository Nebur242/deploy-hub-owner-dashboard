import { Project } from "./project";

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
  project?: Project;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: boolean;
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
