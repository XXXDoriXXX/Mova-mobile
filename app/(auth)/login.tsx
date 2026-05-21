import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { IconButton } from "@/components/IconButton";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { LoginForm } from "@/features/auth/LoginForm";
import { useTheme } from "@/theme/ThemeProvider";

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: 8, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: theme.spacing.xxl,
            }}
          >
            <IconButton
              onPress={() => router.back()}
              accessibilityLabel={t("common.back")}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </IconButton>
          </View>

          <View style={{ gap: theme.spacing.xl }}>
            <View style={{ gap: 4 }}>
              <Text variant="caption" color="textMuted">
                {t("welcome.title")}
              </Text>
              <Text variant="title">{t("welcome.login")}</Text>
            </View>
            <LoginForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
