import { useCallback, useEffect, useState } from "react";
import { BackHandler, Pressable, View } from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import {
  AiReplyCandidate,
  CallConnecting,
  CallEnding,
  CallFatal,
  CallSettingsDrawer,
  CallStatusBanner,
  MessageInput,
  SuggestionChips,
  Transcript,
  useAppStateReconnect,
  useCallControls,
  useCallSocket,
  useCallStore,
} from "@/features/calls";
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
  const pendingAiReply = useCallStore((s) => s.pendingAiReply);
  const setPendingAiReply = useCallStore((s) => s.setPendingAiReply);
  const toastError = useCallStore((s) => s.toastError);
  const fatalError = useCallStore((s) => s.fatalError);
  const endInfo = useCallStore((s) => s.endInfo);
  const setToastError = useCallStore((s) => s.setToastError);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Keyboard avoidance that works under Android edge-to-edge (edgeToEdgeEnabled),
  // where the legacy adjustResize no longer shrinks the layout, so the keyboard
  // would otherwise cover the message input. Lift the whole call column by the
  // keyboard height; the SafeAreaView already pads the bottom inset, so subtract
  // it to avoid double spacing. iOS keyboard height resolves the same way.
  const keyboard = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const keyboardAvoidStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(keyboard.height.value - insets.bottom, 0),
  }));

  const { send } = useCallSocket({
    conversationId: params.conversationId ?? "",
    accessToken: accessToken ?? "",
    initialStyleId: params.initialStyleId || null,
  });
  const controls = useCallControls(send);

  useAppStateReconnect();

  useEffect(() => {
    if (!toastError) return;
    toast.warning(toastError.message);
  }, [toastError]);

  useEffect(() => {
    if (!fatalError) return;
    toast.error(fatalError.message);
  }, [fatalError]);

  useEffect(() => {
    if (!endInfo && !fatalError) return;
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({ queryKey: ["billing", "me"] });
    queryClient.invalidateQueries({ queryKey: ["billing", "usage"] });
  }, [endInfo, fatalError, queryClient]);

  function handleSend(text: string) {
    useCallStore.getState().pushUserTyped(text);
    controls.speak(text);
  }

  function handleSuggestion(s: { id: string; content: string }) {
    useCallStore.getState().pushUserTyped(s.content);
    useCallStore.getState().removeSuggestion(s.id);
    controls.speak(s.content);
    controls.acceptSuggestion(s.id);
  }

  function handleAcceptAiReply(candidateId: string) {
    setPendingAiReply(null);
    controls.acceptAiReply(candidateId);
  }
  function handleCancelAiReply(candidateId: string) {
    setPendingAiReply(null);
    controls.cancelAiReply(candidateId);
  }

  async function handleEnd() {
    const ok = await confirm({
      title: t("live.endCallConfirmTitle"),
      body: t("live.endCallConfirmBody"),
      confirmLabel: t("live.endCall"),
      destructive: true,
      icon: "call",
    });
    if (ok) controls.endCall();
  }

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (endInfo || fatalError) return false;
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

  const showConnectingState = status === "connecting" || status === "ringing";
  const reconnecting = status === "reconnecting";

  return (
    <Screen padded={false}>
      <Animated.View style={[{ flex: 1 }, keyboardAvoidStyle]}>
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
        controls={controls}
      />

      <CallStatusBanner />

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
          <Transcript
            bubbles={bubbles}
            aiThinking={aiThinking}
            bottomSignal={(pendingAiReply ? 1 : 0) + suggestions.length}
          />
          {pendingAiReply ? (
            <AiReplyCandidate
              candidate={pendingAiReply}
              onAccept={handleAcceptAiReply}
              onCancel={handleCancelAiReply}
            />
          ) : null}
          <SuggestionChips items={suggestions} onPick={handleSuggestion} />
          <MessageInput onSend={handleSend} disabled={status === "ended"} />
        </>
      )}
      </Animated.View>
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
