import { RefreshControl, ScrollView, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Row } from "@/components/Row";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { listStyles, setPreferredStyle } from "@/api/styles";
import { getMe } from "@/api/auth";
import { useAuthStore } from "@/auth/store";

export default function StylesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const stylesQuery = useQuery({
    queryKey: ["styles"],
    queryFn: listStyles,
  });

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const next = await getMe();
      setUser(next);
      return next;
    },
    enabled: !user,
  });

  const preferredId =
    user?.preferredStyleId ?? meQuery.data?.preferredStyleId ?? null;

  const setPreferredMut = useMutation({
    mutationFn: (styleId: string | null) => setPreferredStyle(styleId),
    onSuccess: async () => {
      const next = await getMe();
      setUser(next);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={stylesQuery.isRefetching}
            onRefresh={() => stylesQuery.refetch()}
          />
        }
      >
        <Text variant="title">{t("styles.title")}</Text>

        {stylesQuery.isLoading ? (
          <Spinner />
        ) : (
          <>
            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="subtitle">{t("styles.builtinSection")}</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: theme.spacing.sm,
                }}
              >
                {(stylesQuery.data?.builtin ?? []).map((s) => (
                  <Chip
                    key={s.id}
                    label={s.name}
                    selected={preferredId === s.id}
                    onPress={() => setPreferredMut.mutate(s.id)}
                  />
                ))}
              </View>
              <Text variant="caption" color="textMuted">
                {t("styles.preferredHint")}
              </Text>
            </View>

            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="subtitle">{t("styles.customSection")}</Text>
              <Button
                label={t("styles.newCta")}
                variant="secondary"
                onPress={() => router.push("/style/new")}
              />
              {(stylesQuery.data?.custom ?? []).map((s) => {
                const isPreferred = preferredId === s.id;
                return (
                  <Row
                    key={s.id}
                    title={s.name}
                    subtitle={
                      (isPreferred ? `${t("templates.badgeDefault")} · ` : "") +
                      s.instructions.slice(0, 80)
                    }
                    onPress={() => router.push(`/style/${encodeURIComponent(s.id)}`)}
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
