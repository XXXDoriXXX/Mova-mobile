import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { logout as logoutRequest } from "@/api/auth";
import { useAuthStore } from "@/auth/store";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      // Best-effort: revoke server-side; local logout still proceeds on failure.
      await logoutRequest().catch(() => undefined);
      queryClient.clear();
      await clear();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
        }}
      >
        <Text variant="title">{t("settings.title")}</Text>

        {user ? (
          <Card>
            <Text variant="subtitle">{user.name}</Text>
            <Text variant="caption" color="textMuted">
              {user.email}
            </Text>
          </Card>
        ) : null}

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">
            {t("settings.sectionContent")}
          </Text>
          <Row
            iconName="document-text-outline"
            title={t("settings.templates")}
            onPress={() => router.push("/templates")}
          />
          <Row
            iconName="color-palette-outline"
            title={t("settings.styles")}
            onPress={() => router.push("/styles")}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">
            {t("settings.sectionBilling")}
          </Text>
          <Row
            iconName="wallet-outline"
            title={t("settings.billing")}
            onPress={() => router.push("/billing")}
          />
        </View>

        <Button
          label={t("settings.logout")}
          variant="danger"
          loading={loggingOut}
          onPress={handleLogout}
        />
      </ScrollView>
    </Screen>
  );
}
