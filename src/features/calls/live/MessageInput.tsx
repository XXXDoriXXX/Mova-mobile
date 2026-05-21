import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { FONT_FAMILY } from "@/theme/typography";
import { triggerHaptic } from "@/utils/haptics";

const MAX_LENGTH = 2000; // backend `user.speak` enforces this; mirror locally.

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

/**
 * In-call composer. Renders the white pill with a keypad icon, free-form
 * text and a lime send affordance — matches the design's "що сказати
 * голосом ШІ" composer footprint. Single self-contained card so it
 * floats above the transcript without competing with bubble colours.
 */
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
        paddingHorizontal: theme.spacing.page,
        paddingTop: 12,
        paddingBottom: 14,
        gap: 6,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.xxl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 6,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: theme.colors.surfaceMuted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="keypad" size={20} color={theme.colors.text} />
        </View>
        <TextInput
          placeholder={t("live.messagePlaceholder")}
          placeholderTextColor={theme.colors.textMuted}
          value={value}
          onChangeText={(v) => setValue(v.slice(0, MAX_LENGTH))}
          multiline
          maxLength={MAX_LENGTH}
          style={{
            flex: 1,
            fontFamily: FONT_FAMILY.sansMedium,
            fontSize: 15,
            color: theme.colors.text,
            paddingHorizontal: 4,
            paddingVertical: 8,
            maxHeight: 110,
          }}
          editable={!disabled}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("live.say")}
          disabled={!canSend}
          onPress={send}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 16,
            backgroundColor: canSend
              ? theme.colors.accent
              : theme.colors.surfaceMuted,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons
            name="arrow-up"
            size={22}
            color={canSend ? theme.colors.accentText : theme.colors.textMuted}
          />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="label" color="textMuted" style={{ textTransform: "uppercase" }}>
          {t("live.composerHint")}
        </Text>
        {value.length > MAX_LENGTH * 0.75 ? (
          <Text
            variant="label"
            color={value.length >= MAX_LENGTH ? "danger" : "textMuted"}
          >
            {value.length} / {MAX_LENGTH}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
