import { useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { triggerHaptic } from "@/utils/haptics";

const MAX_LENGTH = 2000; // backend `user.speak` enforces this; mirror locally.

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [value, setValue] = useState("");

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !disabled;

  function send() {
    if (!canSend) return;
    triggerHaptic("light");
    onSend(trimmed);
    setValue("");
  }

  return (
    <View
      style={{
        gap: theme.spacing.xs,
        padding: theme.spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: theme.spacing.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <TextField
            placeholder={t("live.messagePlaceholder")}
            value={value}
            onChangeText={(v) => setValue(v.slice(0, MAX_LENGTH))}
            multiline
            maxLength={MAX_LENGTH}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("live.say")}
          disabled={!canSend}
          onPress={send}
          style={{
            width: 56,
            height: 56,
            borderRadius: theme.radii.pill,
            backgroundColor: canSend
              ? theme.colors.primary
              : theme.colors.surfaceMuted,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="send"
            size={22}
            color={canSend ? theme.colors.primaryText : theme.colors.textMuted}
          />
        </Pressable>
      </View>
      {value.length > MAX_LENGTH * 0.75 ? (
        <Text
          variant="caption"
          color={value.length >= MAX_LENGTH ? "danger" : "textMuted"}
          align="right"
        >
          {value.length} / {MAX_LENGTH}
        </Text>
      ) : null}
    </View>
  );
}
