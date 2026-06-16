import { ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { getBillingSummary, listPlans } from "@/api/billing";
import { confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";
import {
  useCancelSubscription,
  useStartSubscription,
} from "@/features/billing";
import { formatCentsAsUah } from "@/utils/format";

const FEATURES: Array<{ icon: keyof typeof Ionicons.glyphMap; key: string }> = [
  { icon: "call", key: "minutes" },
  { icon: "people", key: "peer" },
  { icon: "color-wand", key: "voices" },
  { icon: "flash", key: "model" },
  { icon: "time", key: "long" },
];

export default function SubscriptionScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const summaryQuery = useQuery({
    queryKey: ["billing", "me"],
    queryFn: getBillingSummary,
  });
  const plansQuery = useQuery({ queryKey: ["billing", "plans"], queryFn: listPlans });

  const { start, submitting, failed } = useStartSubscription();
  const cancelMut = useCancelSubscription();

  const summary = summaryQuery.data;
  const plusPlan = plansQuery.data?.find((p) => p.code === "plus");
  const isPlus = summary?.plan.code === "plus";

  const priceUah = plusPlan ? formatCentsAsUah(plusPlan.monthlyPriceCents) : "199";
  const periodDate = summary
    ? new Date(summary.currentPeriodEnd).toLocaleDateString(
        i18n.language === "en" ? "en-US" : "uk-UA",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : "";

  async function onCancel() {
    const ok = await confirm({
      title: t("billing.plus.cancelConfirmTitle"),
      body: t("billing.plus.cancelConfirmBody", { date: periodDate }),
      confirmLabel: t("billing.plus.cancelConfirmCta"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await cancelMut.mutateAsync();
      toast.success(t("billing.plus.cancelDone"));
    } catch {
      toast.error(t("common.offline"));
    }
  }

  return (
    <Screen background="ink">
      <View style={{ flexDirection: "row", paddingTop: 4 }}>
        <IconButton
          onPress={() => router.back()}
          accessibilityLabel={t("common.back")}
          tone="inverse"
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.textInverse} />
        </IconButton>
      </View>

      <ScrollView
        contentContainerStyle={{ gap: 24, paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 8 }}>
          <Text variant="label" color="accent" style={{ letterSpacing: 0.6 }}>
            MOVA PLUS
          </Text>
          <Text variant="display" color="textInverse">
            {t("billing.plus.heroTitle")}
          </Text>
          <Text variant="body" color="textInverse" style={{ opacity: 0.8, lineHeight: 22 }}>
            {t("billing.plus.heroSubtitle")}
          </Text>
        </View>

        {summaryQuery.isLoading || !summary ? (
          <Spinner />
        ) : (
          <>
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.xxl,
                padding: theme.spacing.lg,
                gap: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                <Text variant="display">{`${priceUah} ₴`}</Text>
                <Text variant="body" color="textMuted">
                  {t("billing.plus.perMonth")}
                </Text>
              </View>
              {FEATURES.map((f) => (
                <View
                  key={f.key}
                  style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
                >
                  <Ionicons name={f.icon} size={18} color={theme.colors.link} />
                  <Text variant="body" style={{ flex: 1, lineHeight: 20 }}>
                    {t(`billing.plus.features.${f.key}`)}
                  </Text>
                </View>
              ))}
            </View>

            {failed ? (
              <Text variant="body" color="accent">
                {t("billing.plus.checkoutFailed")}
              </Text>
            ) : null}

            {isPlus ? (
              <View style={{ gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.colors.accent}
                  />
                  <Text variant="body" color="textInverse">
                    {summary.cancelAtPeriodEnd
                      ? t("billing.plus.endsAt", { date: periodDate })
                      : t("billing.plus.activeRenews", { date: periodDate })}
                  </Text>
                </View>
                {!summary.cancelAtPeriodEnd ? (
                  <Button
                    label={t("billing.plus.cancelCta")}
                    variant="secondary"
                    loading={cancelMut.isPending}
                    onPress={onCancel}
                  />
                ) : null}
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <Button
                  label={t("billing.plus.subscribeCta", { price: priceUah })}
                  variant="accent"
                  loading={submitting}
                  onPress={() => void start()}
                />
                <Text
                  variant="caption"
                  color="textInverse"
                  style={{ textAlign: "center", opacity: 0.7 }}
                >
                  {t("billing.plus.fineprint")}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
