import { Linking, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

const SUPPORT_EMAIL = "support@mova.app";
const BACKEND_REPO = "https://github.com/XXXDoriXXX/MOVA";

export default function AboutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "—";
  const buildVersion = Constants.expoConfig?.runtimeVersion ?? version;

  function openMail() {
    const subject = encodeURIComponent("Mova feedback");
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
    void Linking.openURL(url);
  }

  function openRepo() {
    void Linking.openURL(BACKEND_REPO);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}>
        <Text variant="title">{t("settings.aboutTitle")}</Text>

        <Card>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="subtitle">Mova</Text>
            <Text variant="caption" color="textMuted">
              {t("settings.aboutTagline")}
            </Text>
            <Text
              variant="caption"
              color="textMuted"
              style={{ marginTop: theme.spacing.sm }}
            >
              {t("settings.aboutVersion", { version, build: String(buildVersion) })}
            </Text>
          </View>
        </Card>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">
            {t("settings.aboutSupport")}
          </Text>
          <Row
            iconName="mail-outline"
            title={t("settings.aboutContactEmail")}
            subtitle={SUPPORT_EMAIL}
            onPress={openMail}
          />
          <Row
            iconName="logo-github"
            title={t("settings.aboutBackendRepo")}
            subtitle={BACKEND_REPO}
            onPress={openRepo}
          />
        </View>

        <Button label={t("common.back")} variant="secondary" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
