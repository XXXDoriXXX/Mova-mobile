import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import {
  getConversation,
  getConversationMessages,
} from "@/api/conversations";
import { TranscriptView } from "@/features/conversations/TranscriptView";
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

export default function ConversationDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xxl }}>
        <Text variant="title">{formatPhoneForDisplay(c.targetPhone)}</Text>

        <Card>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="body">
              {formatRelativeFromNow(c.startedAt)}
              {c.durationSeconds > 0
                ? ` · ${formatDuration(c.durationSeconds)}`
                : ""}
            </Text>
            {reasonKey ? (
              <Text variant="caption" color="textMuted">
                {t(reasonKey)}
              </Text>
            ) : null}
          </View>
        </Card>

        <Button
          label={t("history.recall")}
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/call/pre",
              params: { prefillPhone: c.targetPhone },
            })
          }
        />

        <Text variant="subtitle">{t("history.transcriptTab")}</Text>
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
