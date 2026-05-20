import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { useTheme } from "@/theme/ThemeProvider";

export default function RegisterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, gap: theme.spacing.xl }}>
            <Text variant="title">{t("welcome.register")}</Text>
            <RegisterForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
