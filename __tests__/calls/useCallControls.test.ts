import { renderHook } from "@testing-library/react-native";

import { useCallControls } from "@/features/calls/live/application/useCallControls";

describe("useCallControls", () => {
  it("speak emits user.speak with the text", () => {
    const send = jest.fn();
    const { result } = renderHook(() => useCallControls(send));
    result.current.speak("hello");
    expect(send).toHaveBeenCalledWith({
      type: "user.speak",
      data: { text: "hello" },
    });
  });

  it("acceptSuggestion emits with suggestionId", () => {
    const send = jest.fn();
    const { result } = renderHook(() => useCallControls(send));
    result.current.acceptSuggestion("s-1");
    expect(send).toHaveBeenCalledWith({
      type: "user.accept_suggestion",
      data: { suggestionId: "s-1" },
    });
  });

  it("acceptAiReply / cancelAiReply emit with candidateId", () => {
    const send = jest.fn();
    const { result } = renderHook(() => useCallControls(send));
    result.current.acceptAiReply("c-1");
    result.current.cancelAiReply("c-2");
    expect(send).toHaveBeenNthCalledWith(1, {
      type: "user.accept_ai_reply",
      data: { candidateId: "c-1" },
    });
    expect(send).toHaveBeenNthCalledWith(2, {
      type: "user.cancel_ai_reply",
      data: { candidateId: "c-2" },
    });
  });

  it("endCall emits without data", () => {
    const send = jest.fn();
    const { result } = renderHook(() => useCallControls(send));
    result.current.endCall();
    expect(send).toHaveBeenCalledWith({ type: "user.end_call" });
  });

  it("setAutoMode forwards the boolean", () => {
    const send = jest.fn();
    const { result } = renderHook(() => useCallControls(send));
    result.current.setAutoMode(true);
    result.current.setAutoMode(false);
    expect(send.mock.calls).toEqual([
      [{ type: "user.set_auto_mode", data: { enabled: true } }],
      [{ type: "user.set_auto_mode", data: { enabled: false } }],
    ]);
  });

  it("changeStyle / changeVoice emit the swap commands", () => {
    const send = jest.fn();
    const { result } = renderHook(() => useCallControls(send));
    result.current.changeStyle("personal");
    result.current.changeVoice("uk-UA-Wavenet-B");
    expect(send).toHaveBeenNthCalledWith(1, {
      type: "user.change_style",
      data: { styleId: "personal" },
    });
    expect(send).toHaveBeenNthCalledWith(2, {
      type: "user.change_voice",
      data: { voice: "uk-UA-Wavenet-B" },
    });
  });
});
