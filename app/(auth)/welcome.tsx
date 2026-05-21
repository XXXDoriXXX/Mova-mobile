import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  i18nKey: string;
};

const FEATURES: Feature[] = [
  { icon: "call-outline", i18nKey: "welcome.featureCalls" },
  { icon: "chatbubbles-outline", i18nKey: "welcome.featureSuggestions" },
  { icon: "color-palette-outline", i18nKey: "welcome.featureStyle" },
];

/**
 * Welcome / sign-in entry point. Hero typography (display + italic accent)
 * mirrors the home screen so the brand voice is set from the very first
 * frame. The CTAs are a lime primary ("Create account") + ghost secondary
 * ("Log in"), matching the warm-light palette.
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "space-between", paddingVertical: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.xxl }}>
          <Pill label="MOVA · v0.1" tone="ink" />
          <Text variant="display">
            {t("welcome.title")}
            <Text variant="display" color="textMuted">+</Text>
          </Text>
          <Text variant="display" weight="bold" italic color="text">
            {t("welcome.subtitle").split("\n")[0]}
          </Text>
          {t("welcome.subtitle").split("\n")[1] ? (
            <Text variant="bodyLarge" color="textMuted">
              {t("welcome.subtitle").split("\n").slice(1).join(" ")}
            </Text>
          ) : null}
        </View>

        <View style={{ gap: theme.spacing.md }}>
          {FEATURES.map((f) => (
            <View
              key={f.icon}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.accent,
                }}
              >
                <Ionicons name={f.icon} size={18} color={theme.colors.accentText} />
              </View>
              <Text variant="body" weight="bold" style={{ flex: 1 }}>
                {t(f.i18nKey)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <Button
            label={t("welcome.register")}
            variant="primary"
            onPress={() => router.push("/register")}
          />
          <Button
            label={t("welcome.login")}
            variant="secondary"
            onPress={() => router.push("/login")}
          />
        </View>
      </View>
    </Screen>
  );
}
