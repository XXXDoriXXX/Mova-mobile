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
  balance: "conversation.endReasonBalance",
  timeout: "conversation.endReasonTimeout",
  fatal_error: "conversation.endReasonFatal",
  admin: "conversation.endReasonAdmin",
};

export function CallEnding({ info, onNewCall, onHistory }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const reasonKey = REASON_KEYS[info.reason];
  const balanceExhausted = info.reason === "balance";

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
        {t("live.endingTitle")}
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
          <Pill
            tone="accent"
            label={`₴ ${formatCentsAsUah(cost)}`}
          />
        ) : null}
        {reasonKey ? (
          <Text
            variant="body"
            color="textOnInverse"
            align="center"
            style={{ opacity: 0.7, marginTop: 4 }}
          >
            {t(reasonKey)}
          </Text>
        ) : null}
      </View>

      {/* Recovery actions. We deliberately keep only ONE full-width
          CTA so the post-call sheet doesn't feel like a wall of
          buttons: balance-exhausted promotes "Top up", otherwise the
          primary is "New call". "Go to history" is a small ghost link
          underneath. */}
      <View style={{ gap: 4 }}>
        {balanceExhausted ? (
          <Button
            label={t("preCall.topupCta")}
            variant="accent"
            onPress={() => router.replace("/billing")}
          />
        ) : (
          <Button
            label={t("live.endingNewCall")}
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
