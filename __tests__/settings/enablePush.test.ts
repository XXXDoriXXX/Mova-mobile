import { registerPushToken } from "@/api/push";
import { registerForPush } from "@/notifications/registration";
import { enablePushNotifications } from "@/features/settings/application/enablePush";

jest.mock("@/notifications/registration", () => ({
  registerForPush: jest.fn(),
}));
jest.mock("@/api/push", () => ({
  registerPushToken: jest.fn(),
}));
jest.mock("@/observability/callLog", () => ({
  callWarn: jest.fn(),
  callLog: jest.fn(),
}));

describe("enablePushNotifications", () => {
  beforeEach(() => jest.clearAllMocks());

  it("registers the token with the backend when permission is granted", async () => {
    (registerForPush as jest.Mock).mockResolvedValue({
      status: "granted",
      token: "tok-1",
    });
    (registerPushToken as jest.Mock).mockResolvedValue(undefined);

    const outcome = await enablePushNotifications();

    expect(registerPushToken).toHaveBeenCalledWith(
      expect.objectContaining({ token: "tok-1", kind: "data" }),
    );
    expect(outcome).toBe("granted");
  });

  it("returns 'error' (not a false success) when the backend registration fails", async () => {
    (registerForPush as jest.Mock).mockResolvedValue({
      status: "granted",
      token: "tok-1",
    });
    (registerPushToken as jest.Mock).mockRejectedValue(new Error("network"));

    const outcome = await enablePushNotifications();

    expect(outcome).toBe("error");
  });

  it("does not call the backend when permission is denied", async () => {
    (registerForPush as jest.Mock).mockResolvedValue({ status: "denied" });

    const outcome = await enablePushNotifications();

    expect(registerPushToken).not.toHaveBeenCalled();
    expect(outcome).toBe("denied");
  });
});
