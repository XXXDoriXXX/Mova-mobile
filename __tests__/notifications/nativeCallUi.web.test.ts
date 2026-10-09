import callKeep from "react-native-callkeep";
import {
  dismissNativeCall,
  isNativeCallUiAvailable,
  presentIncomingCall,
  setupNativeCallUi,
} from "@/notifications/nativeCallUi";

jest.mock("react-native", () => ({ Platform: { OS: "web" } }));
jest.mock("react-native-callkeep", () => ({
  setup: jest.fn(async () => { throw new Error("Native call UI unavailable on web"); }),
  displayIncomingCall: jest.fn(() => { throw new Error("Native call UI unavailable on web"); }),
  endCall: jest.fn(() => { throw new Error("Native call UI unavailable on web"); }),
}));

it("keeps browser signaling free of native call UI setup, presentation and dismissal", async () => {
  expect(isNativeCallUiAvailable()).toBe(false);
  await expect(setupNativeCallUi({ onAnswer: jest.fn(), onEnd: jest.fn() })).resolves.toBeUndefined();
  await expect(presentIncomingCall({
    conversationId: "test-conversation", roomName: "test-room",
    caller: { id: "caller", name: "Tester" },
  })).resolves.toBeUndefined();
  expect(() => dismissNativeCall("test-conversation")).not.toThrow();
  expect(callKeep.setup).not.toHaveBeenCalled();
  expect(callKeep.displayIncomingCall).not.toHaveBeenCalled();
  expect(callKeep.endCall).not.toHaveBeenCalled();
});
