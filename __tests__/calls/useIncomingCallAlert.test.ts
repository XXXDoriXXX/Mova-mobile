import { renderHook } from "@testing-library/react-native";
import { Vibration } from "react-native";

import { useIncomingCallAlert } from "@/features/calls/incoming/application/useIncomingCallAlert";

const vibrate = jest
  .spyOn(Vibration, "vibrate")
  .mockImplementation(() => undefined);
const cancel = jest
  .spyOn(Vibration, "cancel")
  .mockImplementation(() => undefined);

describe("useIncomingCallAlert", () => {
  beforeEach(() => {
    vibrate.mockClear();
    cancel.mockClear();
  });

  it("vibrates in a repeating pattern while active", () => {
    renderHook(() => useIncomingCallAlert(true));
    expect(vibrate).toHaveBeenCalledWith([0, 600, 400, 600], true);
  });

  it("does not vibrate when inactive", () => {
    renderHook(() => useIncomingCallAlert(false));
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("cancels the vibration when it stops being active", () => {
    const { rerender } = renderHook(
      ({ active }) => useIncomingCallAlert(active),
      { initialProps: { active: true } },
    );
    rerender({ active: false });
    expect(cancel).toHaveBeenCalled();
  });

  it("cancels the vibration on unmount", () => {
    const { unmount } = renderHook(() => useIncomingCallAlert(true));
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
