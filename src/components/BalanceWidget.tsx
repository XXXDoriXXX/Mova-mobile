import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { RingProgress } from "./RingProgress";
import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { BillingSummary } from "@/types/api";
import {
  estimateMinutesFromBalance,
  formatCentsAsUah,
} from "@/utils/format";

type Props = { summary: BillingSummary; onPress?: () => void };

/**
 * Forest-tone balance card. Mirrors the "voice training" card silhouette
 * from the design — coloured surface, headline on the left, status ring
 * on the right. Used on /home and /billing to surface remaining
 * free seconds (plan=free) or wallet balance (paid).
 */
export function BalanceWidget({ summary, onPress }: Props) {
  const { t } = useTranslation();

  const inner = <Inner summary={summary} />;
  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("home.balanceTitle")}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      {inner}
    </Pressable>
  );
}

function Inner({ summary }: { summary: BillingSummary }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const isFree = summary.plan.code === "free";
  const headline = isFree
    ? `${summary.freeSecondsRemaining}s`
    : t("home.balanceAmount", { amount: formatCentsAsUah(summary.balanceCents) });

  const sub = isFree
    ? t("home.balanceFreeQuota", {
        used: summary.freeSecondsUsed,
        total: summary.plan.freeSecondsPerMonth,
      })
    : t("home.balanceMinutes", {
        minutes: estimateMinutesFromBalance(
          summary.balanceCents,
          summary.plan.pricePerSecondCents,
        ),
      });

  const ratio = isFree
    ? summary.plan.freeSecondsPerMonth > 0
      ? Math.max(
          0,
          1 - summary.freeSecondsUsed / summary.plan.freeSecondsPerMonth,
        )
      : 0
    : 1;

  return (
    <View
      style={{
        backgroundColor: theme.colors.surfaceInverse,
        borderRadius: theme.radii.xxl,
        paddingHorizontal: 20,
        paddingVertical: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <Text variant="label" color="textOnInverse" style={{ opacity: 0.65 }}>
          {t("home.balanceTitle")}
        </Text>
        <Text variant="title" color="textOnInverse">
          {headline}
        </Text>
        <Text variant="caption" color="textOnInverse" style={{ opacity: 0.65 }}>
          {sub}
        </Text>
      </View>
      <RingProgress size={56} value={ratio} width={6} />
    </View>
  );
}
