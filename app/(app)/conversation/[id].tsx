import { Alert, Share, ScrollView, View } from "react-native";
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
import { IconButton } from "@/components/IconButton";
import { Pill } from "@/components/Pill";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import {
  deleteConversation,
  getConversation,
  getConversationMessages,
} from "@/api/conversations";
import { TranscriptView } from "@/features/conversations/TranscriptView";
import { transcriptToText } from "@/features/conversations/exportTranscript";
import { formatDuration, formatRelativeFromNow } from "@/utils/format";
import { formatPhoneForDisplay } from "@/utils/phone";

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
      router.replace("/history");
    },
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
  const phone = formatPhoneForDisplay(c.targetPhone);

  const transcriptText = () =>
    transcriptToText({
      phone: c.targetPhone,
      startedAt: c.startedAt,
      durationSeconds: c.durationSeconds,
      messages,
    });

  function confirmDelete() {
    Alert.alert(t("conversation.deleteConfirm"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("conversation.delete"),
        style: "destructive",
        onPress: () => deleteMut.mutate(),
      },
    ]);
  }

  const aiChips = [c.initialLlmProvider, c.initialTtsProvider, c.initialVoice].filter(
    Boolean,
  ) as string[];

  return (
    <Screen>
      <ScrollView
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
          <IconButton
            onPress={() =>
              router.push({
                pathname: "/call/pre",
                params: { prefillPhone: c.targetPhone },
              })
            }
            tone="ink"
            accessibilityLabel={t("history.recall")}
          >
            <Ionicons name="call" size={18} color={theme.colors.primaryText} />
          </IconButton>
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

        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t("history.share")}
              variant="secondary"
              size="md"
              disabled={messages.length === 0}
              onPress={() => void Share.share({ message: transcriptText() })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("history.copy")}
              variant="secondary"
              size="md"
              disabled={messages.length === 0}
              onPress={() => void Clipboard.setStringAsync(transcriptText())}
            />
          </View>
        </View>

        <Button
          label={t("conversation.delete")}
          variant="ghost"
          loading={deleteMut.isPending}
          onPress={confirmDelete}
        />

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
            label={t("common.loading")}
            variant="ghost"
            onPress={() => messagesQuery.fetchNextPage()}
            loading={messagesQuery.isFetchingNextPage}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
