import { Review, ProjectReviewStats } from "@/common/types/review";
import { authService } from "./auth-service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ReviewService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await authService.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Get reviews for a project with pagination
   */
  async getProjectReviews(
    projectId: string,
    page = 1,
    limit = 10
  ): Promise<ProjectReviewStats> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_URL}/reviews/project/${projectId}?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch reviews");
    }

    return response.json();
  }

  /**
   * Get a single review by ID
   */
  async getReview(id: string): Promise<Review> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}/reviews/${id}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch review");
    }

    return response.json();
  }

  /**
   * Get review stats for a project
   */
  async getProjectStats(projectId: string): Promise<ProjectReviewStats> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_URL}/reviews/project/${projectId}/stats`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch review stats");
    }

    return response.json();
  }
}

const reviewService = new ReviewService();
export default reviewService;
