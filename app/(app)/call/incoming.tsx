import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { answerPeerCall, declinePeerCall } from "@/api/calls";
import { extractErrorPayload } from "@/api/client";
import { toast } from "@/feedback/toast";
import { useCallSignalStore, useIncomingCallAlert } from "@/features/calls";
import { dismissNativeCall } from "@/notifications/nativeCallUi";
import { callLog, callError } from "@/observability/callLog";

export default function IncomingCallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId: string;
    autoAnswer?: string;
  }>();
  const conversationId = params.conversationId;

  const incoming = useCallSignalStore((s) => s.incoming);
  const clearForConversation = useCallSignalStore(
    (s) => s.clearForConversation,
  );
  const [busy, setBusy] = useState(false);
  const handledRef = useRef(false);

  const callerName = incoming?.caller.name ?? "Невідомий";

  // Vibrate continuously while ringing — the deaf user can't hear the ringtone.
  useIncomingCallAlert(
    Boolean(incoming) && params.autoAnswer !== "1" && !busy,
  );

  const accept = useCallback(async () => {
    if (!conversationId || handledRef.current) return;
    handledRef.current = true;
    setBusy(true);
    callLog("call.incoming.accept", { conversationId });
    try {
      await answerPeerCall(conversationId);
      dismissNativeCall(conversationId);
      clearForConversation(conversationId);
      router.replace({
        pathname: "/call/live",
        params: { conversationId },
      });
    } catch (err) {
      callError("call.incoming.acceptFailed", err, { conversationId });
      const status = extractErrorPayload(err)?.statusCode;
      if (status === 409 || status === 404) {
        // The call was cancelled / ended before we could answer — don't strand
        // the user on the incoming screen with a silently re-enabled button.
        dismissNativeCall(conversationId);
        clearForConversation(conversationId);
        toast.info("Дзвінок завершено");
        router.back();
        return;
      }
      handledRef.current = false;
      setBusy(false);
    }
  }, [conversationId, clearForConversation, router]);

  const decline = useCallback(async () => {
    if (!conversationId || handledRef.current) return;
    handledRef.current = true;
    setBusy(true);
    callLog("call.incoming.decline", { conversationId });
    try {
      await declinePeerCall(conversationId);
    } catch (err) {
      callError("call.incoming.declineFailed", err, { conversationId });
    } finally {
      dismissNativeCall(conversationId);
      clearForConversation(conversationId);
      router.back();
    }
  }, [conversationId, clearForConversation, router]);

  useEffect(() => {
    if (params.autoAnswer === "1") void accept();
  }, [params.autoAnswer, accept]);

  useEffect(() => {
    if (
      conversationId &&
      incoming === null &&
      !handledRef.current &&
      params.autoAnswer !== "1"
    ) {
      router.back();
    }
  }, [incoming, conversationId, params.autoAnswer, router]);

  return (
    <Screen>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: theme.spacing.xxl,
        }}
      >
        <View style={{ alignItems: "center", gap: theme.spacing.md, marginTop: theme.spacing.xxl }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: theme.colors.surfaceMuted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="call" size={40} color={theme.colors.accent} />
          </View>
          <Text variant="title" align="center">
            {callerName}
          </Text>
          <Text variant="body" color="textMuted" align="center">
            Вхідний дзвінок
          </Text>
        </View>

        <View style={{ width: "100%", gap: theme.spacing.md }}>
          <Button
            label="Прийняти"
            variant="accent"
            leading={
              <Ionicons name="call" size={20} color={theme.colors.accentText} />
            }
            loading={busy}
            onPress={accept}
          />
          <Button
            label="Відхилити"
            variant="danger"
            leading={
              <Ionicons name="close" size={20} color={theme.colors.textInverse} />
            }
            onPress={decline}
          />
        </View>
      </View>
    </Screen>
  );
}
