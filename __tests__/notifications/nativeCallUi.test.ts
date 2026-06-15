jest.mock("react-native-callkeep", () => {
  const listeners = new Map();
  return {
    __listeners: listeners,
    setup: jest.fn(async () => undefined),
    setAvailable: jest.fn(),
    setReachable: jest.fn(),
    registerPhoneAccount: jest.fn(),
    displayIncomingCall: jest.fn(),
    endCall: jest.fn(),
    backToForeground: jest.fn(),
    addEventListener: jest.fn((event, cb) => {
      listeners.set(event, cb);
    }),
    removeEventListener: jest.fn(),
  };
});

import callKeepMock from "react-native-callkeep";

import {
  presentIncomingCall,
  setupNativeCallUi,
} from "@/features/calls/incoming/application/nativeCallUi";

const mock = callKeepMock as unknown as {
  __listeners: Map<string, (payload: unknown) => void>;
  setup: jest.Mock;
  displayIncomingCall: jest.Mock;
  backToForeground: jest.Mock;
};

const call = {
  conversationId: "conv-1",
  roomName: "room-1",
  caller: { id: "user-2", name: "Ada" },
};

describe("nativeCallUi", () => {
  it("dispatches a lockscreen answer to onAnswer and foregrounds the app", async () => {
    const onAnswer = jest.fn();
    await setupNativeCallUi({ onAnswer, onEnd: jest.fn() });

    mock.__listeners.get("answerCall")?.({ callUUID: "conv-1" });

    expect(onAnswer).toHaveBeenCalledWith("conv-1");
    expect(mock.backToForeground).toHaveBeenCalled();
  });

  it("dispatches a lockscreen decline to onEnd", async () => {
    const onEnd = jest.fn();
    await setupNativeCallUi({ onAnswer: jest.fn(), onEnd });

    mock.__listeners.get("endCall")?.({ callUUID: "conv-1" });

    expect(onEnd).toHaveBeenCalledWith("conv-1");
  });

  it("replays a buffered killed-state answer via didLoadWithEvents", async () => {
    const onAnswer = jest.fn();
    await setupNativeCallUi({ onAnswer, onEnd: jest.fn() });

    mock.__listeners.get("didLoadWithEvents")?.([
      {
        name: "RNCallKeepPerformAnswerCallAction",
        data: { callUUID: "conv-9" },
      },
    ]);

    expect(onAnswer).toHaveBeenCalledWith("conv-9");
  });

  it("presents the incoming call with the caller identity", async () => {
    await setupNativeCallUi({ onAnswer: jest.fn(), onEnd: jest.fn() });

    await presentIncomingCall(call);

    expect(mock.displayIncomingCall).toHaveBeenCalledWith(
      "conv-1",
      "user-2",
      "Ada",
      "generic",
      false,
    );
  });

  it("sets up callkeep only once across repeated mounts", async () => {
    await setupNativeCallUi({ onAnswer: jest.fn(), onEnd: jest.fn() });
    await setupNativeCallUi({ onAnswer: jest.fn(), onEnd: jest.fn() });

    expect(mock.setup).toHaveBeenCalledTimes(1);
  });
});
