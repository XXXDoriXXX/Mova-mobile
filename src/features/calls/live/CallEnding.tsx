import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { getBillingSummary } from "@/api/billing";
import { formatCentsAsUah, formatDuration } from "@/utils/format";

import type { CallEnd } from "./callStore";

type Props = {
  info: CallEnd;
  onNewCall: () => void;
  onHistory: () => void;
};

const REASON_KEYS: Record<string, string> = {
  user: "conversation.endReasonUser",
  interlocutor: "conversation.endReasonInterlocutor",
  no_answer: "conversation.endReasonNoAnswer",
  balance: "conversation.endReasonBalance",
  timeout: "conversation.endReasonTimeout",
  fatal_error: "conversation.endReasonFatal",
  admin: "conversation.endReasonAdmin",
};

const ERROR_CODE_KEYS: Record<string, string> = {
  CALL_DECLINED: "conversation.endCallDeclined",
  CALL_UNANSWERED: "conversation.endCallUnanswered",
  CALLEE_UNAVAILABLE: "conversation.endCalleeUnavailable",
  CALLEE_OFFLINE: "conversation.endCalleeOffline",
  CALLEE_BUSY: "conversation.endCalleeBusy",
  LIVEKIT_DISCONNECTED: "conversation.endTelephonyError",
  AGENT_LOST: "conversation.endAgentLost",
  CALL_TIMEOUT: "conversation.endReasonTimeout",
  BALANCE_EXHAUSTED: "conversation.endReasonBalance",
  FATAL_INTERNAL: "conversation.endReasonFatal",
};

export function CallEnding({ info, onNewCall, onHistory }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const messageKey =
    (info.errorCode && ERROR_CODE_KEYS[info.errorCode]) || REASON_KEYS[info.reason];
  const balanceExhausted = info.reason === "balance";
  const neverAnswered =
    info.wasAnswered === false || info.reason === "no_answer";
  const offerRedial =
    info.reason === "no_answer" ||
    info.reason === "fatal_error" ||
    info.reason === "timeout";

  const title = neverAnswered
    ? t("live.endingTitleNoAnswer")
    : info.reason === "fatal_error"
      ? t("live.endingTitleError")
      : t("live.endingTitle");

  const summary = useQuery({
    queryKey: ["billing", "me"],
    queryFn: getBillingSummary,
  }).data;
  const cost =
    summary && summary.plan.code === "paid"
      ? info.durationSeconds * summary.plan.pricePerSecondCents
      : null;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        gap: theme.spacing.lg,
        paddingVertical: theme.spacing.xxl,
      }}
    >
      <Text variant="title" align="center">
        {title}
      </Text>

      <View
        style={{
          backgroundColor: theme.colors.surfaceInverse,
          borderRadius: theme.radii.xxl,
          padding: theme.spacing.xl,
          gap: 8,
          alignItems: "center",
        }}
      >
        {neverAnswered ? (
          <Text
            variant="title"
            color="textOnInverse"
            align="center"
            style={{ opacity: 0.92 }}
          >
            {messageKey ? t(messageKey) : t("conversation.endReasonNoAnswer")}
          </Text>
        ) : (
          <>
            <Text variant="label" color="textOnInverse" style={{ opacity: 0.6 }}>
              {t("live.endingDurationLabel")}
            </Text>
            <Text
              variant="display"
              color="textOnInverse"
              style={{ fontSize: 56, lineHeight: 56 }}
            >
              {formatDuration(info.durationSeconds)}
            </Text>
            {cost !== null ? (
              <Pill tone="accent" label={`₴ ${formatCentsAsUah(cost)}`} />
            ) : null}
            {messageKey ? (
              <Text
                variant="body"
                color="textOnInverse"
                align="center"
                style={{ opacity: 0.7, marginTop: 4 }}
              >
                {t(messageKey)}
              </Text>
            ) : null}
          </>
        )}
      </View>

      <View style={{ gap: 4 }}>
        {balanceExhausted ? (
          <Button
            label={t("preCall.topupCta")}
            variant="accent"
            onPress={() => router.replace("/billing")}
          />
        ) : (
          <Button
            label={offerRedial ? t("live.endingRedial") : t("live.endingNewCall")}
            variant="primary"
            onPress={onNewCall}
          />
        )}
        <Button
          label={t("live.endingGoHistory")}
          variant="ghost"
          size="md"
          onPress={onHistory}
        />
      </View>
    </View>
  );
}
