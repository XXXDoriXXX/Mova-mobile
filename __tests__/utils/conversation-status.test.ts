import { selectConversationStatusMeta } from "@/utils/conversation-status";

describe("selectConversationStatusMeta", () => {
  it.each([
    ["pending", { iconName: "ellipse-outline", tone: "muted" }],
    ["active", { iconName: "radio", tone: "success" }],
    ["ended", { iconName: "checkmark-circle", tone: "muted" }],
    ["failed", { iconName: "alert-circle", tone: "danger" }],
  ] as const)("%s → %j", (status, expected) => {
    expect(selectConversationStatusMeta(status)).toEqual(expected);
  });
});
