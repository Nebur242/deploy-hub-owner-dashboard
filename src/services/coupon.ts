import {
  Coupon,
  CreateCouponDto,
  UpdateCouponDto,
  CouponsResponse,
  ValidateCouponDto,
  CouponValidationResponse,
} from "@/common/types/coupon";
import { authService } from "./auth-service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class CouponService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await authService.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Get all coupons for the current user with pagination
   */
  async getCoupons(page = 1, limit = 10): Promise<CouponsResponse> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_URL}/coupons?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch coupons");
    }

    const data = await response.json();
    // Handle Pagination response format {items, meta}
    if (data.items && data.meta) {
      return data as CouponsResponse;
    }
    // Fallback: if it's the old format {coupons, total}
    if (data.coupons && data.total !== undefined) {
      return {
        items: data.coupons,
        meta: {
          itemCount: data.coupons.length,
          totalItems: data.total,
          itemsPerPage: limit,
          totalPages: Math.ceil(data.total / limit),
          currentPage: page,
        },
      } as CouponsResponse;
    }
    // If wrapped in data property
    if (data.data && data.data.items) {
      return data.data as CouponsResponse;
    }
    return data;
  }

  /**
   * Get a single coupon by ID
   */
  async getCoupon(id: string): Promise<Coupon> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}/coupons/${id}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch coupon");
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Get all valid coupons (active, not expired, has uses remaining)
   */
  async getValidCoupons(): Promise<Coupon[]> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}/coupons/valid/list`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch valid coupons");
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Create a new coupon
   */
  async createCoupon(data: CreateCouponDto): Promise<Coupon> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}/coupons`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to create coupon");
    }

    return response.json();
  }

  /**
   * Update a coupon
   */
  async updateCoupon(id: string, data: UpdateCouponDto): Promise<Coupon> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}/coupons/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to update coupon");
    }

    return response.json();
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(id: string): Promise<void> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}/coupons/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to delete coupon");
    }
  }

  /**
   * Validate a coupon code (public endpoint)
   */
  async validateCoupon(
    data: ValidateCouponDto
  ): Promise<CouponValidationResponse> {
    const response = await fetch(`${API_URL}/coupons/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to validate coupon");
    }

    return response.json();
  }
}

const couponService = new CouponService();
export default couponService;
