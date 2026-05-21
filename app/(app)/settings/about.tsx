import { Linking, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { IconButton } from "@/components/IconButton";
import { Row } from "@/components/Row";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

const SUPPORT_EMAIL = "support@mova.app";
const BACKEND_REPO = "https://github.com/XXXDoriXXX/MOVA";

/**
 * Static about screen. Brand block at top (display headline + tagline +
 * version), support rows below. Long-press on the title returns to the
 * onboarding wizard — kept hidden because it's a power-user shortcut.
 */
export default function AboutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "—";
  const buildVersion = Constants.expoConfig?.runtimeVersion ?? version;

  function openMail() {
    const subject = encodeURIComponent("Mova feedback");
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
    void Linking.openURL(url);
  }

  function openRepo() {
    void Linking.openURL(BACKEND_REPO);
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <IconButton onPress={() => router.back()} accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </IconButton>
        </View>

        <View style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">
            {t("settings.title")}
          </Text>
          <Text variant="display" style={{ fontSize: 56, lineHeight: 56 }}>
            MOVA
          </Text>
          <Text variant="bodyLarge" color="textMuted" style={{ marginTop: 4 }}>
            {t("settings.aboutTagline")}
          </Text>
          <Text variant="caption" color="textMuted" style={{ marginTop: 8 }}>
            {t("settings.aboutVersion", { version, build: String(buildVersion) })}
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="label" color="textMuted" style={{ textTransform: "uppercase" }}>
            {t("settings.aboutSupport")}
          </Text>
          <Row
            iconName="mail-outline"
            title={t("settings.aboutContactEmail")}
            subtitle={SUPPORT_EMAIL}
            onPress={openMail}
          />
          <Row
            iconName="logo-github"
            title={t("settings.aboutBackendRepo")}
            subtitle={BACKEND_REPO}
            onPress={openRepo}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
