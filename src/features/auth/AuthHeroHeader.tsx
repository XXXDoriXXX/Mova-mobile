import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppLogo } from "@/components/AppLogo";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  compact?: boolean;
};

export function AuthHeroHeader({ compact = false }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ gap: compact ? 12 : 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <AppLogo size={36} />
        <Text variant="title" weight="bold">
          MOVA
        </Text>
      </View>

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
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.colors.accentText,
          }}
        />
        <Text
          variant="caption"
          weight="bold"
          style={{ color: theme.colors.accentText }}
        >
          {t("auth.heroPill")}
        </Text>
      </View>

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
    </View>
  );
}
