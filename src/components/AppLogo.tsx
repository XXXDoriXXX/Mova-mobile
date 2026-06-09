import { View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  size?: number;
};

export function AppLogo({ size = 36 }: Props) {
  const theme = useTheme();
  const inner = Math.round(size * 0.38);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        backgroundColor: theme.colors.surfaceInverse,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: theme.colors.accent,
        }}
      />
    </View>
  );
}
