import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";

type ScreenProps = {
  children: ReactNode;
  padded?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, padded = true, style }: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: theme.colors.background },
        style,
      ]}
    >
      <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />
      <View
        style={{
          flex: 1,
          paddingHorizontal: padded ? theme.spacing.lg : 0,
          paddingVertical: padded ? theme.spacing.md : 0,
        }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
