import { useCallback } from "react";
import { Alert, FlatList, Pressable, RefreshControl, View } from "react-native";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { deleteConversation, listConversations } from "@/api/conversations";
import type { Conversation } from "@/types/api";
import { formatDuration, formatRelativeFromNow } from "@/utils/format";
import { formatPhoneForDisplay } from "@/utils/phone";

import { ConversationsSkeleton } from "./ConversationsSkeleton";

const STATUS_ICON: Record<Conversation["status"], string> = {
  pending: "•",
  active: "●",
  ended: "✓",
  failed: "⚠",
};

type Props = {
  onOpen: (id: string) => void;
  status?: Conversation["status"];
};

export function ConversationsList({ onOpen, status }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["conversations", "list", { status: status ?? "all" }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      listConversations({ cursor: pageParam, limit: 20, status }),
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

  function quickRecall(c: Conversation) {
    router.push({
      pathname: "/call/pre",
      params: { prefillPhone: c.targetPhone },
    });
  }

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
          <Pressable
            style={{ flex: 1 }}
            onPress={() => onOpen(item.id)}
            onLongPress={() => confirmDelete(item)}
          >
            <Text variant="subtitle">
              {formatPhoneForDisplay(item.targetPhone)}
            </Text>
            <Text variant="caption" color="textMuted">
              {formatRelativeFromNow(item.startedAt)}
              {item.durationSeconds > 0
                ? ` · ${formatDuration(item.durationSeconds)}`
                : ""}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("history.recall")}
            onPress={() => quickRecall(item)}
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surfaceMuted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
          </Pressable>
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
    [onOpen, theme, t],
  );

  if (query.isLoading) return <ConversationsSkeleton />;
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
