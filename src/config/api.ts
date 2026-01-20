// src/services/axiosConfig.ts
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { BaseQueryFn } from "@reduxjs/toolkit/query";
import { authService } from "@/services/auth-service";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// API ROUTES
export const API_ROUTES = {
  users: "/users",
  deployments: "/deployments",
};

export const AXIOS = axios.create({
  baseURL: API_URL,
});

// Request interceptor that adds the token to requests
AXIOS.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await authService.getToken();

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor that handles token expiration
AXIOS.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Clear token cache to force a fresh token on retry
      authService.clearTokenCache();

      // Get a fresh token and retry the request
      const token = await authService.getToken();

      if (token) {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        } else {
          originalRequest.headers = { Authorization: `Bearer ${token}` };
        }

        return AXIOS(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method: AxiosRequestConfig["method"];
      data?: AxiosRequestConfig["data"];
      body?: AxiosRequestConfig["data"];
      params?: AxiosRequestConfig["params"];
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data, body, params }) => {
    try {
      const result = await AXIOS({
        url: url,
        method,
        data: data || body,
        params,
      });
      return {
        data: result.data.data || result.data,
        meta: result.data,
      };
    } catch (axiosError) {
      const err = axiosError as AxiosError<{
        message: string;
        statusCode: number;
      }>;
      return {
        error: {
          status: err.response?.data?.statusCode || err.status,
          message: err.response?.data?.message || err.message,
        },
      };
    }
  };
