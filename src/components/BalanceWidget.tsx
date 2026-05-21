import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AnimatedNumber } from "./AnimatedNumber";
import { RingProgress } from "./RingProgress";
import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { BillingSummary } from "@/types/api";
import { estimateMinutesFromBalance } from "@/utils/format";

type Props = { summary: BillingSummary; onPress?: () => void };

/**
 * Forest-tone balance card. Coloured surface on the left with the headline
 * amount, and a large ring on the right that doubles as the at-a-glance
 * status indicator:
 *
 *   - Free plan → arc fills with the share of the monthly quota that's
 *     still left, centre shows the % and "left" label, colour shifts
 *     lime → amber → coral as it drains.
 *   - Paid plan → arc full lime, centre shows minutes the current
 *     balance buys (turns to "∞" if essentially unbounded), so the
 *     user reads "how long can I talk?" without scanning two figures.
 *
 * Used on /home and /billing.
 */
export function BalanceWidget({ summary, onPress }: Props) {
  const { t } = useTranslation();

  const inner = <Inner summary={summary} />;
  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("home.balanceTitle")}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      {inner}
    </Pressable>
  );
}

function Inner({ summary }: { summary: BillingSummary }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const isFree = summary.plan.code === "free";
  const numericHeadline = isFree
    ? summary.freeSecondsRemaining
    : summary.balanceCents / 100;

  const sub = isFree
    ? t("home.balanceFreeQuota", {
        used: summary.freeSecondsUsed,
        total: summary.plan.freeSecondsPerMonth,
      })
    : t("home.balanceMinutes", {
        minutes: estimateMinutesFromBalance(
          summary.balanceCents,
          summary.plan.pricePerSecondCents,
        ),
      });

  const ratio = isFree
    ? summary.plan.freeSecondsPerMonth > 0
      ? Math.max(
          0,
          1 - summary.freeSecondsUsed / summary.plan.freeSecondsPerMonth,
        )
      : 0
    : 1;

  // Arc colour shifts as the free quota drains. Paid plan is always lime
  // because the ratio doesn't represent depletion of a fixed bucket — it
  // would be misleading to colour it red just because the user has a
  // small balance relative to some arbitrary baseline.
  const ringColor =
    !isFree || ratio > 0.5
      ? theme.colors.accent
      : ratio > 0.2
        ? theme.colors.warning
        : theme.colors.danger;

  // Centre figures inside the ring. Kept short — the long-form numbers
  // live on the left side of the card so the ring stays scannable from
  // across the room.
  const minutesFromBalance = isFree
    ? null
    : estimateMinutesFromBalance(
        summary.balanceCents,
        summary.plan.pricePerSecondCents,
      );
  const centerPrimary = isFree
    ? `${Math.round(ratio * 100)}%`
    : minutesFromBalance != null && Number.isFinite(minutesFromBalance)
      ? `${minutesFromBalance}`
      : "∞";
  const centerLabel = isFree
    ? t("home.balanceRingLeftLabel")
    : t("home.balanceRingMinutesLabel");

  return (
    <View
      style={{
        backgroundColor: theme.colors.surfaceInverse,
        borderRadius: theme.radii.xxl,
        paddingHorizontal: 20,
        paddingVertical: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <Text variant="label" color="textOnInverse" style={{ opacity: 0.65 }}>
          {t("home.balanceTitle")}
        </Text>
        <AnimatedNumber
          value={numericHeadline}
          format={(n) =>
            isFree
              ? `${Math.max(0, Math.round(n))}s`
              : t("home.balanceAmount", {
                  amount: n.toLocaleString("uk-UA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                })
          }
          variant="title"
          color="textOnInverse"
        />
        <Text variant="caption" color="textOnInverse" style={{ opacity: 0.65 }}>
          {sub}
        </Text>
      </View>
      <RingProgress size={92} value={ratio} width={8} stroke={ringColor}>
        <Text
          variant="numeric"
          color="textOnInverse"
          style={{ fontSize: 22, lineHeight: 24 }}
        >
          {centerPrimary}
        </Text>
        <Text
          variant="label"
          color="textOnInverse"
          style={{ opacity: 0.55, fontSize: 9, marginTop: 2, letterSpacing: 0.5 }}
        >
          {centerLabel}
        </Text>
      </RingProgress>
    </View>
  );
}
