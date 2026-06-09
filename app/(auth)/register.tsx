import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { IconButton } from "@/components/IconButton";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { AuthHeroHeader, GoogleSignInButton, RegisterForm } from "@/features/auth";

export default function RegisterScreen() {
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <IconButton
              onPress={() => router.back()}
              accessibilityLabel={t("common.back")}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </IconButton>
          </View>

          <View style={{ gap: 24 }}>
            <AuthHeroHeader compact />

            <View style={{ gap: 16 }}>
              {banner ? (
                <Text variant="body" color="danger">
                  {banner}
                </Text>
              ) : null}

              <RegisterForm onError={setBanner} />

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
                onPress={() => router.replace("/welcome")}
                accessibilityRole="link"
                hitSlop={8}
                style={{ alignItems: "center", paddingVertical: 8 }}
              >
                <Text variant="body" color="textMuted">
                  {t("auth.haveAccountPrefix")}{" "}
                  <Text variant="body" weight="bold" color="text">
                    {t("auth.loginLink")}
                  </Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
