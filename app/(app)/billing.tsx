import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { IconButton } from "@/components/IconButton";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { toast } from "@/feedback/toast";
import { useTheme } from "@/theme/ThemeProvider";
import { getBillingSummary, listPlans, listUsage, subscribe } from "@/api/billing";
import {
  BillingOverview,
  BillingOverviewSkeleton,
  PlanPicker,
  TopupForm,
  UsageList,
  useTopup,
} from "@/features/billing";
import type { Plan } from "@/types/api";

type Tab = "overview" | "plan" | "topup" | "history";

export default function BillingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [topupPrefill, setTopupPrefill] = useState<number | null>(null);

  const summaryQuery = useQuery({
    queryKey: ["billing", "me"],
    queryFn: getBillingSummary,
  });
  const plansQuery = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: listPlans,
    enabled: tab === "plan",
  });
  const usageQuery = useQuery({
    queryKey: ["billing", "usage"],
    queryFn: () => listUsage(),
    enabled: tab === "history",
  });

  const [pickingPlan, setPickingPlan] = useState<Plan["code"] | null>(null);
  const subscribeMut = useMutation({
    mutationFn: (planCode: Plan["code"]) => subscribe({ planCode }),
    onMutate: (planCode) => setPickingPlan(planCode),
    onSettled: () => setPickingPlan(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "me"] });
      toast.success(t("billing.planSwitched"));
    },
    onError: () => {
      toast.error(t("billing.planSwitchError"));
    },
  });

  // One-tap quick top-up: a preset amount opens the provider checkout straight
  // away (the checkout itself is the confirmation), instead of pre-filling the
  // form and making the user tap again.
  const quickTopup = useTopup();
  async function onQuickTopup(amountUah: number) {
    const result = await quickTopup.execute(amountUah * 100);
    if (result.ok) handleTopupSuccess({ reused: result.reused });
  }

  function handleTopupSuccess(info: { reused: boolean }) {
    // The wallet credits server-side after the checkout the hook just opened;
    // it already refetched the summary on return.
    queryClient.invalidateQueries({ queryKey: ["billing", "me"] });
    toast.info(info.reused ? t("billing.topupReused") : t("billing.topupOpened"));
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <View style={{ flex: 1, gap: theme.spacing.md, paddingTop: 4 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <IconButton onPress={() => router.back()} accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </IconButton>
        </View>

        <View style={{ gap: 4 }}>
          <Text variant="label" color="textMuted">
            MOVA
          </Text>
          <Text variant="title">{t("billing.title")}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {(
            [
              ["overview", t("billing.tabs.overview")],
              ["plan", t("billing.tabs.plan")],
              ["topup", t("billing.tabs.topup")],
              ["history", t("billing.tabs.history")],
            ] as const
          ).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              selected={tab === key}
              onPress={() => setTab(key)}
            />
          ))}
        </ScrollView>

        <ScrollView
          contentContainerStyle={{
            gap: theme.spacing.md,
            paddingBottom: 140,
          }}
          showsVerticalScrollIndicator={false}
        >
          {tab === "overview" ? (
            summaryQuery.isLoading || !summaryQuery.data ? (
              <BillingOverviewSkeleton />
            ) : (
              <BillingOverview
                summary={summaryQuery.data}
                onOpenPlan={() => setTab("plan")}
                onOpenSubscription={() => router.push("/subscription")}
                onPickQuickTopup={(amount) => void onQuickTopup(amount)}
              />
            )
          ) : null}

          {tab === "plan" ? (
            plansQuery.isLoading || !plansQuery.data || !summaryQuery.data ? (
              <Spinner />
            ) : (
              <PlanPicker
                // PLUS is a paid subscription entered through its own paywall,
                // not this free FREE/PAID toggle.
                plans={plansQuery.data.filter((p) => p.code !== "plus")}
                currentCode={summaryQuery.data.plan.code}
                picking={pickingPlan}
                onPick={(p) => subscribeMut.mutate(p.code)}
              />
            )
          ) : null}

          {tab === "topup" ? (
            <TopupForm
              onSuccess={handleTopupSuccess}
              initialAmountUah={topupPrefill ?? undefined}
              onConsumePrefill={() => setTopupPrefill(null)}
            />
          ) : null}

          {tab === "history" ? (
            usageQuery.isLoading ? (
              <Spinner />
            ) : (
              <UsageList items={usageQuery.data ?? []} />
            )
          ) : null}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
