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

    // Capture genuine failures (server 5xx + network/timeout) for
    // investigation — never the expected 4xx business errors, and never the
    // telemetry endpoint itself (that would recurse).
    const isTelemetry = config?.url?.includes("/telemetry/");
    if ((!status || status >= 500) && !isTelemetry) {
      reportApiFailure(error, {
        method: config?.method,
        url: config?.url,
        status,
        code: error.code,
      });
    }

    return Promise.reject(error);
  },
);

/**
 * Lazily forward a failed request to the telemetry pipeline. Loaded via
 * require() at call time to break the module cycle
 * client → observability/telemetry → api/telemetry → client.
 */
function reportApiFailure(error: unknown, context: Record<string, unknown>): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/observability/telemetry") as {
      reportError: (e: unknown, o?: { context?: Record<string, unknown> }) => void;
    };
    mod.reportError(error, { context: { source: "api", ...context } });
  } catch {
    // telemetry unavailable — ignore
  }
}

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
