import { ActivityIndicator, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

export function Spinner({ size = "large" }: { size?: "small" | "large" }) {
  const theme = useTheme();
  return (
    <View style={{ paddingVertical: theme.spacing.xl, alignItems: "center" }}>
      <ActivityIndicator size={size} color={theme.colors.text} />
    </View>
  );
}
