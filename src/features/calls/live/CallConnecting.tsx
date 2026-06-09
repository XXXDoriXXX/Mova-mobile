import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useCallStore } from "./callStore";

type Phase = "handshake" | "dialing" | "ringing" | "stalled";

export function CallConnecting() {
  const { t } = useTranslation();
  const theme = useTheme();
  const wsConnected = useCallStore((s) => s.wsConnected);
  const status = useCallStore((s) => s.status);
  const startedAt = useCallStore((s) => s.connectStartedAt);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = startedAt ? now - startedAt : 0;
  // Prefer the authoritative status when it's available:
  //   - `ringing` → backend confirmed the dial fired and we're waiting
  //     for the phone to pick up. Use the time elapsed inside ringing to
  //     decide between dialing copy (early) and stalled copy (very late).
  //   - otherwise → derive from WS connectivity + elapsed time as before.
  const phase: Phase =
    status === "ringing"
      ? elapsedMs < 5_000
        ? "dialing"
        : elapsedMs < 25_000
          ? "ringing"
          : "stalled"
      : !wsConnected
        ? "handshake"
        : elapsedMs < 5_000
          ? "dialing"
          : elapsedMs < 12_000
            ? "ringing"
            : "stalled";

  // Pulsing circle scale — driven on the UI thread so it doesn't tick
  // with React's render cadence.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.18, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const copy = phaseCopy(t, phase);

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
          width: 140,
          height: 140,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer ring pulses, inner solid stays still — gives the
            "breathing dot" effect without the icon swelling. */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: theme.colors.accent,
              opacity: 0.18,
            },
            pulseStyle,
          ]}
        />
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.colors.surfaceInverse,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={copy.icon} size={32} color={theme.colors.accent} />
        </View>
      </View>

      <Animated.View
        // Cross-fade the copy so phase transitions feel intentional.
        key={phase}
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(120)}
        style={{ gap: 8, alignItems: "center" }}
      >
        <Text variant="title" align="center">
          {copy.title}
        </Text>
        <Text
          variant="body"
          color="textMuted"
          align="center"
          style={{ maxWidth: 280 }}
        >
          {copy.body}
        </Text>
      </Animated.View>

      <PhaseDots phase={phase} />
    </View>
  );
}

function phaseCopy(t: (k: string) => string, phase: Phase) {
  switch (phase) {
    case "handshake":
      return {
        icon: "cloud-outline" as const,
        title: t("live.connectPhases.handshake.title"),
        body: t("live.connectPhases.handshake.body"),
      };
    case "dialing":
      return {
        icon: "call-outline" as const,
        title: t("live.connectPhases.dialing.title"),
        body: t("live.connectPhases.dialing.body"),
      };
    case "ringing":
      return {
        icon: "radio-outline" as const,
        title: t("live.connectPhases.ringing.title"),
        body: t("live.connectPhases.ringing.body"),
      };
    case "stalled":
      return {
        icon: "hourglass-outline" as const,
        title: t("live.connectPhases.stalled.title"),
        body: t("live.connectPhases.stalled.body"),
      };
  }
}

const PHASE_ORDER: Phase[] = ["handshake", "dialing", "ringing", "stalled"];

function PhaseDots({ phase }: { phase: Phase }) {
  const theme = useTheme();
  const idx = PHASE_ORDER.indexOf(phase);
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {PHASE_ORDER.map((p, i) => (
        <View
          key={p}
          style={{
            width: i === idx ? 22 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor:
              i <= idx ? theme.colors.primary : theme.colors.surfaceMuted,
          }}
        />
      ))}
    </View>
  );
}
