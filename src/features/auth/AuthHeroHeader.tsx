import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppLogo } from "@/components/AppLogo";
import { Reveal } from "@/components/Reveal";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  compact?: boolean;
};

export function AuthHeroHeader({ compact = false }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  // Gentle "breathing" pulse on the live-indicator dot so the header feels
  // alive without being noisy.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.7, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={{ gap: compact ? 12 : 16 }}>
      <Reveal>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <AppLogo size={36} />
          <Text variant="title" weight="bold">
            MOVA
          </Text>
        </View>
      </Reveal>

      <Reveal delay={80}>
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.accent,
          }}
        >
          <Animated.View
            style={[
              {
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.colors.accentText,
              },
              dotStyle,
            ]}
          />
          <Text
            variant="caption"
            weight="bold"
            style={{ color: theme.colors.accentText }}
          >
            {t("auth.heroPill")}
          </Text>
        </View>
      </Reveal>

      <Reveal delay={160}>
        {compact ? (
          <Text variant="title" weight="bold">
            {t("auth.heroTitleStart")}{" "}
            <Text variant="title" weight="bold" italic>
              {t("auth.heroTitleEm")}
            </Text>
            .
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            <Text variant="display">
              {t("auth.heroTitleStart")}{" "}
              <Text variant="display" italic>
                {t("auth.heroTitleEm")}
              </Text>
              .
            </Text>
            <Text variant="body" color="textMuted">
              {t("auth.heroSubtitle")}
            </Text>
          </View>
        )}
      </Reveal>
    </View>
  );
}
