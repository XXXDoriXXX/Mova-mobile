import { View } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  /** User's full name. Initials are derived from the first two non-empty words. */
  name: string | null | undefined;
  size?: number;
};

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

/**
 * Initials-in-a-circle avatar. We don't render uploaded images — the backend
 * has no avatar surface today and initials cover the common case while being
 * resilient to network failure.
 */
export function Avatar({ name, size = 40 }: Props) {
  const theme = useTheme();
  const initials = initialsOf(name);
  return (
    <View
      accessibilityLabel={name ?? undefined}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        variant="label"
        style={{
          color: theme.colors.primaryText,
          fontSize: Math.max(14, Math.round(size * 0.42)),
          lineHeight: Math.max(16, Math.round(size * 0.48)),
          fontWeight: "700",
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
