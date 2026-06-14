import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";

type ScreenProps = {
  children: ReactNode;
  padded?: boolean;
  background?: "default" | "ink";
  style?: ViewStyle;
};

export function Screen({
  children,
  padded = true,
  background = "default",
  style,
}: ScreenProps) {
  const theme = useTheme();
  const bg =
    background === "ink" ? theme.colors.inverse : theme.colors.background;
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }, style]}>
      <StatusBar style={background === "ink" ? "light" : "dark"} />
      <View
        style={{
          flex: 1,
          paddingHorizontal: padded ? theme.spacing.page : 0,
        }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
