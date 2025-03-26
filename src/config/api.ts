import { BaseQueryFn } from "@reduxjs/toolkit/query";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { getAuth, getIdToken } from "firebase/auth";
import firebaseApp from "./firebase";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

//API ROUTES
export const API_ROUTES = {
  users: "/users",
};

export const AXIOS = axios.create({
  baseURL: API_URL,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
AXIOS.interceptors.request.use(async (config: any) => {
  const { currentUser } = getAuth(firebaseApp);
  if (currentUser) {
    const token = await getIdToken(currentUser, true);
    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    }
  }
  return config;
});

export const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method: AxiosRequestConfig["method"];
      data?: AxiosRequestConfig["data"];
      params?: AxiosRequestConfig["params"];
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data }) => {
    try {
      const result = await AXIOS({
        url: url,
        method,
        data,
      });
      return {
        data: result.data.data,
        meta: result.data,
      };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data,
        },
      };
    }
  };
