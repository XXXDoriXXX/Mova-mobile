import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
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

  // Calm "breathing" on the live-indicator dot via OPACITY (not scale, which
  // reads as jitter) — a slow ease-in-out glow that feels alive but quiet.
  const glow = useSharedValue(1);
  useEffect(() => {
    glow.value = withRepeat(
      withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glow]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

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
