import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { PressableScale } from "@/components/PressableScale";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { BillingSummary } from "@/types/api";

type Props = {
  summary: BillingSummary | undefined;
};

// Prominent, one-tap entry to MOVA Plus. Shown to non-subscribers as a striking
// accent card (so subscription is visible from the home screen, not buried in
// billing); collapses to a quiet "active" strip once subscribed.
export function PlusUpsellCard({ summary }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  if (!summary) return null;
  const isPlus = summary.plan.code === "plus";

  if (isPlus) {
    return (
      <PressableScale
        onPress={() => router.push("/subscription")}
        haptic="light"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Ionicons name="sparkles" size={18} color={theme.colors.link} />
        <Text variant="body" weight="bold" style={{ flex: 1 }}>
          {t("billing.plus.activeStrip")}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={() => router.push("/subscription")}
      haptic="selection"
      scaleTo={0.98}
      style={{
        backgroundColor: theme.colors.surfaceInverse,
        borderRadius: theme.radii.xxl,
        padding: theme.spacing.lg,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="sparkles" size={18} color={theme.colors.accent} />
        <Text variant="subtitle" color="textOnInverse">
          MOVA Plus
        </Text>
        <View
          style={{
            marginLeft: "auto",
            backgroundColor: theme.colors.accent,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.radii.pill,
          }}
        >
          <Text variant="caption" weight="bold" color="accentText">
            {t("billing.plus.priceTag")}
          </Text>
        </View>
      </View>
      <Text variant="body" color="textOnInverse" style={{ opacity: 0.85, lineHeight: 20 }}>
        {t("billing.plus.upsellSubtitle")}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text variant="button" color="accent">
          {t("billing.plus.upsellCta")}
        </Text>
        <Ionicons name="arrow-forward" size={16} color={theme.colors.accent} />
      </View>
    </PressableScale>
  );
}
