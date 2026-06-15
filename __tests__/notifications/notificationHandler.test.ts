jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
}));

import * as Notifications from "expo-notifications";

import { installNotificationHandler } from "@/notifications/notificationHandler";

type Behavior = {
  shouldShowBanner: boolean;
  shouldShowList: boolean;
  shouldPlaySound: boolean;
};

const setHandler = Notifications.setNotificationHandler as jest.Mock;

function handlerFor(data: Record<string, unknown>): Promise<Behavior> {
  installNotificationHandler();
  const handler = setHandler.mock.calls[0]?.[0] as {
    handleNotification: (n: unknown) => Promise<Behavior>;
  };
  return handler.handleNotification({
    request: { content: { data } },
  });
}

afterEach(() => jest.clearAllMocks());

describe("installNotificationHandler", () => {
  it("suppresses the banner for an incoming_call push (call UI handles it)", async () => {
    const behavior = await handlerFor({ type: "incoming_call" });
    expect(behavior.shouldShowBanner).toBe(false);
    expect(behavior.shouldShowList).toBe(false);
    expect(behavior.shouldPlaySound).toBe(false);
  });

  it("shows ordinary notifications as a banner", async () => {
    const behavior = await handlerFor({ type: "marketing" });
    expect(behavior.shouldShowBanner).toBe(true);
    expect(behavior.shouldShowList).toBe(true);
  });
});
