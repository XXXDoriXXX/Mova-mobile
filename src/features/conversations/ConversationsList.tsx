import { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { listConversations } from "@/api/conversations";
import type { Conversation } from "@/types/api";
import { formatDuration, formatRelativeFromNow } from "@/utils/format";
import { triggerHaptic } from "@/utils/haptics";
import { conversationTitle } from "@/utils/conversation-display";
import {
  selectConversationStatusMeta,
  type ConversationStatusTone,
} from "@/utils/conversation-status";

import { useConversationActions } from "./application/useConversationActions";
import { ConversationsSkeleton } from "./ConversationsSkeleton";

type Props = {
  onOpen: (id: string) => void;
  status?: Conversation["status"];
};

export function ConversationsList({ onOpen, status }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { quickRecall, openMenu } = useConversationActions({ onOpen });

  const query = useInfiniteQuery({
    queryKey: ["conversations", "list", { status: status ?? "all" }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      listConversations({ cursor: pageParam, limit: 20, status }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  const renderItem = useCallback(
    ({ item, index }: { item: Conversation; index: number }) => {
      const phone = conversationTitle(item);
      const { iconName, tone } = selectConversationStatusMeta(item.status);
      const iconColor = toneColor(tone, theme);
      return (
        <Animated.View
          entering={FadeInDown.duration(280).delay(Math.min(index * 35, 240))}
        >
          <Pressable
            onPress={() => onOpen(item.id)}
            onLongPress={() => openMenu(item)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.xl,
              borderWidth: 1,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Avatar name={phone} size={42} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyLarge" weight="bold">
                {phone}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name={iconName} size={12} color={iconColor} />
                <Text variant="caption" color="textMuted">
                  {formatRelativeFromNow(item.startedAt)}
                  {item.durationSeconds > 0
                    ? ` · ${formatDuration(item.durationSeconds)}`
                    : ""}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("history.recall")}
              onPress={() => quickRecall(item)}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons name="call" size={16} color={theme.colors.primaryText} />
            </Pressable>
          </Pressable>
        </Animated.View>
      );
    },
    [onOpen, theme, t, openMenu, quickRecall],
  );

  if (query.isLoading) return <ConversationsSkeleton />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon="time-outline"
        title={t("history.empty")}
        body={t("history.emptyBody")}
        ctaLabel={t("home.startCallCta")}
        onCta={() => router.push("/call/pre")}
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
      contentContainerStyle={{ paddingBottom: 140 }}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => {
            triggerHaptic("light");
            void query.refetch();
          }}
          tintColor={theme.colors.text}
        />
      }
      ListFooterComponent={
        query.isFetchingNextPage ? <Spinner size="small" /> : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

function toneColor(
  tone: ConversationStatusTone,
  theme: ReturnType<typeof useTheme>,
): string {
  switch (tone) {
    case "danger":
      return theme.colors.danger;
    case "success":
      return theme.colors.success;
    case "muted":
      return theme.colors.textMuted;
  }
}
