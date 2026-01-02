export interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  description: string | null;
  license_ids: string[];
  created_at: string;
  updated_at: string;
  remaining_uses: number | null;
}

export interface CreateCouponDto {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  license_ids?: string[];
  max_uses?: number;
  description?: string;
  expires_at?: string;
}

export interface UpdateCouponDto {
  discount_value?: number;
  description?: string;
  expires_at?: string;
  is_active?: boolean;
}

export interface ValidateCouponDto {
  code: string;
  license_id: string;
  base_amount: number;
}

export interface CouponValidationResponse {
  is_valid: boolean;
  code: string;
  discount_amount: number;
  final_amount: number;
  message?: string;
}

export interface CouponsResponse {
  items: Coupon[];
  meta: {
    itemCount: number;
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
  links?: {
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
  };
}
