import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { AuthHeroHeader, GoogleSignInButton, LoginForm } from "@/features/auth";

const TERMS_URL = "https://mova.app/legal/terms";
const PRIVACY_URL = "https://mova.app/legal/privacy";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [banner, setBanner] = useState<string | null>(null);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={{ flex: 1, justifyContent: "space-between", gap: 32 }}>
            <View style={{ gap: 16 }}>
              <LanguageSwitcher />
              <AuthHeroHeader />
            </View>

            <View style={{ gap: 16 }}>
              {banner ? (
                <Text variant="body" color="danger">
                  {banner}
                </Text>
              ) : null}

              <LoginForm onError={setBanner} />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginVertical: 4,
                }}
              >
                <View
                  style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }}
                />
                <Text
                  variant="caption"
                  color="textMuted"
                  style={{ textTransform: "uppercase", letterSpacing: 0.6 }}
                >
                  {t("auth.orDivider")}
                </Text>
                <View
                  style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }}
                />
              </View>

              <GoogleSignInButton onError={setBanner} />

              <Pressable
                onPress={() => router.push("/register")}
                accessibilityRole="link"
                hitSlop={8}
                style={{ alignItems: "center", paddingVertical: 8 }}
              >
                <Text variant="body" color="textMuted">
                  {t("auth.noAccountPrefix")}{" "}
                  <Text variant="body" weight="bold" color="text">
                    {t("auth.registerLink")}
                  </Text>
                </Text>
              </Pressable>

              <Text
                variant="caption"
                color="textMuted"
                style={{ textAlign: "center", lineHeight: 18 }}
              >
                {t("auth.legalPrefix")}{" "}
                <Text
                  variant="caption"
                  weight="bold"
                  color="text"
                  onPress={() => void WebBrowser.openBrowserAsync(TERMS_URL)}
                >
                  {t("auth.legalTerms")}
                </Text>{" "}
                {t("auth.legalAnd")}{" "}
                <Text
                  variant="caption"
                  weight="bold"
                  color="text"
                  onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL)}
                >
                  {t("auth.legalPrivacy")}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
