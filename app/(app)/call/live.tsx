import { useCallback, useEffect, useState } from "react";
import { Alert, BackHandler, Pressable, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { AudioWave } from "@/components/AudioWave";
import { Banner } from "@/components/Banner";
import { FaceAvatar } from "@/components/FaceAvatar";
import { IconButton } from "@/components/IconButton";
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

/**
 * Live call screen. Header has a back arrow, a centre identity pill
 * (avatar + name + duration), and a destructive hangup button — exactly
 * the layout from the design canvas. Beneath, a "live speaker" status
 * card pulses while the partner is mid-utterance; the transcript fills
 * the centre; quick-replies + composer pin the bottom.
 */
export default function LiveCallScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId: string;
    initialStyleId?: string;
  }>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const status = useCallStore((s) => s.status);
  const bubbles = useCallStore((s) => s.bubbles);
  const suggestions = useCallStore((s) => s.suggestions);
  const aiThinking = useCallStore((s) => s.aiThinking);
  const interlocutorSpeaking = useCallStore((s) =>
    s.bubbles.some(
      (b) => b.role === "interlocutor" && b.partial,
    ),
  );
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

  // When the call ends (or fatal-errors out), invalidate the queries the
  // History + Home screens read from so the new conversation appears + the
  // free-seconds / balance figures reflect the just-finished session.
  useEffect(() => {
    if (!endInfo && !fatalError) return;
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({ queryKey: ["billing", "me"] });
    queryClient.invalidateQueries({ queryKey: ["billing", "usage"] });
  }, [endInfo, fatalError, queryClient]);

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
    // Confirm before terminating — the End button is at the screen edge and
    // single-tap dismissals during a live call are unrecoverable.
    Alert.alert(t("live.endCallConfirmTitle"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("live.endCall"),
        style: "destructive",
        onPress: () => send({ type: "user.end_call" }),
      },
    ]);
  }

  // Android hardware back during an active call must NOT silently leave the
  // screen — that would orphan the live connection on the backend while the
  // user sees a stale /call/pre. Surface the same hang-up confirm instead.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (endInfo || fatalError) return false; // let the system handle it
        handleEnd();
        return true;
      });
      return () => sub.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endInfo, fatalError]),
  );

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
  const reconnecting = status === "reconnecting";

  return (
    <Screen padded={false}>
      <Header
        durationSeconds={usageTick?.secondsElapsed ?? 0}
        secondsRemaining={
          usageTick?.planCode === "free" ? usageTick.secondsRemaining : null
        }
        onSettings={() => setSettingsOpen(true)}
        onEnd={handleEnd}
        reconnecting={reconnecting}
      />

      <SpeakerStatus
        speaking={interlocutorSpeaking}
        aiThinking={aiThinking}
      />

      <CallSettingsDrawer
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        send={send}
      />

      {toastError ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(200)}
          style={{
            paddingHorizontal: theme.spacing.page,
            paddingVertical: theme.spacing.sm,
          }}
        >
          <Banner tone="warning" message={toastError.message} />
        </Animated.View>
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

type HeaderProps = {
  durationSeconds: number;
  secondsRemaining: number | null;
  onSettings: () => void;
  onEnd: () => void;
  reconnecting: boolean;
};

/**
 * In-call header — only TWO controls: a wide identity pill that doubles as
 * the settings entry-point, and a danger hangup button on the right.
 *
 * There is no back button: the previous implementation routed back to
 * /call/pre without ending the call, orphaning the live connection. Now
 * the only way out is the hangup button (or Android hardware back, which
 * we intercept above to show the same confirm).
 */
function Header({
  durationSeconds,
  secondsRemaining,
  onSettings,
  onEnd,
  reconnecting,
}: HeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.page,
        paddingTop: 6,
        paddingBottom: 10,
        gap: 10,
      }}
    >
      <Pressable
        onPress={onSettings}
        accessibilityRole="button"
        accessibilityLabel={t("liveSettings.title")}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: 999,
          paddingLeft: 6,
          paddingRight: 12,
          paddingVertical: 6,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <FaceAvatar size={32} />
        <View style={{ flexShrink: 1 }}>
          <Text
            variant="caption"
            weight="bold"
            numberOfLines={1}
            style={{ fontSize: 14 }}
          >
            {t("live.callee")}
          </Text>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: reconnecting ? theme.colors.warning : theme.colors.danger,
              }}
            />
            <Text variant="label" color="textMuted">
              {formatDuration(durationSeconds)}
              {secondsRemaining !== null
                ? ` · ${t("live.secondsLeft", { seconds: secondsRemaining })}`
                : ""}
            </Text>
          </View>
        </View>
        <Ionicons
          name="options"
          size={16}
          color={theme.colors.textMuted}
          style={{ marginLeft: "auto" }}
        />
      </Pressable>

      <IconButton
        tone="danger"
        shadow
        onPress={onEnd}
        accessibilityLabel={t("live.endCall")}
      >
        <Ionicons
          name="call"
          size={20}
          color={theme.colors.primaryText}
          style={{ transform: [{ rotate: "135deg" }] }}
        />
      </IconButton>
    </View>
  );
}

function SpeakerStatus({
  speaking,
  aiThinking,
}: {
  speaking: boolean;
  aiThinking: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const visible = speaking || aiThinking;
  if (!visible) return null;

  return (
    <View style={{ paddingHorizontal: theme.spacing.page, paddingBottom: 8 }}>
      <View
        style={{
          backgroundColor: theme.colors.surfaceInverse,
          borderRadius: theme.radii.lg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.colors.accent,
            }}
          />
          <Text
            variant="label"
            color="textOnInverse"
            style={{ textTransform: "uppercase" }}
          >
            {speaking ? t("live.transcribingPartner") : t("live.aiThinking")}
          </Text>
        </View>
        <AudioWave color={theme.colors.accent} count={12} height={20} />
      </View>
    </View>
  );
}
