import { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { actionSheet, confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";
import { useTheme } from "@/theme/ThemeProvider";
import { deleteConversation, listConversations } from "@/api/conversations";
import type { Conversation } from "@/types/api";
import { formatDuration, formatRelativeFromNow } from "@/utils/format";
import { triggerHaptic } from "@/utils/haptics";
import { formatPhoneForDisplay } from "@/utils/phone";

import { ConversationsSkeleton } from "./ConversationsSkeleton";

const STATUS_ICON: Record<Conversation["status"], keyof typeof Ionicons.glyphMap> = {
  pending: "ellipse-outline",
  active: "radio",
  ended: "checkmark-circle",
  failed: "alert-circle",
};

type Props = {
  onOpen: (id: string) => void;
  status?: Conversation["status"];
};

/**
 * Paginated conversation list with pull-to-refresh and infinite scroll.
 * Mirrors the home-screen row style for visual continuity: white card
 * with an initials avatar, identity + timestamp, and a quick-redial
 * affordance. Long-press deletes after confirmation.
 */
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", "list"] });
      toast.success(t("conversation.deleteSuccess"));
    },
    onError: () => toast.error(t("conversation.deleteError")),
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  function quickRecall(c: Conversation) {
    router.push({
      pathname: "/call/pre",
      params: { prefillPhone: c.targetPhone },
    });
  }

  // Long-press opens an ActionSheet with the three meaningful actions
  // for a past call — recall, open, delete. Replaces the flat
  // long-press-to-delete shortcut which was easy to fire accidentally.
  async function openActions(c: Conversation) {
    const chosen = await actionSheet({
      title: formatPhoneForDisplay(c.targetPhone),
      actions: [
        { id: "recall", label: t("history.recall"), icon: "call-outline" },
        { id: "open", label: t("history.open"), icon: "chatbubbles-outline" },
        { id: "delete", label: t("conversation.delete"), icon: "trash-outline", destructive: true },
      ],
    });
    if (chosen === "recall") quickRecall(c);
    else if (chosen === "open") onOpen(c.id);
    else if (chosen === "delete") {
      const ok = await confirm({
        title: t("conversation.deleteConfirm"),
        confirmLabel: t("conversation.delete"),
        destructive: true,
        icon: "trash-outline",
      });
      if (ok) deleteMut.mutate(c.id);
    }
  }

  const renderItem = useCallback(
    ({ item, index }: { item: Conversation; index: number }) => {
      const phone = formatPhoneForDisplay(item.targetPhone);
      const statusColor =
        item.status === "failed"
          ? theme.colors.danger
          : item.status === "active"
            ? theme.colors.success
            : theme.colors.textMuted;
      return (
        <Animated.View
          // Stagger entry so the list "cascades" in rather than popping
          // all at once. Cap delay at 240ms so later items don't feel
          // slow.
          entering={FadeInDown.duration(280).delay(Math.min(index * 35, 240))}
        >
        <Pressable
          onPress={() => onOpen(item.id)}
          onLongPress={() => openActions(item)}
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
              <Ionicons name={STATUS_ICON[item.status]} size={12} color={statusColor} />
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onOpen, theme, t],
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
