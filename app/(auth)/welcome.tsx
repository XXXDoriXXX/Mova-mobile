import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <View style={{ marginTop: theme.spacing.xxxl, gap: theme.spacing.md }}>
          <Text variant="displayLarge" color="primary">
            {t("welcome.title")}
          </Text>
          <Text variant="bodyLarge" color="textMuted">
            {t("welcome.subtitle")}
          </Text>
        </View>
        <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xl }}>
          <Button
            label={t("welcome.register")}
            onPress={() => router.push("/register")}
          />
          <Button
            label={t("welcome.login")}
            variant="secondary"
            onPress={() => router.push("/login")}
          />
        </View>
      </View>
    </Screen>
  );
}
