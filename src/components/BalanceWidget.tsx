import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "./Card";
import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { BillingSummary } from "@/types/api";
import {
  estimateMinutesFromBalance,
  formatCentsAsUah,
} from "@/utils/format";

type Props = { summary: BillingSummary; onPress?: () => void };

export function BalanceWidget({ summary, onPress }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const inner = renderInner();
  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("home.balanceTitle")}
    >
      {inner}
    </Pressable>
  );

  function renderInner() {
  if (summary.plan.code === "free") {
    const total = summary.plan.freeSecondsPerMonth;
    const used = summary.freeSecondsUsed;
    const ratio = total > 0 ? Math.min(used / total, 1) : 0;

    return (
      <Card>
        <Text variant="label" color="textMuted">
          {t("home.balanceTitle")}
        </Text>
        <Text
          variant="displayLarge"
          style={{ marginTop: theme.spacing.xs }}
        >
          {summary.freeSecondsRemaining}s
        </Text>
        <Text
          variant="caption"
          color="textMuted"
          style={{ marginTop: theme.spacing.xs }}
        >
          {t("home.balanceFreeQuota", { used, total })}
        </Text>
        <View
          style={{
            marginTop: theme.spacing.md,
            height: 8,
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.surfaceMuted,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${ratio * 100}%`,
              height: "100%",
              backgroundColor: theme.colors.primary,
            }}
          />
        </View>
      </Card>
    );
  }

  const minutes = estimateMinutesFromBalance(
    summary.balanceCents,
    summary.plan.pricePerSecondCents,
  );

  return (
    <Card>
      <Text variant="label" color="textMuted">
        {t("home.balanceTitle")}
      </Text>
      <Text variant="displayLarge" style={{ marginTop: theme.spacing.xs }}>
        {t("home.balanceAmount", { amount: formatCentsAsUah(summary.balanceCents) })}
      </Text>
      <Text
        variant="caption"
        color="textMuted"
        style={{ marginTop: theme.spacing.xs }}
      >
        {t("home.balanceMinutes", { minutes })}
      </Text>
    </Card>
  );
  }
}
