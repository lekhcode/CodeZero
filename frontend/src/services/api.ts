import axios, { type AxiosError } from "axios";
import type { ApiErrorBody } from "@/types/api.types";
import { tokenStorage } from "@/utils/storage";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Single Axios instance — all feature services import this.
 * Interceptors handle auth injection and normalized error messages for UI toasts.
 */
export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiRequestError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status;
    this.code = options?.code;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
    }
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      "Something went wrong. Please try again.";
    throw new ApiRequestError(message, {
      status: error.response?.status,
      code: error.response?.data?.error?.code,
    });
  },
);

export async function unwrap<T>(promise: Promise<{ data: { success: true; data: T } }>): Promise<T> {
  const { data } = await promise;
  return data.data;
}
