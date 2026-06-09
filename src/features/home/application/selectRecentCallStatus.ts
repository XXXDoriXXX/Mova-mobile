import type { ConversationStatus } from "@/types/api";

export type RecentCallTone = "danger" | "success" | "muted";

export type RecentCallStatusMeta = {
  iconName: "ellipse-outline" | "radio" | "checkmark-circle" | "alert-circle";
  tone: RecentCallTone;
};

export function selectRecentCallStatus(status: ConversationStatus): RecentCallStatusMeta {
  switch (status) {
    case "pending":
      return { iconName: "ellipse-outline", tone: "muted" };
    case "active":
      return { iconName: "radio", tone: "success" };
    case "ended":
      return { iconName: "checkmark-circle", tone: "muted" };
    case "failed":
      return { iconName: "alert-circle", tone: "danger" };
  }
}
