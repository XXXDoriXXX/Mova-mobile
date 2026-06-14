import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  LinearTransition,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

import {
  toast,
  useToastStore,
  type ToastModel,
  type ToastVariant,
} from "./toastStore";

export { toast, useToastStore };
export type { ToastVariant };

const DURATION_MS = 3200;

const ICON_FOR: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  warning: "warning",
  info: "information-circle",
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const queue = useToastStore((s) => s.queue);

  if (queue.length === 0) return null;

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
        gap: 8,
      }}
    >
      {queue.map((t) => (
        <ToastPill key={t.id} model={t} />
      ))}
    </View>
  );
}

function ToastPill({ model }: { model: ToastModel }) {
  const theme = useTheme();
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const id = setTimeout(() => dismiss(model.id), DURATION_MS);
    return () => clearTimeout(id);
  }, [model.id, dismiss]);

  const styling = (() => {
    switch (model.variant) {
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
    <Animated.View
      entering={FadeInDown.duration(220).springify().damping(14)}
      exiting={FadeOutDown.duration(160)}
      layout={LinearTransition.springify().damping(16)}
    >
      <Pressable
        onPress={() => dismiss(model.id)}
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
          borderWidth: model.variant === "info" || model.variant === "warning" ? 1 : 0,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.text,
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <Ionicons
          name={ICON_FOR[model.variant]}
          size={20}
          color={styling.iconColor}
        />
        <View style={{ flex: 1, gap: 1 }}>
          {model.title ? (
            <Text
              variant="caption"
              weight="bold"
              style={{ color: styling.fg }}
            >
              {model.title}
            </Text>
          ) : null}
          <Text
            variant="body"
            weight="medium"
            style={{ color: styling.fg }}
            numberOfLines={3}
          >
            {model.message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
