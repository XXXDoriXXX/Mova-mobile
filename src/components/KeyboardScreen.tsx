import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import { Screen } from "./Screen";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  children: ReactNode;
  bottomPad?: number;
};

export function KeyboardScreen({ children, bottomPad = 140 }: Props) {
  const theme = useTheme();
  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            gap: theme.spacing.lg,
            paddingTop: 4,
            paddingBottom: bottomPad,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
