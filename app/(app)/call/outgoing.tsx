import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { cancelPeerCall } from "@/api/calls";
import { useCallSignalStore, getCallMediaTransport } from "@/features/calls";

export default function OutgoingCallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const outgoing = useCallSignalStore((s) => s.outgoing);
  const clearForConversation = useCallSignalStore(
    (s) => s.clearForConversation,
  );
  const [muted, setMuted] = useState(false);

  const conversationId = outgoing?.conversationId ?? null;
  const status = outgoing?.status ?? null;

  const hangUp = useCallback(async () => {
    if (!conversationId) {
      router.back();
      return;
    }
    try {
      await cancelPeerCall(conversationId);
    } catch {
      // ignore — teardown is best-effort
    } finally {
      await getCallMediaTransport().disconnect();
      clearForConversation(conversationId);
      router.back();
    }
  }, [conversationId, clearForConversation, router]);

  const toggleMute = useCallback(async () => {
    const next = !muted;
    setMuted(next);
    await getCallMediaTransport().setMuted(next);
  }, [muted]);

  useEffect(() => {
    if (status === "declined" || status === "cancelled") {
      const id = setTimeout(() => {
        void getCallMediaTransport().disconnect();
        if (conversationId) clearForConversation(conversationId);
        router.back();
      }, 1500);
      return () => clearTimeout(id);
    }
  }, [status, conversationId, clearForConversation, router]);

  const statusLabel =
    status === "accepted"
      ? "На звʼязку"
      : status === "declined"
        ? "Дзвінок відхилено"
        : status === "cancelled"
          ? "Дзвінок завершено"
          : "Дзвонимо…";

  return (
    <Screen background="ink">
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: theme.spacing.xxl,
        }}
      >
        <View
          style={{
            alignItems: "center",
            gap: theme.spacing.md,
            marginTop: theme.spacing.xxl,
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: theme.colors.surfaceAccent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person" size={40} color={theme.colors.accentText} />
          </View>
          <Text variant="title" align="center" color="textInverse">
            {outgoing?.calleeName ?? ""}
          </Text>
          <Text variant="body" color="textInverse" align="center">
            {statusLabel}
          </Text>
        </View>

        <View style={{ width: "100%", gap: theme.spacing.lg, alignItems: "center" }}>
          {status === "accepted" ? (
            <IconButton
              tone={muted ? "danger" : "muted"}
              accessibilityLabel="mute"
              onPress={toggleMute}
            >
              <Ionicons
                name={muted ? "mic-off" : "mic"}
                size={22}
                color={muted ? theme.colors.textInverse : theme.colors.text}
              />
            </IconButton>
          ) : null}
          <Button
            label="Завершити"
            variant="danger"
            leading={
              <Ionicons name="call" size={20} color={theme.colors.textInverse} />
            }
            onPress={hangUp}
          />
        </View>
      </View>
    </Screen>
  );
}
