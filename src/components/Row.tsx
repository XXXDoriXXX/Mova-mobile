import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  trailing?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
};

export function Row({
  title,
  subtitle,
  onPress,
  onLongPress,
  trailing,
  iconName,
}: Props) {
  const theme = useTheme();
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radii.md,
      }}
    >
      {iconName ? (
        <Ionicons name={iconName} size={22} color={theme.colors.text} />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="body">{title}</Text>
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
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {content}
    </Pressable>
  );
}
