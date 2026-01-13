import { AXIOS, API_ROUTES } from "../config/api";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    roles: string[];
    profile_picture?: string;
  };
}

export interface OtpResponse {
  message: string;
  email: string;
  expiresIn: number;
}

/**
 * Request OTP for passwordless login (Seller)
 */
export const requestOtp = async (email: string): Promise<OtpResponse> => {
  const response = await AXIOS.post<OtpResponse>("/auth/seller/otp/request", {
    email,
  });
  return response.data;
};

/**
 * Verify OTP and get tokens (Seller)
 */
export const verifyOtp = async (
  email: string,
  code: string
): Promise<AuthResponse> => {
  const response = await AXIOS.post<AuthResponse>("/auth/seller/otp/verify", {
    email,
    code,
  });
  return response.data;
};

/**
 * Google authentication (Seller)
 */
export const googleAuth = async (idToken: string): Promise<AuthResponse> => {
  const response = await AXIOS.post<AuthResponse>("/auth/seller/google", {
    idToken,
  });
  return response.data;
};

/**
 * Refresh access token
 */
export const refreshAuthToken = async (
  refreshToken: string
): Promise<AuthResponse> => {
  const response = await AXIOS.post<AuthResponse>("/auth/seller/refresh", {
    refreshToken,
  });
  return response.data;
};

/**
 * Store tokens in localStorage
 */
export const storeTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

/**
 * Get stored access token
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

/**
 * Clear stored tokens
 */
export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
