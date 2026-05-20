import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
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

  // Pull plan from cache (post-call invalidation already kicked a refetch);
  // shown only on paid plans where there's a real per-second price.
  const summary = useQuery({
    queryKey: ["billing", "me"],
    queryFn: getBillingSummary,
  }).data;
  const cost =
    summary && summary.plan.code === "paid"
      ? info.durationSeconds * summary.plan.pricePerSecondCents
      : null;

  return (
    <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.lg }}>
      <Text variant="title" align="center">
        {t("live.endingTitle")}
      </Text>

      <Card>
        <Text variant="displayLarge" align="center">
          {formatDuration(info.durationSeconds)}
        </Text>
        {cost !== null ? (
          <Text
            variant="subtitle"
            color="textMuted"
            align="center"
            style={{ marginTop: theme.spacing.xs }}
          >
            ₴ {formatCentsAsUah(cost)}
          </Text>
        ) : null}
        {reasonKey ? (
          <Text
            variant="body"
            color="textMuted"
            align="center"
            style={{ marginTop: theme.spacing.sm }}
          >
            {t(reasonKey)}
          </Text>
        ) : null}
      </Card>

      <View style={{ gap: theme.spacing.sm }}>
        {balanceExhausted ? (
          <Button
            label={t("preCall.topupCta")}
            onPress={() => router.replace("/billing")}
          />
        ) : null}
        <Button
          label={t("live.endingNewCall")}
          variant={balanceExhausted ? "secondary" : "primary"}
          onPress={onNewCall}
        />
        <Button
          label={t("live.endingGoHistory")}
          variant="ghost"
          onPress={onHistory}
        />
      </View>
    </View>
  );
}
