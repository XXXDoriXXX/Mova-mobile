import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Reveal } from "@/components/Reveal";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { usePendingVerificationStore } from "@/auth/pendingVerificationStore";
import {
  AuthHeroHeader,
  useResendVerification,
  useVerificationAutoLogin,
} from "@/features/auth";

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const pending = usePendingVerificationStore((s) => s.pending);
  const clearPending = usePendingVerificationStore((s) => s.clear);
  // Prefer the persisted email (survives restarts) over the nav param.
  const email = pending?.email ?? (typeof params.email === "string" ? params.email : "");
  const { state, resend } = useResendVerification(email);
  const { checking, stillUnverified, checkNow } = useVerificationAutoLogin();

  async function changeEmail() {
    // Drop the pending record so the gate won't bounce us back, then return to
    // registration to re-enter the address.
    await clearPending();
    router.replace("/register");
  }

  return (
    <Screen>
      <View style={{ flex: 1, gap: 24, paddingTop: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AuthHeroHeader compact />
          <LanguageSwitcher />
        </View>

        <Reveal>
          <View
            style={{
              alignSelf: "flex-start",
              width: 64,
              height: 64,
              borderRadius: theme.radii.xxl,
              backgroundColor: theme.colors.surfaceAccent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="mail-unread-outline" size={30} color={theme.colors.text} />
          </View>
        </Reveal>

        <Reveal delay={90} style={{ gap: 12 }}>
          <Text variant="title">{t("verifyEmailGate.title")}</Text>
          <Text variant="body" color="textMuted" style={{ lineHeight: 22 }}>
            {t("verifyEmailGate.body")}
          </Text>
          {email ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Text variant="body" weight="bold">
                {email}
              </Text>
              <Text
                variant="body"
                color="primary"
                weight="bold"
                onPress={changeEmail}
                accessibilityRole="button"
                style={{ textDecorationLine: "underline" }}
              >
                {t("verifyEmailGate.changeEmail")}
              </Text>
            </View>
          ) : null}
          <Text variant="body" color="textMuted" style={{ lineHeight: 22 }}>
            {t("verifyEmailGate.hintAuto")}
          </Text>
        </Reveal>

        {stillUnverified ? (
          <Text variant="body" color="textMuted">
            {t("verifyEmailGate.notYet")}
          </Text>
        ) : null}
        {state === "sent" ? (
          <Text variant="body" color="success">
            {t("verifyEmailGate.resent")}
          </Text>
        ) : null}
        {state === "error" ? (
          <Text variant="body" color="danger">
            {t("verifyEmailGate.resendError")}
          </Text>
        ) : null}

        <View style={{ gap: 12, marginTop: "auto", paddingBottom: 8 }}>
          <Button
            label={t("verifyEmailGate.checkNow")}
            loading={checking}
            onPress={() => void checkNow()}
            trailing={
              <Ionicons
                name="refresh"
                size={16}
                color={theme.colors.primaryText}
              />
            }
          />
          <Button
            label={t("verifyEmailGate.resend")}
            variant="secondary"
            loading={state === "sending"}
            onPress={() => void resend()}
          />
        </View>
      </View>
    </Screen>
  );
}
