import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  trailing?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  /** Tint applied to the icon badge. Defaults to the muted beige chip. */
  tone?: "neutral" | "danger";
};

/**
 * Settings-style list row. White card with a soft icon badge on the left,
 * title + optional subtitle in the middle, chevron (or custom trailing
 * node) on the right. Tap target spans the whole row and scales
 * subtly on press; long-press fires a heavier `selection` haptic.
 */
export function Row({
  title,
  subtitle,
  onPress,
  onLongPress,
  trailing,
  iconName,
  tone = "neutral",
}: Props) {
  const theme = useTheme();
  const iconColor = tone === "danger" ? theme.colors.danger : theme.colors.text;
  const iconBg =
    tone === "danger" ? theme.colors.dangerSoft : theme.colors.surfaceMuted;

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radii.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {iconName ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyLarge" weight="bold" color={tone === "danger" ? "danger" : "text"}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onPress ? (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textMuted}
          />
        ) : null)}
    </View>
  );

  if (!onPress && !onLongPress) return content;
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      scaleTo={0.98}
      haptic="light"
    >
      {content}
    </PressableScale>
  );
}
