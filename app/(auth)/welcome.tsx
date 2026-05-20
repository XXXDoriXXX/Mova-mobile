import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
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

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <View style={{ marginTop: theme.spacing.xxxl, gap: theme.spacing.md }}>
          <Text variant="displayLarge" color="primary">
            {t("welcome.title")}
          </Text>
          <Text variant="bodyLarge" color="textMuted">
            {t("welcome.subtitle")}
          </Text>
        </View>

        <View style={{ gap: theme.spacing.lg }}>
          {FEATURES.map((f) => (
            <View
              key={f.icon}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.md,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Ionicons name={f.icon} size={22} color={theme.colors.primary} />
              </View>
              <Text variant="body" style={{ flex: 1 }}>
                {t(f.i18nKey)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xl }}>
          <Button
            label={t("welcome.register")}
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
