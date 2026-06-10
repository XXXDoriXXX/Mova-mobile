import { useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Share,
  ScrollView,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { IconButton } from "@/components/IconButton";
import { Pill } from "@/components/Pill";
import { confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import {
  deleteConversation,
  getConversation,
  getConversationMessages,
} from "@/api/conversations";
import { TranscriptView, transcriptToText } from "@/features/conversations";
import { formatDuration, formatRelativeFromNow } from "@/utils/format";
import { conversationTitle } from "@/utils/conversation-display";

const REASON_KEYS: Record<string, string> = {
  user: "conversation.endReasonUser",
  interlocutor: "conversation.endReasonInterlocutor",
  balance: "conversation.endReasonBalance",
  timeout: "conversation.endReasonTimeout",
  fatal_error: "conversation.endReasonFatal",
  admin: "conversation.endReasonAdmin",
};

/**
 * Past-conversation viewer. Forest hero card with the meta (phone,
 * duration, end reason, AI config), action row (redial, share, copy,
 * delete), then the full transcript rendered in the same bubble style
 * as the live call.
 */
export default function ConversationDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Scroll tracking — surfaces a floating "scroll to bottom" chip when
  // the user has wandered up the transcript by more than 600 px. Long
  // transcripts on a phone benefit from a fast way back to the latest.
  const scrollRef = useRef<ScrollView>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentSize, contentOffset, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    setShowJumpToBottom(distanceFromBottom > 600);
  }

  const convQuery = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id as string),
    enabled: !!id,
  });

  const messagesQuery = useInfiniteQuery({
    queryKey: ["conversation", id, "messages"],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      getConversationMessages(id as string, { cursor: pageParam, limit: 50 }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!id,
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteConversation(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success(t("conversation.deleteSuccess"));
      router.replace("/history");
    },
    onError: () => toast.error(t("conversation.deleteError")),
  });

  if (convQuery.isLoading || !convQuery.data) {
    return (
      <Screen>
        <Spinner />
      </Screen>
    );
  }

  const c = convQuery.data;
  const reasonKey = c.endReason ? REASON_KEYS[c.endReason] : null;
  const messages = messagesQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const phone = conversationTitle(c);

  const transcriptText = () =>
    transcriptToText({
      phone,
      startedAt: c.startedAt,
      durationSeconds: c.durationSeconds,
      messages,
    });

  async function confirmDelete() {
    const ok = await confirm({
      title: t("conversation.deleteConfirm"),
      confirmLabel: t("conversation.delete"),
      destructive: true,
      icon: "trash-outline",
    });
    if (ok) deleteMut.mutate();
  }

  const aiChips = [c.initialLlmProvider, c.initialTtsProvider, c.initialVoice].filter(
    Boolean,
  ) as string[];

  return (
    <Screen>
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={64}
        contentContainerStyle={{
          gap: theme.spacing.md,
          paddingTop: 4,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <IconButton onPress={() => router.back()} accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </IconButton>
          {c.targetPhone ? (
            <IconButton
              onPress={() =>
                router.push({
                  pathname: "/call/pre",
                  params: { prefillPhone: c.targetPhone as string },
                })
              }
              tone="ink"
              accessibilityLabel={t("history.recall")}
            >
              <Ionicons name="call" size={18} color={theme.colors.primaryText} />
            </IconButton>
          ) : null}
        </View>

        <View style={{ gap: 4 }}>
          <Text variant="label" color="textMuted">
            {t("history.title")}
          </Text>
          <Text variant="title">{phone}</Text>
        </View>

        <View
          style={{
            backgroundColor: theme.colors.surfaceInverse,
            borderRadius: theme.radii.xxl,
            padding: theme.spacing.lg,
            gap: 8,
          }}
        >
          <Text variant="bodyLarge" color="textOnInverse" weight="bold">
            {formatRelativeFromNow(c.startedAt)}
          </Text>
          {c.durationSeconds > 0 ? (
            <Text variant="numeric" color="textOnInverse">
              {formatDuration(c.durationSeconds)}
            </Text>
          ) : null}
          {reasonKey ? (
            <Text variant="caption" color="textOnInverse" style={{ opacity: 0.7 }}>
              {t(reasonKey)}
            </Text>
          ) : null}
          {aiChips.length > 0 ? (
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}
            >
              {aiChips.map((c) => (
                <Pill key={c} label={c} tone="surface" />
              ))}
            </View>
          ) : null}
        </View>

        {/* Single action row: chip-sized buttons rather than three stacked
            full-width CTAs. Destructive "delete" stays in the same row but
            visually retreats (danger text on muted chip background). */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Chip
            label={t("history.share")}
            leading={<Ionicons name="share-outline" size={14} color={theme.colors.text} />}
            disabled={messages.length === 0}
            onPress={() => void Share.share({ message: transcriptText() })}
          />
          <Chip
            label={t("history.copy")}
            leading={<Ionicons name="copy-outline" size={14} color={theme.colors.text} />}
            disabled={messages.length === 0}
            onPress={async () => {
              await Clipboard.setStringAsync(transcriptText());
              toast.success(t("history.copied"));
            }}
          />
          <Chip
            label={t("conversation.delete")}
            leading={<Ionicons name="trash-outline" size={14} color={theme.colors.danger} />}
            disabled={deleteMut.isPending}
            onPress={confirmDelete}
          />
        </View>

        <Text variant="subtitle" style={{ marginTop: theme.spacing.md }}>
          {t("history.transcriptTab")}
        </Text>
        {messagesQuery.isLoading ? (
          <Spinner />
        ) : (
          <TranscriptView messages={messages} />
        )}
        {messagesQuery.hasNextPage ? (
          <Button
            label={t("conversation.loadMore")}
            variant="ghost"
            size="md"
            onPress={() => messagesQuery.fetchNextPage()}
            loading={messagesQuery.isFetchingNextPage}
          />
        ) : null}
      </ScrollView>
      {showJumpToBottom ? (
        <Animated.View
          entering={FadeInDown.duration(200).springify().damping(14)}
          exiting={FadeOutDown.duration(140)}
          style={{
            position: "absolute",
            right: 18,
            bottom: 22,
            zIndex: 100,
          }}
          pointerEvents="box-none"
        >
          <IconButton
            tone="ink"
            shadow
            size={48}
            onPress={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
            accessibilityLabel={t("conversation.jumpToBottom")}
          >
            <Ionicons name="arrow-down" size={20} color={theme.colors.primaryText} />
          </IconButton>
        </Animated.View>
      ) : null}
    </Screen>
  );
}
