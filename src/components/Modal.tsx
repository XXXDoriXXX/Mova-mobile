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

export function Modal({ visible, onClose, title, children }: Props) {
  const theme = useTheme();
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          justifyContent: "center",
          padding: theme.spacing.xl,
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => undefined}
          style={{
            backgroundColor: theme.colors.background,
            borderRadius: theme.radii.lg,
            padding: theme.spacing.xl,
            gap: theme.spacing.lg,
          }}
        >
          {title ? <Text variant="title">{title}</Text> : null}
          <View style={{ gap: theme.spacing.md }}>{children}</View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
