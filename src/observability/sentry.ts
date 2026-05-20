/**
 * Optional Sentry integration. When `EXPO_PUBLIC_SENTRY_DSN` isn't set the
 * functions are no-ops, so the rest of the codebase can call them
 * unconditionally without a feature flag.
 *
 * We load `@sentry/react-native` lazily via `require()` to keep apps without a
 * DSN free of the native module dependency — only call `initSentry()` once on
 * boot. All other helpers tolerate an uninitialized state.
 */

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
    // @sentry/react-native isn't installed → silently skip. Apps that need it
    // declare it as a dependency and re-bundle.
    sentry = null;
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!sentry) {
    // Fall back to console so developers still see something during dev.
    console.error("[unreported]", error, context);
    return;
  }
  try {
    sentry.captureException(error, { extra: context });
  } catch {
    // Swallow — observability must never crash the app.
  }
}

export function addBreadcrumb(crumb: Breadcrumb): void {
  if (!sentry) return;
  try {
    sentry.addBreadcrumb(crumb);
  } catch {
    // ignore
  }
}

export function setUserContext(user: { id: string; email: string } | null): void {
  if (!sentry) return;
  try {
    sentry.setUser(user);
  } catch {
    // ignore
  }
}
