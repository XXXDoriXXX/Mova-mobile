import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Row } from "@/components/Row";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";
import { useTheme } from "@/theme/ThemeProvider";
import { logout as logoutRequest } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { useOnboardingStore } from "@/onboarding/store";
import { ChangePasswordModal } from "@/features/settings/ChangePasswordModal";
import { DeleteAccountModal } from "@/features/settings/DeleteAccountModal";
import { EditProfileModal } from "@/features/settings/EditProfileModal";
import { AppearanceModal } from "@/features/settings/AppearanceModal";
import { PushNotificationsRow } from "@/features/settings/PushNotificationsRow";

/**
 * Settings — grouped list of rows. Sections separated by visual spacing
 * rather than chrome dividers; each group is preceded by a small mono
 * uppercase header. The user identity card at top doubles as a quick
 * visual anchor.
 */
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

  async function handleReplayOnboarding() {
    if (onboardingStatus === "unknown") return;
    const ok = await confirm({
      title: t("settings.replayOnboardingTitle"),
      confirmLabel: t("settings.replayOnboardingConfirm"),
      icon: "play-circle-outline",
    });
    if (!ok) return;
    useOnboardingStore.setState({ status: "needed" });
    router.replace("/onboarding");
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutRequest().catch(() => undefined);
      queryClient.clear();
      await clear();
      toast.info(t("settings.logoutSuccess"));
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.spacing.lg,
          paddingTop: 4,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 4 }}>
          <Text variant="label" color="textMuted">
            MOVA
          </Text>
          <Text variant="title">{t("settings.title")}</Text>
        </View>

        {user ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: 16,
              backgroundColor: theme.colors.surfaceInverse,
              borderRadius: theme.radii.xxl,
            }}
          >
            <Avatar name={user.name} size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="subtitle" color="textOnInverse">
                {user.name}
              </Text>
              <Text variant="caption" color="textOnInverse" style={{ opacity: 0.7 }}>
                {user.email}
              </Text>
            </View>
          </View>
        ) : null}

        <Section title={t("settings.sectionAccount")}>
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
            iconName="text-outline"
            title={t("settings.appearance")}
            onPress={() => setEditingAppearance(true)}
          />
          <PushNotificationsRow />
        </Section>

        <Section title={t("settings.sectionContent")}>
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
        </Section>

        <Section title={t("settings.sectionBilling")}>
          <Row
            iconName="wallet-outline"
            title={t("settings.billing")}
            onPress={() => router.push("/billing")}
          />
        </Section>

        <Section title={t("settings.sectionHelp")}>
          <Row
            iconName="information-circle-outline"
            title={t("settings.about")}
            onPress={() => router.push("/settings/about")}
            onLongPress={handleReplayOnboarding}
          />
        </Section>

        <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          <Button
            label={t("settings.logout")}
            variant="secondary"
            size="md"
            loading={loggingOut}
            onPress={handleLogout}
          />
          {/* Destructive action is intentionally low-key — a small text
              link, not a button. Users who want it will find it; users
              who don't won't tap it by accident. */}
          <Pressable
            onPress={() => setDeletingAccount(true)}
            hitSlop={12}
            accessibilityRole="button"
          >
            <Text
              variant="caption"
              color="danger"
              align="center"
              style={{ textDecorationLine: "underline" }}
            >
              {t("settings.deleteAccount")}
            </Text>
          </Pressable>
        </View>
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        variant="label"
        color="textMuted"
        style={{ textTransform: "uppercase", paddingHorizontal: 4 }}
      >
        {title}
      </Text>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}
