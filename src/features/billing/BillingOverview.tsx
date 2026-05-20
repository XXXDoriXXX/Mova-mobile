import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { BalanceWidget } from "@/components/BalanceWidget";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { BillingSummary } from "@/types/api";

type Props = { summary: BillingSummary };

export function BillingOverview({ summary }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const renewsDate = new Date(summary.currentPeriodEnd).toLocaleDateString();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <BalanceWidget summary={summary} />
      <Card>
        <Text variant="label" color="textMuted">
          {t("billing.currentPlan")}
        </Text>
        <Text variant="subtitle" style={{ marginTop: theme.spacing.xs }}>
          {summary.plan.name}
        </Text>
        <Text variant="caption" color="textMuted">
          {t("billing.renewsAt", { date: renewsDate })}
        </Text>
      </Card>
    </View>
  );
}
