import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { formatCentsAsUah } from "@/utils/format";
import type { UsageRecord } from "@/types/api";

type Props = { items: UsageRecord[] };

export function UsageList({ items }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (items.length === 0) {
    return (
      <Card>
        <Text color="textMuted" align="center">
          {t("billing.usageEmpty")}
        </Text>
      </Card>
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {items.map((u) => {
        const date = new Date(u.recordedAt).toLocaleDateString();
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
                  {u.secondsBilled} sec · {u.source}
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
