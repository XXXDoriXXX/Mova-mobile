import { View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useLanguageStore } from "@/i18n/languageStore";
import type { SupportedLocale } from "@/i18n";

const OPTIONS: Array<{ code: SupportedLocale; label: string }> = [
  { code: "uk", label: "УКР" },
  { code: "en", label: "ENG" },
];

// Compact UK/EN toggle for the entry screens so a user can switch the app
// language immediately, before signing up. The choice is persisted.
export function LanguageSwitcher() {
  const theme = useTheme();
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <View
      style={{
        flexDirection: "row",
        alignSelf: "flex-end",
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.pill,
        padding: 3,
        gap: 2,
      }}
    >
      {OPTIONS.map((opt) => {
        const active = language === opt.code;
        return (
          <PressableScale
            key={opt.code}
            onPress={() => void setLanguage(opt.code)}
            haptic="selection"
            scaleTo={0.95}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: theme.radii.pill,
              backgroundColor: active ? theme.colors.primary : "transparent",
            }}
          >
            <Text
              variant="caption"
              weight="bold"
              color={active ? "textInverse" : "textMuted"}
            >
              {opt.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
