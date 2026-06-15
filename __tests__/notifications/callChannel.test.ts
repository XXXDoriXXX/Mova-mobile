import { Platform } from "react-native";

jest.mock("expo-notifications", () => ({
  AndroidImportance: { MAX: 5 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  setNotificationChannelAsync: jest.fn(async () => undefined),
}));

import * as Notifications from "expo-notifications";

import {
  INCOMING_CALL_CHANNEL_ID,
  ensureIncomingCallChannel,
} from "@/notifications/callChannel";

const setChannel = Notifications.setNotificationChannelAsync as jest.Mock;
const originalOS = Platform.OS;

afterEach(() => {
  (Platform as { OS: string }).OS = originalOS;
  jest.clearAllMocks();
});

describe("ensureIncomingCallChannel", () => {
  it("creates a MAX-importance, DnD-bypassing call channel on Android", async () => {
    (Platform as { OS: string }).OS = "android";

    await ensureIncomingCallChannel();

    expect(setChannel).toHaveBeenCalledWith(
      INCOMING_CALL_CHANNEL_ID,
      expect.objectContaining({
        importance: 5,
        bypassDnd: true,
        lockscreenVisibility: 1,
        sound: "default",
      }),
    );
  });

  it("is a no-op on non-Android platforms", async () => {
    (Platform as { OS: string }).OS = "ios";

    await ensureIncomingCallChannel();

    expect(setChannel).not.toHaveBeenCalled();
  });

  it("uses the channel id the backend push targets", () => {
    expect(INCOMING_CALL_CHANNEL_ID).toBe("incoming-calls");
  });
});
