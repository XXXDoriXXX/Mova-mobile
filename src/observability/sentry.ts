
import { SENTRY_DSN } from "@/constants/env";

type Breadcrumb = {
  message?: string;
  category?: string;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  data?: Record<string, unknown>;
};

let sentry: any = null;
let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;
  if (!SENTRY_DSN) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@sentry/react-native");
    mod.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
      enableAutoSessionTracking: true,
    });
    sentry = mod;
  } catch {
    sentry = null;
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!sentry) {
    console.error("[unreported]", error, context);
    return;
  }
  try {
    sentry.captureException(error, { extra: context });
  } catch {
  }
}

export function addBreadcrumb(crumb: Breadcrumb): void {
  if (!sentry) return;
  try {
    sentry.addBreadcrumb(crumb);
  } catch {
  }
}

export function setUserContext(user: { id: string; email: string } | null): void {
  if (!sentry) return;
  try {
    sentry.setUser(user);
  } catch {
  }
}
