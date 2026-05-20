import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/Banner";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuthStore } from "@/auth/store";
import { useCallStore } from "@/features/calls/live/callStore";
import { useCallSocket } from "@/features/calls/live/useCallSocket";
import { useAppStateReconnect } from "@/features/calls/live/useAppStateReconnect";
import { CallEnding } from "@/features/calls/live/CallEnding";
import { CallSettingsDrawer } from "@/features/calls/live/CallSettingsDrawer";
import { MessageInput } from "@/features/calls/live/MessageInput";
import { SuggestionChips } from "@/features/calls/live/SuggestionChips";
import { Transcript } from "@/features/calls/live/Transcript";
import { formatDuration } from "@/utils/format";

export default function LiveCallScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId: string;
    initialStyleId?: string;
  }>();
  const accessToken = useAuthStore((s) => s.accessToken);

  const status = useCallStore((s) => s.status);
  const bubbles = useCallStore((s) => s.bubbles);
  const suggestions = useCallStore((s) => s.suggestions);
  const aiThinking = useCallStore((s) => s.aiThinking);
  const usageTick = useCallStore((s) => s.usageTick);
  const toastError = useCallStore((s) => s.toastError);
  const fatalError = useCallStore((s) => s.fatalError);
  const endInfo = useCallStore((s) => s.endInfo);
  const setToastError = useCallStore((s) => s.setToastError);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { send } = useCallSocket({
    conversationId: params.conversationId ?? "",
    accessToken: accessToken ?? "",
    initialStyleId: params.initialStyleId || null,
  });

  useAppStateReconnect();

  useEffect(() => {
    if (!toastError) return;
    const id = setTimeout(() => setToastError(null), 4000);
    return () => clearTimeout(id);
  }, [toastError, setToastError]);

  function handleSend(text: string) {
    useCallStore.getState().pushUserTyped(text);
    send({ type: "user.speak", data: { text } });
  }

  function handleSuggestion(s: { id: string; content: string }) {
    useCallStore.getState().pushUserTyped(s.content);
    useCallStore.getState().removeSuggestion(s.id);
    send({ type: "user.accept_suggestion", data: { suggestionId: s.id } });
  }

  function handleEnd() {
    send({ type: "user.end_call" });
  }

  if (!params.conversationId || !accessToken) {
    return (
      <Screen>
        <Banner tone="danger" message={t("preCall.errorGeneric")} />
      </Screen>
    );
  }

  if (endInfo) {
    return (
      <Screen>
        <CallEnding
          info={endInfo}
          onNewCall={() => router.replace("/call/pre")}
          onHistory={() => router.replace("/history")}
        />
      </Screen>
    );
  }

  if (fatalError) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.lg }}>
          <Banner tone="danger" title={t("common.error")} message={fatalError.message} />
        </View>
      </Screen>
    );
  }

  const showConnectingState = status === "connecting" && bubbles.length === 0;
  const headerLine = status === "reconnecting" ? t("live.reconnecting") : null;

  return (
    <Screen padded={false}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("live.endCall")}
          onPress={handleEnd}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons name="close" size={22} color={theme.colors.danger} />
          <Text variant="label" style={{ color: theme.colors.danger }}>
            {t("live.endCall")}
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
          {usageTick ? (
            <Text variant="caption" color="textMuted">
              {formatDuration(usageTick.secondsElapsed)}
              {usageTick.planCode === "free" &&
              typeof usageTick.secondsRemaining === "number"
                ? ` · ${t("live.secondsLeft", {
                    seconds: usageTick.secondsRemaining,
                  })}`
                : ""}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("liveSettings.title")}
            onPress={() => setSettingsOpen(true)}
            hitSlop={8}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={theme.colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <CallSettingsDrawer
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        send={send}
      />

      {headerLine ? (
        <View
          style={{
            backgroundColor: theme.colors.warning,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
          }}
        >
          <Text variant="caption" style={{ color: theme.colors.primaryText }}>
            {headerLine}
          </Text>
        </View>
      ) : null}

      {toastError ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }}>
          <Banner tone="warning" message={toastError.message} />
        </View>
      ) : null}

      {showConnectingState ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text variant="subtitle">{t("live.connecting")}</Text>
          <Spinner />
        </View>
      ) : (
        <>
          <Transcript bubbles={bubbles} aiThinking={aiThinking} />
          <SuggestionChips items={suggestions} onPick={handleSuggestion} />
          <MessageInput onSend={handleSend} disabled={status !== "active"} />
        </>
      )}
    </Screen>
  );
}
