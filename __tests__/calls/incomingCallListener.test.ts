jest.mock("expo-constants", () => ({ appOwnership: null }));
jest.mock("expo-notifications", () => ({
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

import * as Notifications from "expo-notifications";

import { addIncomingCallListener } from "@/notifications/incomingCallListener";

const getLast = Notifications.getLastNotificationResponseAsync as jest.Mock;

function launchResponse(identifier: string, data: Record<string, unknown>) {
  return {
    notification: { request: { identifier, content: { data } } },
  };
}

const flush = () => new Promise((r) => setImmediate(r));

describe("addIncomingCallListener cold start", () => {
  beforeEach(() => jest.clearAllMocks());

  it("opens the call from a launch (cold-start) notification", async () => {
    getLast.mockResolvedValue(
      launchResponse("n-cold-1", {
        type: "incoming_call",
        conversationId: "c1",
        roomName: "r1",
        callerId: "u1",
        callerName: "X",
      }),
    );
    const onIncoming = jest.fn();

    addIncomingCallListener(onIncoming);
    await flush();

    expect(onIncoming).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: "c1", roomName: "r1" }),
    );
  });

  it("does nothing when there is no launch notification", async () => {
    getLast.mockResolvedValue(null);
    const onIncoming = jest.fn();

    addIncomingCallListener(onIncoming);
    await flush();

    expect(onIncoming).not.toHaveBeenCalled();
  });

  it("ignores a launch notification that is not an incoming call", async () => {
    getLast.mockResolvedValue(
      launchResponse("n-cold-2", { type: "marketing" }),
    );
    const onIncoming = jest.fn();

    addIncomingCallListener(onIncoming);
    await flush();

    expect(onIncoming).not.toHaveBeenCalled();
  });
});
