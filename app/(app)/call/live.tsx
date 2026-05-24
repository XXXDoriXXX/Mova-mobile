import { useCallback, useEffect, useState } from "react";
import { BackHandler, Pressable, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AudioWave } from "@/components/AudioWave";
import { Banner } from "@/components/Banner";
import { FaceAvatar } from "@/components/FaceAvatar";
import { IconButton } from "@/components/IconButton";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";
import { useAuthStore } from "@/auth/store";
import { useCallStore } from "@/features/calls/live/callStore";
import { useCallSocket } from "@/features/calls/live/useCallSocket";
import { useAppStateReconnect } from "@/features/calls/live/useAppStateReconnect";
import { CallConnecting } from "@/features/calls/live/CallConnecting";
import { CallEnding } from "@/features/calls/live/CallEnding";
import { CallFatal } from "@/features/calls/live/CallFatal";
import { CallSettingsDrawer } from "@/features/calls/live/CallSettingsDrawer";
import { CallStatusBanner } from "@/features/calls/live/CallStatusBanner";
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
    // Recoverable error → fire the warning toast for the haptic punch
    // (notification + vibration), but DON'T auto-clear the store error
    // anymore. CallStatusBanner now renders it inline above the
    // transcript and stays until the user dismisses it or a new event
    // replaces it — the previous 4s auto-clear meant the message was
    // usually gone before the user looked up from the chat.
    toast.warning(toastError.message);
  }, [toastError]);

  // Fatal errors get a louder error toast — the screen reroutes anyway,
  // but the toast travels with the user to the next screen so they know
  // what happened.
  useEffect(() => {
    if (!fatalError) return;
    toast.error(fatalError.message);
  }, [fatalError]);

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

  async function handleEnd() {
    // Confirm before terminating — single-tap dismissals during a live
    // call are unrecoverable, so we always gate this through the brand
    // confirm sheet.
    const ok = await confirm({
      title: t("live.endCallConfirmTitle"),
      body: t("live.endCallConfirmBody"),
      confirmLabel: t("live.endCall"),
      destructive: true,
      icon: "call",
    });
    if (ok) send({ type: "user.end_call" });
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
    // Retry restarts the whole call flow by routing to /call/pre with
    // the conversation discarded. The user re-picks template/style if
    // needed and a fresh `startCall` mints a new conversation.
    return (
      <Screen>
        <CallFatal
          error={fatalError}
          onRetry={() => {
            useCallStore.getState().reset();
            router.replace("/call/pre");
          }}
          onClose={() => {
            useCallStore.getState().reset();
            router.replace("/home");
          }}
        />
      </Screen>
    );
  }

  // Keep the ringing-loader on screen until we have a real interlocutor
  // (status === "active") or we already have transcript bubbles. The
  // `bubbles.length` escape hatch covers race cases where the very first
  // transcript outraced the `call.answered` event — the chat should win
  // since there is real content to render.
  const showConnectingState =
    (status === "connecting" || status === "ringing") && bubbles.length === 0;
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

      <ActiveStackStrip onPress={() => setSettingsOpen(true)} />

      <SpeakerStatus
        speaking={interlocutorSpeaking}
        aiThinking={aiThinking}
      />

      <CallSettingsDrawer
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        send={send}
      />

      {/* Persistent in-context banner. Owns its own visibility logic:
          renders the reconnecting state when WS is bouncing, and the
          recoverable-error banner with friendly UA copy otherwise.
          Both are dismissible (where appropriate) and outlast the
          transient toast that fires for haptics. */}
      <CallStatusBanner />

      {/* Low-quota warning. Fires only on the free plan in the last
          ~30 seconds — leaves the user enough time to wrap up the
          sentence instead of getting cut off mid-word by the balance
          watchdog. Paid plans have a wallet, not a quota, so the
          countdown is meaningless for them. */}
      {usageTick?.planCode === "free" &&
      typeof usageTick.secondsRemaining === "number" &&
      usageTick.secondsRemaining > 0 &&
      usageTick.secondsRemaining <= 30 ? (
        <LowQuotaWarning seconds={usageTick.secondsRemaining} />
      ) : null}

      {showConnectingState ? (
        <CallConnecting />
      ) : (
        <>
          <Transcript bubbles={bubbles} aiThinking={aiThinking} />
          <SuggestionChips items={suggestions} onPick={handleSuggestion} />
          {/* Allow typing as soon as the call has any signal of life. Only
              hard-disable on the terminal `ended` state — `reconnecting`
              would otherwise lock the composer during a brief WS flap with
              no chance to recover the typed text. */}
          <MessageInput onSend={handleSend} disabled={status === "ended"} />
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

/**
 * Compact provider/model strip — "Deepgram · GPT-4o · ElevenLabs". Renders
 * only what we have so far (events arrive a couple of frames after the WS
 * handshake completes). Tap opens the settings drawer so the user can
 * change anything from here.
 *
 * The forest-pill design intentionally low-contrast — this is metadata,
 * not a primary action. Three short chips inside; if any slot is unknown,
 * we render a "…" placeholder so the layout doesn't jump when data lands.
 */
function ActiveStackStrip({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const llmProvider = useCallStore((s) => s.activeLlmProvider);
  const llmModel = useCallStore((s) => s.activeLlmModel);
  const sttProvider = useCallStore((s) => s.activeSttProvider);
  const ttsProvider = useCallStore((s) => s.activeTtsProvider);
  const activeVoice = useCallStore((s) => s.activeVoice);

  // Render nothing until at least one slot is populated — avoids flashing
  // an empty pill in the first ~200ms before snapshots land.
  if (!llmProvider && !sttProvider && !ttsProvider) return null;

  // Squeeze provider-prefixed model ids like "google/gemini-2.5-flash" →
  // "gemini-2.5-flash"; the prefix is redundant with the provider chip
  // next to it.
  const trimModel = (m: string | null) => (m ? m.split("/").pop() ?? m : null);
  const llmLabel = llmModel ? trimModel(llmModel) : llmProvider ?? "…";
  const sttLabel = sttProvider ?? "…";
  const ttsLabel = activeVoice
    ? `${ttsProvider ?? ""}${ttsProvider ? " · " : ""}${activeVoice}`
    : ttsProvider ?? "…";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Налаштування дзвінка"
      style={({ pressed }) => ({
        marginHorizontal: theme.spacing.page,
        marginBottom: 8,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radii.pill,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <StackChip kind="ear" label={sttLabel} />
        <Dot />
        <StackChip kind="brain" label={llmLabel ?? "…"} />
        <Dot />
        <StackChip kind="voice" label={ttsLabel} />
        <Ionicons
          name="options"
          size={12}
          color={theme.colors.textMuted}
          style={{ marginLeft: "auto" }}
        />
      </View>
    </Pressable>
  );
}

function StackChip({
  kind,
  label,
}: {
  kind: "ear" | "brain" | "voice";
  label: string;
}) {
  const theme = useTheme();
  const icon =
    kind === "ear" ? "ear" : kind === "brain" ? "sparkles" : "mic";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Ionicons name={icon} size={11} color={theme.colors.textMuted} />
      <Text
        variant="label"
        color="textMuted"
        numberOfLines={1}
        style={{ maxWidth: 110, fontSize: 11, letterSpacing: 0.2 }}
      >
        {label}
      </Text>
    </View>
  );
}

function Dot() {
  const theme = useTheme();
  return (
    <View
      style={{
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: theme.colors.border,
      }}
    />
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

/**
 * Free-plan-only countdown banner. Fires at ≤30s remaining so the
 * user can say "let me call you back" instead of getting cut off
 * mid-word by the balance watchdog. Uses the danger tone in the
 * last 10s — psychologically the second-by-second countdown drives
 * the urgency, but the colour drives the "this matters" eye-pull.
 *
 * On the paid plan this never renders — the user's wallet means the
 * call ends when they hang up, not on a clock.
 */
function LowQuotaWarning({ seconds }: { seconds: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const critical = seconds <= 10;
  const palette = critical
    ? {
        bg: "rgba(229,72,61,0.12)",
        border: theme.colors.danger,
        fg: theme.colors.danger,
      }
    : {
        bg: "rgba(199,119,0,0.10)",
        border: theme.colors.warning,
        fg: theme.colors.warning,
      };
  return (
    <View
      style={{
        marginHorizontal: theme.spacing.page,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Ionicons name="time-outline" size={16} color={palette.fg} />
      <Text variant="caption" weight="bold" style={{ color: palette.fg, flex: 1 }}>
        {t("live.lowQuotaWarning", { seconds })}
      </Text>
    </View>
  );
}
