import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { formatDuration } from "@/utils/format";

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
  const reasonKey = REASON_KEYS[info.endReason];

  return (
    <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.lg }}>
      <Text variant="title" align="center">
        {t("live.endingTitle")}
      </Text>

      <Card>
        <Text variant="displayLarge" align="center">
          {formatDuration(info.durationSeconds)}
        </Text>
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
        <Button label={t("live.endingNewCall")} onPress={onNewCall} />
        <Button
          label={t("live.endingGoHistory")}
          variant="secondary"
          onPress={onHistory}
        />
      </View>
    </View>
  );
}
