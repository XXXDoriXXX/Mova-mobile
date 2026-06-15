import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { AuthHeroHeader, useResendVerification } from "@/features/auth";

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const { state, resend } = useResendVerification(email);

  return (
    <Screen>
      <View style={{ flex: 1, gap: 28, paddingTop: 8 }}>
        <AuthHeroHeader compact />

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

        <View style={{ gap: 12 }}>
          <Text variant="title">{t("verifyEmailGate.title")}</Text>
          <Text variant="body" color="textMuted" style={{ lineHeight: 22 }}>
            {t("verifyEmailGate.body")}
          </Text>
          {email ? (
            <Text variant="body" weight="bold">
              {email}
            </Text>
          ) : null}
          <Text variant="body" color="textMuted" style={{ lineHeight: 22 }}>
            {t("verifyEmailGate.hint")}
          </Text>
        </View>

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
            label={t("verifyEmailGate.goToLogin")}
            onPress={() => router.replace("/welcome")}
            trailing={
              <Ionicons
                name="arrow-forward"
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
