import * as Haptics from "expo-haptics";

export type HapticKind = "success" | "warning" | "error" | "selection" | "light";

export function triggerHaptic(kind: HapticKind): void {
  try {
    switch (kind) {
      case "success":
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      case "warning":
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      case "error":
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      case "selection":
        void Haptics.selectionAsync();
        return;
      case "light":
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
    }
  } catch {
  }
}
