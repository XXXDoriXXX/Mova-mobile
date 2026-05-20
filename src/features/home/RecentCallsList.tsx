import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { Conversation } from "@/types/api";
import { formatDuration, formatRelativeFromNow } from "@/utils/format";
import { formatPhoneForDisplay } from "@/utils/phone";

type Props = {
  items: Conversation[];
};

const STATUS_ICON: Record<Conversation["status"], string> = {
  pending: "•",
  active: "●",
  ended: "✓",
  failed: "⚠",
};

export function RecentCallsList({ items }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (items.length === 0) {
    return (
      <Card>
        <Text color="textMuted" align="center">
          {t("home.recentEmpty")}
        </Text>
      </Card>
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {items.map((c) => (
        <Card key={c.id} style={{ paddingVertical: theme.spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexShrink: 1 }}>
              <Text variant="subtitle">{formatPhoneForDisplay(c.targetPhone)}</Text>
              <Text variant="caption" color="textMuted">
                {formatRelativeFromNow(c.startedAt)}
                {c.durationSeconds > 0
                  ? ` · ${formatDuration(c.durationSeconds)}`
                  : ""}
              </Text>
            </View>
            <Text
              variant="title"
              color={
                c.status === "failed"
                  ? "danger"
                  : c.status === "active"
                    ? "success"
                    : "textMuted"
              }
            >
              {STATUS_ICON[c.status]}
            </Text>
          </View>
        </Card>
      ))}
    </View>
  );
}
