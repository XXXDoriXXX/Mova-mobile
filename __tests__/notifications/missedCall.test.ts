jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn(async () => "id"),
}));

import * as Notifications from "expo-notifications";

import { postMissedCallNotification } from "@/notifications/missedCall";

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;

afterEach(() => jest.clearAllMocks());

describe("postMissedCallNotification", () => {
  it("posts an immediate missed-call notification naming the caller", async () => {
    await postMissedCallNotification("Ada");

    expect(schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Пропущений дзвінок",
          body: expect.stringContaining("Ada"),
          data: { type: "missed_call" },
        }),
        trigger: null,
      }),
    );
  });

  it("swallows scheduling errors", async () => {
    schedule.mockRejectedValueOnce(new Error("boom"));
    await expect(postMissedCallNotification("Ada")).resolves.toBeUndefined();
  });
});
