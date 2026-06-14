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
const STACK_CAP = 8_000;
const FLUSH_DEBOUNCE_MS = 2_000;
const MAX_ATTEMPTS = 5;
const QUEUE_KEY = "mova.telemetryQueue.v1";

const PERSIST_BUDGET_BYTES = 1_900;
const PERSIST_STACK_CAP = 700;
const PERSIST_MESSAGE_CAP = 300;

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

function slimForPersist(e: QueuedEvent): QueuedEvent {
  return {
    name: e.name,
    message: e.message.slice(0, PERSIST_MESSAGE_CAP),
    stack: e.stack ? e.stack.slice(0, PERSIST_STACK_CAP) : undefined,
    fatal: e.fatal,
    platform: e.platform,
    appVersion: e.appVersion,
    deviceModel: e.deviceModel,
    osVersion: e.osVersion,
    screen: e.screen,
    conversationId: e.conversationId,
    clientCreatedAt: e.clientCreatedAt,
    _attempts: e._attempts,
  };
}

async function persist(): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    const kept: QueuedEvent[] = [];
    for (let i = queue.length - 1; i >= 0; i--) {
      const slim = slimForPersist(queue[i]!);
      if (JSON.stringify([slim, ...kept]).length > PERSIST_BUDGET_BYTES) break;
      kept.unshift(slim);
    }
    if (kept.length === 0) {
      await SecureStore.deleteItemAsync(QUEUE_KEY).catch(() => undefined);
      return;
    }
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(kept));
  } catch {
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
