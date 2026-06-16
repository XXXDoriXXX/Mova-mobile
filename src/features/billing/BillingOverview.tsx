import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { BalanceWidget } from "@/components/BalanceWidget";
import { PressableScale } from "@/components/PressableScale";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { listUsage } from "@/api/billing";
import type { BillingSummary } from "@/types/api";
import { formatCentsAsUah } from "@/utils/format";

type Props = {
  summary: BillingSummary;
  onPickQuickTopup?: (amountUah: number) => void;
  onOpenPlan?: () => void;
  onOpenSubscription?: () => void;
};

const QUICK_TOPUPS = [50, 100, 200];

export function BillingOverview({
  summary,
  onPickQuickTopup,
  onOpenPlan,
  onOpenSubscription,
}: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const usageQuery = useQuery({
    queryKey: ["billing", "usage"],
    queryFn: () => listUsage(),
    staleTime: 60_000,
  });

  const weekStats = (() => {
    const items = usageQuery.data ?? [];
    const cutoff = Date.now() - 7 * 86_400_000;
    const recent = items.filter((u) => new Date(u.recordedAt).getTime() >= cutoff);
    const seconds = recent.reduce((acc, u) => acc + u.secondsBilled, 0);
    const cents = recent.reduce(
      (acc, u) => acc + (u.source === "paid" ? u.costCents : 0),
      0,
    );
    return { seconds, cents, count: recent.length };
  })();

  const renewsDate = new Date(summary.currentPeriodEnd).toLocaleDateString(
    i18n.language === "en" ? "en-US" : "uk-UA",
    { day: "numeric", month: "short", year: "numeric" },
  );

  const isPlus = summary.plan.code === "plus";

  return (
    <View style={{ gap: theme.spacing.md }}>
      <BalanceWidget summary={summary} />

      {onOpenSubscription ? (
        <PressableScale
          onPress={onOpenSubscription}
          haptic="light"
          scaleTo={0.99}
          style={{
            backgroundColor: isPlus
              ? theme.colors.surface
              : theme.colors.surfaceInverse,
            borderRadius: theme.radii.xxl,
            padding: theme.spacing.lg,
            borderWidth: 1,
            borderColor: isPlus ? theme.colors.border : theme.colors.surfaceInverse,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              variant="subtitle"
              color={isPlus ? "text" : "textInverse"}
            >
              MOVA Plus
            </Text>
            <Text
              variant="caption"
              color={isPlus ? "textMuted" : "textInverse"}
            >
              {isPlus
                ? summary.cancelAtPeriodEnd
                  ? t("billing.plus.endsAt", { date: renewsDate })
                  : t("billing.plus.renewsAt", { date: renewsDate })
                : t("billing.plus.ctaSubtitle")}
            </Text>
          </View>
          <Ionicons
            name={isPlus ? "chevron-forward" : "sparkles"}
            size={20}
            color={isPlus ? theme.colors.textMuted : theme.colors.accent}
          />
        </PressableScale>
      ) : null}

      <PressableScale
        onPress={onOpenPlan}
        haptic="light"
        scaleTo={0.99}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.xxl,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <View style={{ gap: 4, flex: 1 }}>
            <Text
              variant="label"
              color="textMuted"
              style={{ textTransform: "uppercase" }}
            >
              {t("billing.currentPlan")}
            </Text>
            <Text variant="subtitle">{summary.plan.name}</Text>
            <Text variant="caption" color="textMuted">
              {t("billing.renewsAt", { date: renewsDate })}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textMuted}
          />
        </View>
      </PressableScale>

      {onPickQuickTopup ? (
        <View style={{ gap: 8 }}>
          <Text
            variant="label"
            color="textMuted"
            style={{ textTransform: "uppercase" }}
          >
            {t("billing.quickAmounts")}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {QUICK_TOPUPS.map((amount) => (
              <PressableScale
                key={amount}
                onPress={() => onPickQuickTopup(amount)}
                haptic="selection"
                scaleTo={0.94}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radii.pill,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text variant="button" color="textInverse">
                  ₴ {amount}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.xxl,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Text variant="subtitle">{t("billing.weekSummaryTitle")}</Text>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: theme.colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="trending-up"
              size={16}
              color={theme.colors.accentText}
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <Stat
            label={t("billing.weekCalls")}
            value={String(weekStats.count)}
          />
          <Stat
            label={t("billing.weekMinutes")}
            value={Math.round(weekStats.seconds / 60).toString()}
          />
          <Stat
            label={t("billing.weekSpend")}
            value={`₴ ${formatCentsAsUah(weekStats.cents)}`}
          />
        </View>
        {weekStats.count === 0 ? (
          <Text variant="caption" color="textMuted">
            {t("billing.weekEmpty")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text variant="numeric" style={{ fontSize: 22, lineHeight: 26 }}>
        {value}
      </Text>
      <Text
        variant="label"
        color="textMuted"
        style={{ textTransform: "uppercase" }}
      >
        {label}
      </Text>
      <View
        style={{
          height: 3,
          width: 24,
          borderRadius: 2,
          backgroundColor: theme.colors.borderStrong,
          opacity: 0.5,
        }}
      />
    </View>
  );
}
