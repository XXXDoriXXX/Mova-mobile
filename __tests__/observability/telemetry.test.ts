import * as SecureStore from "expo-secure-store";

import { sendClientErrors } from "@/api/telemetry";
import {
  recordBreadcrumb,
  reportError,
  setCurrentScreen,
} from "@/observability/telemetry";

jest.mock("@/api/telemetry", () => ({
  sendClientErrors: jest.fn().mockResolvedValue(undefined),
}));

const mockedSetItem = SecureStore.setItemAsync as jest.MockedFunction<
  typeof SecureStore.setItemAsync
>;

const mockedSend = sendClientErrors as jest.MockedFunction<
  typeof sendClientErrors
>;

describe("telemetry", () => {
  beforeEach(() => {
    mockedSend.mockClear();
  });

  it("builds and flushes a fatal error report with breadcrumbs + screen", async () => {
    setCurrentScreen("/call/live");
    recordBreadcrumb({ level: "info", category: "call", message: "call.ws.connecting" });
    recordBreadcrumb({ level: "warning", category: "call", message: "call.ws.disconnect" });

    reportError(new TypeError("boom"), {
      fatal: true,
      conversationId: "11111111-1111-4111-8111-111111111111",
      context: { extra: 1 },
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(mockedSend).toHaveBeenCalledTimes(1);
    const [events] = mockedSend.mock.calls[0]!;
    expect(events).toHaveLength(1);
    const ev = events[0]!;
    expect(ev.name).toBe("TypeError");
    expect(ev.message).toBe("boom");
    expect(ev.fatal).toBe(true);
    expect(ev.screen).toBe("/call/live");
    expect(ev.conversationId).toBe("11111111-1111-4111-8111-111111111111");
    expect(ev.breadcrumbs?.map((b) => b.message)).toEqual(
      expect.arrayContaining(["call.ws.connecting", "call.ws.disconnect"]),
    );
    expect(ev.context).toMatchObject({ extra: 1 });
    expect(ev.stack).toContain("boom");
  });

  it("never throws when given a non-Error value", () => {
    expect(() => reportError("plain string", { fatal: true })).not.toThrow();
  });

  it("keeps the persisted SecureStore value under the 2KB warning threshold", async () => {
    mockedSetItem.mockClear();
    mockedSend.mockRejectedValue(new Error("offline"));
    for (let i = 0; i < 40; i++) {
      recordBreadcrumb({ level: "info", message: "x".repeat(300) + i });
    }
    for (let i = 0; i < 10; i++) {
      const err = new Error("y".repeat(5000));
      err.stack = "z".repeat(20000);
      reportError(err, { fatal: true, context: { big: "w".repeat(5000) } });
    }
    await new Promise((r) => setTimeout(r, 10));
    mockedSend.mockResolvedValue(undefined);

    const persistedSizes = mockedSetItem.mock.calls
      .filter(([key]) => key === "mova.telemetryQueue.v1")
      .map(([, value]) => value.length);
    expect(persistedSizes.length).toBeGreaterThan(0);
    for (const size of persistedSizes) {
      expect(size).toBeLessThanOrEqual(2048);
    }
  });
});
