import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  Layout,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

import { toast, useToastStore, type ToastVariant } from "./toastStore";

// Re-export the imperative API + types so consumers can import everything
// from this module (the visual host) when convenient.
export { toast, useToastStore };
export type { ToastVariant };

/**
 * Visual toast layer. Mounted ONCE at the very top of the tree (root
 * layout) so the pill renders above tabs, screens and any keyboard.
 *
 * One toast at a time — replacing the current one looks more decisive
 * than stacking; the spring layout animation handles the transition.
 *
 *   - success → forest pill, lime icon
 *   - error   → red pill, white icon
 *   - warning → white pill, warning-coloured icon
 *   - info    → white pill, ink icon
 *
 * Auto-dismisses after `DURATION_MS`; tapping the pill dismisses early.
 */
const DURATION_MS = 3200;

const ICON_FOR: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  warning: "warning",
  info: "information-circle",
};

export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const current = useToastStore((s) => s.current);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(dismiss, DURATION_MS);
    return () => clearTimeout(t);
  }, [current, dismiss]);

  if (!current) return null;

  const styling = (() => {
    switch (current.variant) {
      case "success":
        return {
          bg: theme.colors.surfaceInverse,
          fg: theme.colors.textOnInverse,
          iconColor: theme.colors.accent,
        };
      case "error":
        return {
          bg: theme.colors.danger,
          fg: theme.colors.primaryText,
          iconColor: theme.colors.primaryText,
        };
      case "warning":
        return {
          bg: theme.colors.surface,
          fg: theme.colors.text,
          iconColor: theme.colors.warning,
        };
      default:
        return {
          bg: theme.colors.surface,
          fg: theme.colors.text,
          iconColor: theme.colors.text,
        };
    }
  })();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: insets.bottom + 96,
        paddingHorizontal: 16,
        zIndex: 9999,
      }}
    >
      <Animated.View
        key={current.id}
        entering={FadeInDown.duration(220).springify().damping(14)}
        exiting={FadeOutDown.duration(160)}
        layout={Layout.springify().damping(14)}
      >
        <Pressable
          onPress={dismiss}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{
            backgroundColor: styling.bg,
            borderRadius: 22,
            paddingHorizontal: 14,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderWidth: current.variant === "info" || current.variant === "warning" ? 1 : 0,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.text,
            shadowOpacity: 0.18,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Ionicons
            name={ICON_FOR[current.variant]}
            size={20}
            color={styling.iconColor}
          />
          <View style={{ flex: 1, gap: 1 }}>
            {current.title ? (
              <Text
                variant="caption"
                weight="bold"
                style={{ color: styling.fg }}
              >
                {current.title}
              </Text>
            ) : null}
            <Text
              variant="body"
              weight="medium"
              style={{ color: styling.fg }}
              numberOfLines={3}
            >
              {current.message}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
