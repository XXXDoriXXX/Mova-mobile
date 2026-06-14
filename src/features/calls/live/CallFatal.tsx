import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { CallErrorCode } from "@/realtime/error-codes";

import type { CallError } from "./callStore";

type Props = {
  error: CallError;
  onRetry: () => void;
  onClose: () => void;
};

export function CallFatal({ error, onRetry, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const copy = resolveCopy(t, error);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.xl,
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: theme.colors.dangerSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={copy.icon} size={36} color={theme.colors.danger} />
      </View>

      <View style={{ gap: 8, alignItems: "center" }}>
        <Text variant="title" align="center">
          {copy.title}
        </Text>
        <Text
          variant="body"
          color="textMuted"
          align="center"
          style={{ maxWidth: 300 }}
        >
          {copy.body}
        </Text>
        <Text
          variant="label"
          color="textMuted"
          style={{ marginTop: 6, opacity: 0.6 }}
        >
          {t("live.fatalCode", { code: error.code })}
        </Text>
      </View>

      <View style={{ width: "100%", gap: 6 }}>
        <Button
          label={t("live.fatalRetry")}
          variant="primary"
          leading={<Ionicons name="refresh" size={16} color={theme.colors.primaryText} />}
          onPress={onRetry}
        />
        <Button
          label={t("live.fatalClose")}
          variant="ghost"
          size="md"
          onPress={onClose}
        />
      </View>
    </View>
  );
}

function resolveCopy(t: (k: string) => string, error: CallError) {
  if (error.message === "CONNECT_TIMEOUT") {
    return {
      icon: "time-outline" as const,
      title: t("live.fatalReasons.connectTimeout.title"),
      body: t("live.fatalReasons.connectTimeout.body"),
    };
  }
  if (error.message === "NO_ANSWER") {
    return {
      icon: "call-outline" as const,
      title: t("live.fatalReasons.noAnswer.title"),
      body: t("live.fatalReasons.noAnswer.body"),
    };
  }
  switch (error.code) {
    case CallErrorCode.BALANCE_EXHAUSTED:
      return {
        icon: "wallet-outline" as const,
        title: t("live.fatalReasons.balance.title"),
        body: t("live.fatalReasons.balance.body"),
      };
    case CallErrorCode.LIVEKIT_DISCONNECTED:
      return {
        icon: "cloud-offline-outline" as const,
        title: t("live.fatalReasons.livekit.title"),
        body: t("live.fatalReasons.livekit.body"),
      };
    case CallErrorCode.AGENT_LOST:
      return {
        icon: "warning-outline" as const,
        title: t("live.fatalReasons.agent.title"),
        body: t("live.fatalReasons.agent.body"),
      };
    case CallErrorCode.CALL_TIMEOUT:
      return {
        icon: "timer-outline" as const,
        title: t("live.fatalReasons.callTimeout.title"),
        body: t("live.fatalReasons.callTimeout.body"),
      };
    default:
      return {
        icon: "alert-circle-outline" as const,
        title: t("live.fatalReasons.generic.title"),
        body: error.message || t("live.fatalReasons.generic.body"),
      };
  }
}
