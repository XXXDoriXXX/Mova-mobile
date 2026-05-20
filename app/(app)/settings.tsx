import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
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
import { useOnboardingStore } from "@/onboarding/store";
import { ChangePasswordModal } from "@/features/settings/ChangePasswordModal";
import { DeleteAccountModal } from "@/features/settings/DeleteAccountModal";
import { EditProfileModal } from "@/features/settings/EditProfileModal";
import { AppearanceModal } from "@/features/settings/AppearanceModal";
import { PushNotificationsRow } from "@/features/settings/PushNotificationsRow";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editingAppearance, setEditingAppearance] = useState(false);
  const onboardingStatus = useOnboardingStore((s) => s.status);

  function handleReplayOnboarding() {
    // Hidden action: long-press About to re-run the welcome wizard. Useful
    // for QA + for users who want to revisit the slides + change their
    // default style without diving into Styles → Set preferred.
    if (onboardingStatus === "unknown") return;
    Alert.alert(t("settings.replayOnboardingTitle"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.replayOnboardingConfirm"),
        onPress: () => {
          useOnboardingStore.setState({ status: "needed" });
          router.replace("/onboarding");
        },
      },
    ]);
  }

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
            {t("settings.sectionAccount")}
          </Text>
          <Row
            iconName="person-circle-outline"
            title={t("settings.editProfile")}
            onPress={() => setEditingProfile(true)}
          />
          <Row
            iconName="key-outline"
            title={t("settings.changePassword")}
            onPress={() => setChangingPassword(true)}
          />
          <Row
            iconName="sparkles-outline"
            title={t("settings.styleProfile")}
            subtitle={t("settings.styleProfileSubtitle")}
            onPress={() => router.push("/settings/style-profile")}
          />
          <Row
            iconName="color-palette-outline"
            title={t("settings.appearance")}
            onPress={() => setEditingAppearance(true)}
          />
          <PushNotificationsRow />
        </View>

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
            iconName="brush-outline"
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

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">
            {t("settings.sectionHelp")}
          </Text>
          <Row
            iconName="information-circle-outline"
            title={t("settings.about")}
            onPress={() => router.push("/settings/about")}
            onLongPress={handleReplayOnboarding}
          />
        </View>

        <Button
          label={t("settings.logout")}
          variant="danger"
          loading={loggingOut}
          onPress={handleLogout}
        />

        <Button
          label={t("settings.deleteAccount")}
          variant="ghost"
          onPress={() => setDeletingAccount(true)}
        />
      </ScrollView>

      <EditProfileModal
        visible={editingProfile}
        onClose={() => setEditingProfile(false)}
      />
      <ChangePasswordModal
        visible={changingPassword}
        onClose={() => setChangingPassword(false)}
      />
      <DeleteAccountModal
        visible={deletingAccount}
        onClose={() => setDeletingAccount(false)}
      />
      <AppearanceModal
        visible={editingAppearance}
        onClose={() => setEditingAppearance(false)}
      />
    </Screen>
  );
}
