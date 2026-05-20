import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { BalanceWidget } from "@/components/BalanceWidget";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { getBillingSummary } from "@/api/billing";
import { listConversations } from "@/api/conversations";
import { getMe } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { RecentCallsList } from "@/features/home/RecentCallsList";

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const cachedUser = useAuthStore((s) => s.user);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const user = await getMe();
      setUser(user);
      return user;
    },
    enabled: !cachedUser,
  });
  const user = cachedUser ?? meQuery.data;

  const billingQuery = useQuery({
    queryKey: ["billing", "me"],
    queryFn: getBillingSummary,
  });

  const recentQuery = useQuery({
    queryKey: ["conversations", { limit: 5 }],
    queryFn: () => listConversations({ limit: 5 }),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([billingQuery.refetch(), recentQuery.refetch()]);
    setRefreshing(false);
  }, [billingQuery, recentQuery]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text variant="title">
          {t("home.greeting", { name: user?.name ?? "" })}
        </Text>

        {billingQuery.isLoading ? (
          <Spinner />
        ) : billingQuery.data ? (
          <BalanceWidget summary={billingQuery.data} />
        ) : null}

        <Button
          label={t("home.startCallCta")}
          onPress={() => router.push("/call/pre")}
        />

        <View style={{ gap: theme.spacing.md }}>
          <Text variant="subtitle">{t("home.recentTitle")}</Text>
          {recentQuery.isLoading ? (
            <Spinner size="small" />
          ) : (
            <RecentCallsList items={recentQuery.data?.items ?? []} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
