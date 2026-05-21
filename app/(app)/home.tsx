import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { enUS, uk as ukLocale } from "date-fns/locale";

import { BalanceWidget } from "@/components/BalanceWidget";
import { FaceAvatar } from "@/components/FaceAvatar";
import { IconButton } from "@/components/IconButton";
import { Pill } from "@/components/Pill";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { AudioWave } from "@/components/AudioWave";
import { useTheme } from "@/theme/ThemeProvider";
import i18n from "@/i18n";
import { getBillingSummary } from "@/api/billing";
import { listConversations } from "@/api/conversations";
import { getMe } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { HomeSkeleton } from "@/features/home/HomeSkeleton";
import { RecentCallsList } from "@/features/home/RecentCallsList";
import { greetingKey } from "@/utils/format";
import { triggerHaptic } from "@/utils/haptics";

/**
 * Home — single source of truth for the user's "what now?" moment.
 *
 * Composition (top → bottom): face/greeting header → date pill → hero
 * headline → forest balance card → primary CTA pair (lime "new call"
 * + forest "templates") → recent calls list. Each section is independent
 * data-wise; the screen handles cold-start with a skeleton and incremental
 * with section-level spinners so a slow billing endpoint doesn't block
 * the whole layout.
 */
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
    // Light haptic at the start of the gesture — matches the native
    // RefreshControl on iOS so the pull-to-refresh feels grounded.
    triggerHaptic("light");
    setRefreshing(true);
    await Promise.all([billingQuery.refetch(), recentQuery.refetch()]);
    setRefreshing(false);
  }, [billingQuery, recentQuery]);

  // Picked once per mount so the playful "_alt" variant doesn't reshuffle
  // mid-session every time React re-renders this screen. MUST stay above
  // any early returns so React's hook order is stable across renders.
  const greetingI18nKey = useMemo(() => greetingKey(), []);

  const coldStart =
    !cachedUser && billingQuery.isPending && recentQuery.isPending;
  if (coldStart) {
    return (
      <Screen>
        <ScrollView
          contentContainerStyle={{
            gap: theme.spacing.lg,
            paddingTop: 8,
            paddingBottom: 140,
          }}
        >
          <HomeSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  const locale = i18n.language === "en" ? enUS : ukLocale;
  const datePill = format(new Date(), "EEEE, d MMM yyyy", { locale });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.spacing.lg,
          paddingTop: 4,
          paddingBottom: 140, // clear the floating tab bar
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.text}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Header
          name={user?.name}
          greetingKey={greetingI18nKey}
          onSettings={() => router.push("/settings")}
        />

        <Pill label={datePill} tone="ink" />

        <View style={{ marginTop: 6 }}>
          <Text variant="display">
            {t(greetingI18nKey) + ","}
          </Text>
          <Text variant="display" weight="bold" italic style={{ marginTop: 4 }}>
            {t("home.heroVerb")}
            <Text variant="display" color="textMuted">+</Text>
          </Text>
        </View>

        {billingQuery.isLoading ? (
          <Spinner size="small" />
        ) : billingQuery.data ? (
          <BalanceWidget
            summary={billingQuery.data}
            onPress={() => router.push("/billing")}
          />
        ) : null}

        <CallShortcuts
          onStart={() => router.push("/call/pre")}
          onTemplates={() => router.push("/templates")}
        />

        <SectionHeader
          title={t("home.recentTitle")}
          actionLabel={(recentQuery.data?.items.length ?? 0) > 0 ? t("home.viewAll") : null}
          onAction={() => router.push("/history")}
        />

        {recentQuery.isLoading ? (
          <Spinner size="small" />
        ) : (
          <RecentCallsList items={recentQuery.data?.items ?? []} />
        )}
      </ScrollView>
    </Screen>
  );
}

function Header({
  name,
  greetingKey,
  onSettings,
}: {
  name?: string;
  greetingKey: string;
  onSettings: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: theme.spacing.sm,
      }}
    >
      <Pressable
        onPress={onSettings}
        accessibilityRole="button"
        accessibilityLabel={t("tabs.settings")}
        style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
      >
        <FaceAvatar size={42} />
        <View>
          <Text variant="caption" color="textMuted">
            {t(greetingKey) + ","}
          </Text>
          <Text variant="bodyLarge" weight="bold">
            {name ?? t("home.userFallback")}
          </Text>
        </View>
      </Pressable>
      <IconButton onPress={onSettings} accessibilityLabel="MOVA">
        <Ionicons name="grid" size={18} color={theme.colors.text} />
      </IconButton>
    </View>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string | null;
  onAction: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
      }}
    >
      <Text variant="subtitle">{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text variant="button" color="textMuted">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * The signature dual card from the design. Left (lime) is the primary
 * "new call" CTA; right (forest) is a secondary destination — we
 * surface templates because they meaningfully change the next call.
 */
function CallShortcuts({
  onStart,
  onTemplates,
}: {
  onStart: () => void;
  onTemplates: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Pressable
        onPress={onStart}
        style={({ pressed }) => ({
          flex: 1.05,
          backgroundColor: theme.colors.accent,
          borderRadius: theme.radii.xxl,
          padding: 16,
          minHeight: 200,
          justifyContent: "space-between",
          opacity: pressed ? 0.92 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel={t("home.startCallCta")}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ gap: 2 }}>
            <Text variant="subtitle" color="accentText">
              {t("home.shortcutNewCallTitle")}
            </Text>
            <Text variant="caption" color="accentText" style={{ opacity: 0.7 }}>
              {t("home.shortcutNewCallSubtitle")}
            </Text>
          </View>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-up" size={18} color={theme.colors.accent} style={{ transform: [{ rotate: "45deg" }] }} />
          </View>
        </View>
        <View>
          <Text variant="numeric" color="accentText">
            00:00
          </Text>
          <View
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.text,
              width: "70%",
              marginTop: 6,
            }}
          />
          <View
            style={{
              marginTop: 12,
              backgroundColor: theme.colors.background,
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: theme.radii.pill,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons name="call" size={12} color={theme.colors.text} />
            <Text variant="caption" weight="bold">
              {t("home.startCallCta")}
            </Text>
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onTemplates}
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: theme.colors.surfaceInverse,
          borderRadius: theme.radii.xxl,
          padding: 16,
          minHeight: 200,
          justifyContent: "space-between",
          opacity: pressed ? 0.92 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel={t("home.shortcutTemplatesTitle")}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ gap: 2 }}>
            <Text variant="subtitle" color="textOnInverse">
              {t("home.shortcutTemplatesTitle")}
            </Text>
            <Text variant="caption" color="textOnInverse" style={{ opacity: 0.6 }}>
              {t("home.shortcutTemplatesSubtitle")}
            </Text>
          </View>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: theme.colors.inverseLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-forward" size={18} color={theme.colors.textOnInverse} />
          </View>
        </View>
        <View>
          <AudioWave color={theme.colors.accent} count={10} height={32} />
        </View>
      </Pressable>
    </View>
  );
}
