import type { ConversationStatus } from "@/types/api";

export type ConversationStatusTone = "danger" | "success" | "muted";

export type ConversationStatusMeta = {
  iconName: "ellipse-outline" | "radio" | "checkmark-circle" | "alert-circle";
  tone: ConversationStatusTone;
};

export function selectConversationStatusMeta(
  status: ConversationStatus,
): ConversationStatusMeta {
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
