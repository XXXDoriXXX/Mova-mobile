import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { getBillingSummary, listPlans, listUsage, subscribe } from "@/api/billing";
import { BillingOverview } from "@/features/billing/BillingOverview";
import { BillingOverviewSkeleton } from "@/features/billing/BillingSkeleton";
import { PlanPicker } from "@/features/billing/PlanPicker";
import { TopupForm } from "@/features/billing/TopupForm";
import { UsageList } from "@/features/billing/UsageList";
import type { Plan } from "@/types/api";

type Tab = "overview" | "plan" | "topup" | "history";

export default function BillingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
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
    },
  });

  function handleTopupSuccess(info: { balanceCents: number; reused: boolean }) {
    queryClient.invalidateQueries({ queryKey: ["billing", "me"] });
    Alert.alert(info.reused ? t("billing.topupReused") : t("billing.topupSuccess"));
  }

  return (
    <Screen>
      <View style={{ gap: theme.spacing.md, flex: 1 }}>
        <Text variant="title">{t("billing.title")}</Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm, flexWrap: "wrap" }}>
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
        </View>

        <ScrollView
          contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xxl }}
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
    </Screen>
  );
}
