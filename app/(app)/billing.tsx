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
import { BillingOverview } from "@/features/billing/BillingOverview";
import { BillingOverviewSkeleton } from "@/features/billing/BillingSkeleton";
import { PlanPicker } from "@/features/billing/PlanPicker";
import { TopupForm } from "@/features/billing/TopupForm";
import { UsageList } from "@/features/billing/UsageList";
import type { Plan } from "@/types/api";

type Tab = "overview" | "plan" | "topup" | "history";

/**
 * Billing — four tabs in a horizontal pill row: overview, plan, top-up,
 * history. Each tab lazy-loads its data so opening the screen doesn't
 * pay for all four endpoints up front.
 */
export default function BillingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");

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

  function handleTopupSuccess(info: { balanceCents: number; reused: boolean }) {
    queryClient.invalidateQueries({ queryKey: ["billing", "me"] });
    if (info.reused) {
      toast.info(t("billing.topupReused"));
    } else {
      toast.success(t("billing.topupSuccess"));
    }
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
              <BillingOverview summary={summaryQuery.data} />
            )
          ) : null}

          {tab === "plan" ? (
            plansQuery.isLoading || !plansQuery.data || !summaryQuery.data ? (
              <Spinner />
            ) : (
              <PlanPicker
                plans={plansQuery.data}
                currentCode={summaryQuery.data.plan.code}
                picking={pickingPlan}
                onPick={(p) => subscribeMut.mutate(p.code)}
              />
            )
          ) : null}

          {tab === "topup" ? (
            <TopupForm onSuccess={handleTopupSuccess} />
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
