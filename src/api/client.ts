/* eslint-disable import/no-named-as-default-member */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/auth/store";
import { API_BASE_URL } from "@/constants/env";
import type { ApiErrorPayload } from "@/types/api";

import { performRefresh } from "./refresh";

// Augment Axios request config to carry our metadata without `any`.
declare module "axios" {
  export interface AxiosRequestConfig {
    meta?: {
      idempotencyKey?: string;
      skipAuth?: boolean;
      retried?: boolean;
    };
  }
  export interface InternalAxiosRequestConfig {
    meta?: {
      idempotencyKey?: string;
      skipAuth?: boolean;
      retried?: boolean;
    };
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && !config.meta?.skipAuth) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (config.meta?.idempotencyKey) {
    config.headers.set("Idempotency-Key", config.meta.idempotencyKey);
  }
  if (__DEV__) {
    console.log(
      `[mova/api] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    );
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(
        `[mova/api] ← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
      );
    }
    return response;
  },
  async (error: AxiosError<ApiErrorPayload>) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;

    if (__DEV__) {
      console.log(
        `[mova/api] ✗ ${error.code ?? status ?? "ERR"} ${config?.method?.toUpperCase()} ${config?.url} — ${error.message}`,
      );
    }

    if (
      status === 401 &&
      config &&
      !config.meta?.skipAuth &&
      !config.meta?.retried &&
      !config.url?.includes("/auth/refresh")
    ) {
      const tokens = await performRefresh();
      if (!tokens) return Promise.reject(error);

      config.meta = { ...config.meta, retried: true };
      config.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
      return apiClient.request(config);
    }

    return Promise.reject(error);
  },
);

export type RequestOptions = AxiosRequestConfig & {
  meta?: { idempotencyKey?: string; skipAuth?: boolean };
};

export function extractErrorPayload(
  err: unknown,
): ApiErrorPayload | undefined {
  if (axios.isAxiosError<ApiErrorPayload>(err)) {
    return err.response?.data;
  }
  return undefined;
}
