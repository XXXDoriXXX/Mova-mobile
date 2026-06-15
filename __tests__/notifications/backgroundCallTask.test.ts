jest.mock("expo-task-manager", () => ({
  isTaskDefined: jest.fn(() => false),
  defineTask: jest.fn(),
}));

jest.mock("@/notifications/nativeCallUi", () => ({
  presentIncomingCall: jest.fn(async () => undefined),
}));

import { presentIncomingCall } from "@/notifications/nativeCallUi";
import { handleBackgroundCall } from "@/notifications/backgroundCallTask";

const present = presentIncomingCall as jest.Mock;

const callData = {
  type: "incoming_call",
  conversationId: "c1",
  roomName: "r1",
  callerId: "u1",
  callerName: "Ada",
};

afterEach(() => jest.clearAllMocks());

// The task callback receives { data, error } where `data` is the
// NotificationTaskPayload ({ notification, data: { dataString } }).
const taskBody = (dataString: string) => ({ data: { data: { dataString } } });

describe("handleBackgroundCall", () => {
  it("presents the native call for a killed-app incoming push", async () => {
    await handleBackgroundCall(taskBody(JSON.stringify(callData)));
    expect(present).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: "c1" }),
    );
  });

  it("ignores a task delivery error", async () => {
    await handleBackgroundCall({ error: { message: "boom" } });
    expect(present).not.toHaveBeenCalled();
  });

  it("ignores a non-call push", async () => {
    await handleBackgroundCall(taskBody('{"type":"marketing"}'));
    expect(present).not.toHaveBeenCalled();
  });
});
