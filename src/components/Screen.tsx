import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";

type ScreenProps = {
  children: ReactNode;
  /** Apply the standard 22px horizontal page inset. Disable for full-bleed
   *  scroll views that want to manage their own padding. */
  padded?: boolean;
  /** Optional override for the background colour. The "ink" preset paints
   *  the warm-white canvas dark (forest) — used by the welcome screen. */
  background?: "default" | "ink";
  style?: ViewStyle;
};

/**
 * Root frame for every route. Sets the canvas colour, drives the status
 * bar style, and applies the standard horizontal inset. Scrollable
 * content should be wrapped in a `ScrollView` inside this component.
 */
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
