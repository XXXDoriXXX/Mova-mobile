import { useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [value, setValue] = useState("");

  const canSend = value.trim().length > 0 && !disabled;

  function send() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: theme.spacing.sm,
        padding: theme.spacing.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <TextField
          placeholder={t("live.messagePlaceholder")}
          value={value}
          onChangeText={setValue}
          multiline
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
          backgroundColor: canSend ? theme.colors.primary : theme.colors.surfaceMuted,
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
  );
}
