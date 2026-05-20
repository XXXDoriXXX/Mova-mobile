/* eslint-disable import/no-named-as-default-member */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/auth/store";
import { API_BASE_URL } from "@/constants/env";
import type { ApiErrorPayload, AuthTokens } from "@/types/api";

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
  return config;
});

// Single-flight refresh. While a refresh is in progress, parallel 401's wait
// on the same promise instead of each triggering their own refresh round-trip.
let refreshInflight: Promise<AuthTokens | null> | null = null;

async function performRefresh(): Promise<AuthTokens | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const resp = await axios.post<AuthTokens>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: 10_000 },
    );
    const next: AuthTokens = {
      accessToken: resp.data.accessToken,
      // Backend may rotate refresh; keep current one if not provided.
      refreshToken: resp.data.refreshToken ?? refreshToken,
    };
    await useAuthStore.getState().setTokens(next);
    return next;
  } catch {
    await useAuthStore.getState().clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      config &&
      !config.meta?.skipAuth &&
      !config.meta?.retried &&
      !config.url?.includes("/auth/refresh")
    ) {
      if (!refreshInflight) refreshInflight = performRefresh();
      const tokens = await refreshInflight.finally(() => {
        refreshInflight = null;
      });
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
