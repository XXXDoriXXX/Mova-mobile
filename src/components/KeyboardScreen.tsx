import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import { Screen } from "./Screen";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  children: ReactNode;
  /** Extra bottom padding above the floating tab bar. */
  bottomPad?: number;
};

/**
 * Form-friendly screen wrapper. Keyboard nudges content up on iOS; the
 * scroll container leaves clearance below for the floating tab bar (or
 * just enough room when used inside stacks that hide it).
 */
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
