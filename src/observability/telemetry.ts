import { AppState, Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

import { sendClientErrors, type ClientErrorEvent } from "@/api/telemetry";

type BreadcrumbLevel = "debug" | "info" | "warning" | "error";

export type Breadcrumb = {
  ts: number;
  level: BreadcrumbLevel;
  category?: string;
  message: string;
  data?: Record<string, unknown>;
};

export type ReportOptions = {
  fatal?: boolean;
  conversationId?: string;
  context?: Record<string, unknown>;
};

const MAX_BREADCRUMBS = 50;
const MAX_QUEUE = 30;
const MAX_PERSISTED = 15;
const STACK_CAP = 8_000;
const FLUSH_DEBOUNCE_MS = 2_000;
const MAX_ATTEMPTS = 5;
const QUEUE_KEY = "mova.telemetryQueue.v1";

type QueuedEvent = ClientErrorEvent & { _attempts?: number };

const breadcrumbs: Breadcrumb[] = [];
let queue: QueuedEvent[] = [];
let currentScreen: string | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let started = false;

function platform(): ClientErrorEvent["platform"] {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "web") return "web";
  return "ios";
}

function deviceContext() {
  return {
    platform: platform(),
    appVersion: Constants.expoConfig?.version ?? undefined,
    osVersion: String(Platform.Version),
    deviceModel: Constants.deviceName ?? undefined,
  };
}

export function setCurrentScreen(screen: string | null): void {
  currentScreen = screen;
}

export function recordBreadcrumb(crumb: Omit<Breadcrumb, "ts">): void {
  breadcrumbs.push({ ts: Date.now(), ...crumb });
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.splice(0, breadcrumbs.length - MAX_BREADCRUMBS);
  }
}

function toEvent(error: unknown, opts: ReportOptions): ClientErrorEvent {
  const err =
    error instanceof Error ? error : new Error(safeStringify(error));
  const device = deviceContext();
  return {
    name: err.name || "Error",
    message: (err.message || "Unknown error").slice(0, 4000),
    stack: err.stack ? err.stack.slice(0, STACK_CAP) : undefined,
    fatal: opts.fatal ?? false,
    platform: device.platform,
    appVersion: device.appVersion,
    osVersion: device.osVersion,
    deviceModel: device.deviceModel,
    screen: currentScreen ?? undefined,
    conversationId: opts.conversationId,
    breadcrumbs: breadcrumbs.slice(-MAX_BREADCRUMBS),
    context: {
      appState: AppState.currentState,
      ...(opts.context ?? {}),
    },
    clientCreatedAt: new Date().toISOString(),
  };
}

/**
 * Capture an error for storage on the backend. Builds a report from the
 * current breadcrumb trail + device/screen context and enqueues it for
 * (retried) delivery. Fatal reports flush immediately — the process may be
 * about to die, so we fire the request without waiting for the debounce.
 */
export function reportError(error: unknown, opts: ReportOptions = {}): void {
  try {
    const event = toEvent(error, opts);
    queue.push(event);
    if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
    void persist();
    if (event.fatal) {
      void flush();
    } else {
      scheduleFlush();
    }
  } catch {
    // observability must never throw into the app
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_DEBOUNCE_MS);
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.slice(0, 20);
  try {
    await sendClientErrors(batch.map(stripInternal));
    queue = queue.slice(batch.length);
    await persist();
  } catch {
    for (const e of batch) e._attempts = (e._attempts ?? 0) + 1;
    queue = queue.filter((e) => (e._attempts ?? 0) < MAX_ATTEMPTS);
    await persist();
  } finally {
    flushing = false;
  }
}

function stripInternal(e: QueuedEvent): ClientErrorEvent {
  const { _attempts, ...rest } = e;
  void _attempts;
  return rest;
}

async function persist(): Promise<void> {
  try {
    const slim = queue.slice(-MAX_PERSISTED);
    if (Platform.OS === "web") return;
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(slim));
  } catch {
    // ignore persistence failures
  }
}

async function restore(): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    const raw = await SecureStore.getItemAsync(QUEUE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as QueuedEvent[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      queue = [...parsed, ...queue].slice(-MAX_QUEUE);
    }
  } catch {
    // ignore restore failures
  }
}

export function initTelemetry(): void {
  if (started) return;
  started = true;
  void restore().then(() => {
    if (queue.length > 0) void flush();
  });
  AppState.addEventListener("change", (state) => {
    if (state === "active" && queue.length > 0) void flush();
  });
}

function safeStringify(v: unknown): string {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}
