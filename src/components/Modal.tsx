import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * Bottom-sheet modal. Slides up, dims the page, exposes a small drag
 * handle. Tapping the dim closes; the sheet itself swallows taps so
 * clicking inside doesn't dismiss.
 *
 * Wraps the sheet in `KeyboardAvoidingView` + an inner `ScrollView` so:
 *   - on Android, the on-screen keyboard pushes the sheet up rather
 *     than covering the input (`adjustResize` is unreliable inside RN
 *     modals — KAV is the portable fix);
 *   - if the form is taller than the available sheet area, the user
 *     can scroll to reach lower fields and the submit button.
 */
export function Modal({ visible, onClose, title, children }: Props) {
  const theme = useTheme();
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: "flex-end",
          }}
          onPress={onClose}
        >
          <Pressable
            onPress={() => undefined}
            style={{
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: theme.spacing.xl,
              paddingTop: 12,
              paddingBottom: 28,
              maxHeight: "92%",
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 44,
                height: 5,
                borderRadius: 3,
                backgroundColor: theme.colors.borderStrong,
                opacity: 0.4,
                marginBottom: 8,
              }}
            />
            {title ? (
              <Text variant="title" style={{ marginBottom: 8 }}>
                {title}
              </Text>
            ) : null}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.spacing.md }}
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
