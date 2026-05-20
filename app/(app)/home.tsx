import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Avatar";
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
import { HomeSkeleton } from "@/features/home/HomeSkeleton";
import { RecentCallsList } from "@/features/home/RecentCallsList";
import { dayPartFor } from "@/utils/format";

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

  // Cold-start skeleton: only show the full placeholder while we have nothing
  // yet. As soon as either billing or recent calls return, fall through to
  // the real layout (with smaller spinners on still-loading sub-sections).
  const coldStart =
    !cachedUser && billingQuery.isPending && recentQuery.isPending;
  if (coldStart) {
    return (
      <Screen>
        <ScrollView
          contentContainerStyle={{
            gap: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl,
          }}
        >
          <HomeSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
          }}
        >
          <Pressable
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel={t("tabs.settings")}
            hitSlop={8}
          >
            <Avatar name={user?.name} size={48} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="textMuted">
              {t(`home.greeting_${dayPartFor()}`)}
            </Text>
            <Text variant="title">
              {user?.name ?? ""}
            </Text>
          </View>
        </View>

        {billingQuery.isLoading ? (
          <Spinner />
        ) : billingQuery.data ? (
          <BalanceWidget
            summary={billingQuery.data}
            onPress={() => router.push("/billing")}
          />
        ) : null}

        <Button
          label={t("home.startCallCta")}
          onPress={() => router.push("/call/pre")}
        />

        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text variant="subtitle">{t("home.recentTitle")}</Text>
            {(recentQuery.data?.items.length ?? 0) > 0 ? (
              <Text
                variant="label"
                color="primary"
                onPress={() => router.push("/history")}
              >
                {t("home.viewAll")}
              </Text>
            ) : null}
          </View>
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
