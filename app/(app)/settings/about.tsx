import { useRef, useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn } from "react-native-reanimated";

import { IconButton } from "@/components/IconButton";
import { Row } from "@/components/Row";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { triggerHaptic } from "@/utils/haptics";

const SUPPORT_EMAIL = "support@mova.app";
const BACKEND_REPO = "https://github.com/XXXDoriXXX/MOVA";

/**
 * Static about screen. Brand block at top (display headline + tagline +
 * version), support rows below.
 *
 * Easter egg: tap the MOVA logotype 7 times in quick succession to reveal
 * the telephone-cat mascot. The tap window resets after a second of
 * idleness so accidental triple-taps don't burn the count.
 */
export default function AboutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "—";
  const buildVersion = Constants.expoConfig?.runtimeVersion ?? version;

  const [eggUnlocked, setEggUnlocked] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function bumpTitle() {
    if (eggUnlocked) return;
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 900);
    if (tapCount.current >= 7) {
      triggerHaptic("success");
      setEggUnlocked(true);
    }
  }

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
          <Pressable onPress={bumpTitle} accessibilityRole="text">
            <Text variant="display" style={{ fontSize: 56, lineHeight: 56 }}>
              MOVA
            </Text>
          </Pressable>
          <Text variant="bodyLarge" color="textMuted" style={{ marginTop: 4 }}>
            {t("settings.aboutTagline")}
          </Text>
          <Text variant="caption" color="textMuted" style={{ marginTop: 8 }}>
            {t("settings.aboutVersion", { version, build: String(buildVersion) })}
          </Text>
        </View>

        {eggUnlocked ? (
          <Animated.View
            entering={FadeIn.duration(280)}
            style={{
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radii.xxl,
              padding: theme.spacing.lg,
              gap: 4,
            }}
          >
            <Text variant="label" color="accentText" style={{ opacity: 0.7 }}>
              🐈 СЕКРЕТНО
            </Text>
            <Text variant="bodyLarge" color="accentText" weight="bold">
              {t("settings.easterEgg")}
            </Text>
          </Animated.View>
        ) : null}

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
