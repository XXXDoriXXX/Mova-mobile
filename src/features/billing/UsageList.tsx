import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { formatCentsAsUah } from "@/utils/format";
import type { UsageRecord } from "@/types/api";

type Props = { items: UsageRecord[] };

export function UsageList({ items }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  if (items.length === 0) {
    return (
      <Card>
        <View
          style={{
            alignItems: "center",
            gap: theme.spacing.sm,
            paddingVertical: theme.spacing.md,
          }}
        >
          <Ionicons
            name="receipt-outline"
            size={36}
            color={theme.colors.textMuted}
          />
          <Text color="textMuted" align="center">
            {t("billing.usageEmpty")}
          </Text>
        </View>
      </Card>
    );
  }

  // Aggregate header: total seconds + total cost across this window. Cheap —
  // the API caps results at 500 records.
  const totals = items.reduce(
    (acc, u) => {
      acc.seconds += u.secondsBilled;
      acc.cents += u.costCents;
      return acc;
    },
    { seconds: 0, cents: 0 },
  );

  const dateFormatter = new Intl.DateTimeFormat(
    i18n.language === "en" ? "en-US" : "uk-UA",
    { dateStyle: "medium" },
  );

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Card>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text variant="label" color="textMuted">
              {t("billing.usageTotal")}
            </Text>
            <Text variant="subtitle">
              {totals.seconds} {t("billing.usageSecondsShort")}
            </Text>
          </View>
          <Text variant="title">₴ {formatCentsAsUah(totals.cents)}</Text>
        </View>
      </Card>

      {items.map((u) => {
        const date = dateFormatter.format(new Date(u.recordedAt));
        return (
          <Card key={u.id} style={{ paddingVertical: theme.spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text variant="body">{date}</Text>
                <Text variant="caption" color="textMuted">
                  {u.secondsBilled} {t("billing.usageSecondsShort")} ·{" "}
                  {t(`billing.usageSource_${u.source}`)}
                </Text>
              </View>
              <Text variant="subtitle">
                ₴ {formatCentsAsUah(u.costCents)}
              </Text>
            </View>
          </Card>
        );
      })}
    </View>
  );
}
