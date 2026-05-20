import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
  const router = useRouter();

  if (items.length === 0) {
    return (
      <Card>
        <View style={{ alignItems: "center", gap: theme.spacing.sm }}>
          <Ionicons
            name="call-outline"
            size={32}
            color={theme.colors.textMuted}
          />
          <Text color="textMuted" align="center">
            {t("home.recentEmpty")}
          </Text>
        </View>
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
              gap: theme.spacing.sm,
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={() =>
                router.push({
                  pathname: "/conversation/[id]",
                  params: { id: c.id },
                })
              }
            >
              <Text variant="subtitle">
                {formatPhoneForDisplay(c.targetPhone)}
              </Text>
              <Text variant="caption" color="textMuted">
                {formatRelativeFromNow(c.startedAt)}
                {c.durationSeconds > 0
                  ? ` · ${formatDuration(c.durationSeconds)}`
                  : ""}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("history.recall")}
              onPress={() =>
                router.push({
                  pathname: "/call/pre",
                  params: { prefillPhone: c.targetPhone },
                })
              }
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.colors.surfaceMuted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="call-outline"
                size={18}
                color={theme.colors.primary}
              />
            </Pressable>
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
