import { useCallback } from "react";
import { Alert, FlatList, RefreshControl, View } from "react-native";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { deleteConversation, listConversations } from "@/api/conversations";
import type { Conversation } from "@/types/api";
import { formatDuration, formatRelativeFromNow } from "@/utils/format";
import { formatPhoneForDisplay } from "@/utils/phone";

const STATUS_ICON: Record<Conversation["status"], string> = {
  pending: "•",
  active: "●",
  ended: "✓",
  failed: "⚠",
};

type Props = {
  onOpen: (id: string) => void;
};

export function ConversationsList({ onOpen }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["conversations", "list"],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      listConversations({ cursor: pageParam, limit: 20 }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["conversations", "list"] }),
  });

  function confirmDelete(c: Conversation) {
    Alert.alert(t("conversation.deleteConfirm"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("conversation.delete"),
        style: "destructive",
        onPress: () => deleteMut.mutate(c.id),
      },
    ]);
  }

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <Card style={{ paddingVertical: theme.spacing.md }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              variant="subtitle"
              onPress={() => onOpen(item.id)}
              onLongPress={() => confirmDelete(item)}
            >
              {formatPhoneForDisplay(item.targetPhone)}
            </Text>
            <Text variant="caption" color="textMuted">
              {formatRelativeFromNow(item.startedAt)}
              {item.durationSeconds > 0
                ? ` · ${formatDuration(item.durationSeconds)}`
                : ""}
            </Text>
          </View>
          <Text
            variant="title"
            color={
              item.status === "failed"
                ? "danger"
                : item.status === "active"
                  ? "success"
                  : "textMuted"
            }
          >
            {STATUS_ICON[item.status]}
          </Text>
        </View>
      </Card>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onOpen, theme],
  );

  if (query.isLoading) return <Spinner />;
  if (items.length === 0) {
    return (
      <Card>
        <Text color="textMuted" align="center">
          {t("history.empty")}
        </Text>
      </Card>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => query.refetch()}
        />
      }
      ListFooterComponent={
        query.isFetchingNextPage ? <Spinner size="small" /> : null
      }
    />
  );
}
