import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { searchConversations } from "@/api/conversations";
import { formatDuration, formatRelativeFromNow } from "@/utils/format";
import type { SearchHit } from "@/types/api";

import { HighlightedText } from "./HighlightedText";

type Props = {
  query: string;
  from?: string;
  to?: string;
  templateId: string | null;
  onOpen: (conversationId: string, messageId?: string) => void;
};

const LIMIT = 20;

export function SearchResultsList({
  query,
  from,
  to,
  templateId,
  onOpen,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const trimmed = query.trim();
  const enabled = trimmed.length >= 2;

  const search = useInfiniteQuery({
    enabled,
    queryKey: ["conversations", "search", trimmed, from, to, templateId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      searchConversations({
        q: trimmed,
        from,
        to,
        templateId: templateId ?? undefined,
        cursor: pageParam,
        limit: LIMIT,
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  if (!enabled) {
    return (
      <EmptyState message={t("history.search.hintMinLength")} />
    );
  }

  if (search.isLoading) {
    return (
      <View style={{ paddingVertical: 24, alignItems: "center" }}>
        <ActivityIndicator color={theme.colors.text} />
      </View>
    );
  }

  if (search.isError) {
    return <EmptyState message={t("history.search.error")} />;
  }

  const items: SearchHit[] = search.data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) {
    return <EmptyState message={t("history.search.noResults")} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.conversationId}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
      onEndReachedThreshold={0.6}
      onEndReached={() => {
        if (search.hasNextPage && !search.isFetchingNextPage) {
          void search.fetchNextPage();
        }
      }}
      ListFooterComponent={
        search.isFetchingNextPage ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator color={theme.colors.text} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <SearchResultCard hit={item} onOpen={onOpen} />
      )}
    />
  );
}

function SearchResultCard({
  hit,
  onOpen,
}: {
  hit: SearchHit;
  onOpen: (conversationId: string, messageId?: string) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const firstMatch = hit.matches[0];

  return (
    <Pressable
      onPress={() => onOpen(hit.conversationId, firstMatch?.messageId)}
      android_ripple={{ color: theme.colors.surfaceMuted }}
    >
      <Card>
        <View style={{ gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <Text variant="bodyLarge" weight="bold" numberOfLines={1}>
              {hit.templateName ?? t("history.search.untitled")}
            </Text>
            <Text variant="caption" color="textMuted">
              {formatRelativeFromNow(hit.startedAt)}
            </Text>
          </View>
          <Text variant="caption" color="textMuted">
            {t("history.search.durationLabel", {
              value: formatDuration(hit.durationSeconds),
            })}
          </Text>
          {hit.matches.map((m) => (
            <View key={m.messageId} style={{ marginTop: 4 }}>
              <Text
                variant="caption"
                color="textMuted"
                style={{ textTransform: "uppercase", letterSpacing: 0.6 }}
              >
                {t(`history.search.role.${m.role}`)}
              </Text>
              <HighlightedText html={m.snippet} numberOfLines={3} />
            </View>
          ))}
        </View>
      </Card>
    </Pressable>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={{ paddingVertical: 32, alignItems: "center" }}>
      <Text variant="body" color="textMuted">
        {message}
      </Text>
    </View>
  );
}
