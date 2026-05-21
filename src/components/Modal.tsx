import type { ReactNode } from "react";
import { Modal as RNModal, Pressable, View } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * Bottom-sheet modal. Slides up from the bottom, dims the page behind,
 * and shows a small drag handle at the top — the standard iOS sheet
 * affordance. Tapping the dim or pressing the handle dismisses.
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
            gap: theme.spacing.lg,
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
              marginBottom: 6,
            }}
          />
          {title ? <Text variant="title">{title}</Text> : null}
          <View style={{ gap: theme.spacing.md }}>{children}</View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
