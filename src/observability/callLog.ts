import { addBreadcrumb, captureException } from "./sentry";
import { recordBreadcrumb, reportError } from "./telemetry";

type Fields = Record<string, unknown>;

export function callLog(evt: string, fields?: Fields): void {
  if (__DEV__) {
    console.log(`[mova/call] ${evt}`, fields ?? "");
  }
  addBreadcrumb({ category: "call", level: "info", message: evt, data: fields });
  recordBreadcrumb({ category: "call", level: "info", message: evt, data: fields });
}

export function callWarn(evt: string, fields?: Fields): void {
  if (__DEV__) {
    console.warn(`[mova/call] ${evt}`, fields ?? "");
  }
  addBreadcrumb({ category: "call", level: "warning", message: evt, data: fields });
  recordBreadcrumb({ category: "call", level: "warning", message: evt, data: fields });
}

export function callError(evt: string, error: unknown, fields?: Fields): void {
  if (__DEV__) {
    console.error(`[mova/call] ${evt}`, error, fields ?? "");
  }
  addBreadcrumb({ category: "call", level: "error", message: evt, data: fields });
  recordBreadcrumb({ category: "call", level: "error", message: evt, data: fields });
  captureException(error, { evt, ...fields });
  reportError(error, {
    conversationId: typeof fields?.conversationId === "string" ? fields.conversationId : undefined,
    context: { evt, ...fields },
  });
}
