import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { Pill } from "@/components/Pill";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { listConversations } from "@/api/conversations";
import { ConversationsList } from "@/features/conversations/ConversationsList";
import type { ConversationStatus } from "@/types/api";

type Filter = "all" | ConversationStatus;

const FILTERS: { key: Filter; i18nKey: string }[] = [
  { key: "all", i18nKey: "history.filterAll" },
  { key: "ended", i18nKey: "history.filterEnded" },
  { key: "active", i18nKey: "history.filterActive" },
  { key: "failed", i18nKey: "history.filterFailed" },
];

/**
 * History tab. Top: a tiny stats strip (today / this week) computed
 * from the cached "all" list — a small touch that makes the screen
 * feel inhabited even before the user scrolls.
 *
 * Below: filter chips (horizontal scroller so a long locale never
 * wraps), then the paginated list. The list itself stagger-animates
 * its items on first render — see `ConversationsList`.
 */
export default function HistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  // Light, secondary query used only to populate the header stats. Reuses
  // the same cache key shape as the home screen's "recent calls" preload
  // so we don't pay for an extra fetch on cold start.
  const statsQuery = useQuery({
    queryKey: ["conversations", { limit: 50 }],
    queryFn: () => listConversations({ limit: 50 }),
  });

  const stats = (() => {
    const items = statsQuery.data?.items ?? [];
    const now = Date.now();
    const dayMs = 86_400_000;
    const todayCount = items.filter(
      (c) => now - new Date(c.startedAt).getTime() < dayMs,
    ).length;
    const weekCount = items.filter(
      (c) => now - new Date(c.startedAt).getTime() < dayMs * 7,
    ).length;
    return { todayCount, weekCount, total: items.length };
  })();

  return (
    <Screen>
      <View style={{ flex: 1, gap: theme.spacing.md, paddingTop: 4 }}>
        <View style={{ gap: 4 }}>
          <Text variant="label" color="textMuted">
            MOVA
          </Text>
          <Text variant="title">{t("history.title")}</Text>
        </View>

        {stats.total > 0 ? (
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Pill
              label={t("history.statToday", { count: stats.todayCount })}
              tone={stats.todayCount > 0 ? "accent" : "surface"}
            />
            <Pill
              label={t("history.statWeek", { count: stats.weekCount })}
              tone="surface"
            />
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={t(f.i18nKey)}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>

        <View style={{ flex: 1 }}>
          <ConversationsList
            status={filter === "all" ? undefined : filter}
            onOpen={(id) => router.push(`/conversation/${id}`)}
          />
        </View>
      </View>
    </Screen>
  );
}
