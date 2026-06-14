import { View } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  name: string | null | undefined;
  size?: number;
  background?: string;
  ringColor?: string;
};

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function Avatar({ name, size = 40, background, ringColor }: Props) {
  const theme = useTheme();
  const initials = initialsOf(name);

  const PASTELS = [
    theme.colors.avatarPeach,
    theme.colors.avatarSage,
    theme.colors.avatarLavender,
    theme.colors.avatarSky,
    theme.colors.avatarSand,
  ];
  const idx = name
    ? Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0) % PASTELS.length
    : 0;
  const bg = background ?? PASTELS[idx]!;

  return (
    <View
      accessibilityLabel={name ?? undefined}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: ringColor ? 2 : 0,
        borderColor: ringColor,
      }}
    >
      <Text
        weight="bold"
        style={{
          color: theme.colors.text,
          fontSize: Math.max(12, Math.round(size * 0.4)),
          lineHeight: Math.max(14, Math.round(size * 0.44)),
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
