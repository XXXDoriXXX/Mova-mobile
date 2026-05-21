import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { BalanceWidget } from "@/components/BalanceWidget";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { BillingSummary } from "@/types/api";

type Props = { summary: BillingSummary };

/**
 * "Overview" tab content. Balance card (forest) on top, plan info card
 * (white) below. The plan card surfaces the renewal date — the only
 * piece of info that isn't already in `BalanceWidget`.
 */
export function BillingOverview({ summary }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const renewsDate = new Date(summary.currentPeriodEnd).toLocaleDateString();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <BalanceWidget summary={summary} />
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.xxl,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: 4,
        }}
      >
        <Text variant="label" color="textMuted" style={{ textTransform: "uppercase" }}>
          {t("billing.currentPlan")}
        </Text>
        <Text variant="subtitle">{summary.plan.name}</Text>
        <Text variant="caption" color="textMuted">
          {t("billing.renewsAt", { date: renewsDate })}
        </Text>
      </View>
    </View>
  );
}
