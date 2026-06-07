import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { Pill } from "@/components/Pill";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { listConversations } from "@/api/conversations";
import { ConversationsList } from "@/features/conversations/ConversationsList";
import { PeriodFilter } from "@/features/history/PeriodFilter";
import { SearchResultsList } from "@/features/history/SearchResultsList";
import { TemplateFilter } from "@/features/history/TemplateFilter";
import { rangeForPeriod, type PeriodKey } from "@/features/history/period";
import { useDebouncedValue } from "@/features/history/useDebouncedValue";
import type { ConversationStatus } from "@/types/api";

type Filter = "all" | ConversationStatus;

const STATUS_FILTERS: { key: Filter; i18nKey: string }[] = [
  { key: "all", i18nKey: "history.filterAll" },
  { key: "ended", i18nKey: "history.filterEnded" },
  { key: "active", i18nKey: "history.filterActive" },
  { key: "failed", i18nKey: "history.filterFailed" },
];

export default function HistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [templateId, setTemplateId] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const range = useMemo(() => rangeForPeriod(period), [period]);
  const searchMode = debouncedQuery.trim().length >= 2;

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

        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder={t("history.search.placeholder")}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {searchMode ? (
          <>
            <PeriodFilter value={period} onChange={setPeriod} />
            <TemplateFilter value={templateId} onChange={setTemplateId} />
            <View style={{ flex: 1 }}>
              <SearchResultsList
                query={debouncedQuery}
                from={range.from}
                to={range.to}
                templateId={templateId}
                onOpen={(id) => router.push(`/conversation/${id}`)}
              />
            </View>
          </>
        ) : (
          <>
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
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {STATUS_FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  label={t(f.i18nKey)}
                  selected={statusFilter === f.key}
                  onPress={() => setStatusFilter(f.key)}
                />
              ))}
            </ScrollView>

            <View style={{ flex: 1 }}>
              <ConversationsList
                status={statusFilter === "all" ? undefined : statusFilter}
                onOpen={(id) => router.push(`/conversation/${id}`)}
              />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
