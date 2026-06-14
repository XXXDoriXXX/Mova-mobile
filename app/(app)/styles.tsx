import { RefreshControl, ScrollView, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { IconButton } from "@/components/IconButton";
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
          paddingTop: 4,
          paddingBottom: 140,
        }}
        refreshControl={
          <RefreshControl
            refreshing={stylesQuery.isRefetching}
            onRefresh={() => stylesQuery.refetch()}
            tintColor={theme.colors.text}
          />
        }
        showsVerticalScrollIndicator={false}
      >
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
          <IconButton
            tone="ink"
            onPress={() => router.push("/style/new")}
            accessibilityLabel={t("styles.newCta")}
          >
            <Ionicons name="add" size={22} color={theme.colors.primaryText} />
          </IconButton>
        </View>

        <View style={{ gap: 4 }}>
          <Text variant="label" color="textMuted">
            MOVA
          </Text>
          <Text variant="title">{t("styles.title")}</Text>
        </View>

        {stylesQuery.isLoading ? (
          <Spinner />
        ) : (
          <>
            <View style={{ gap: 8 }}>
              <Text variant="label" color="textMuted" style={{ textTransform: "uppercase" }}>
                {t("styles.builtinSection")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
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

            <View style={{ gap: 8 }}>
              <Text variant="label" color="textMuted" style={{ textTransform: "uppercase" }}>
                {t("styles.customSection")}
              </Text>
              {(stylesQuery.data?.custom ?? []).length === 0 ? (
                <Text variant="caption" color="textMuted">
                  {t("styles.customEmpty")}
                </Text>
              ) : null}
              <View style={{ gap: 8 }}>
                {(stylesQuery.data?.custom ?? []).map((s) => {
                  const isPreferred = preferredId === s.id;
                  return (
                    <Row
                      key={s.id}
                      iconName={isPreferred ? "star" : "brush-outline"}
                      title={s.name}
                      subtitle={
                        (isPreferred ? `${t("templates.badgeDefault")} · ` : "") +
                        s.instructions.slice(0, 80)
                      }
                      onPress={() =>
                        router.push(`/style/${encodeURIComponent(s.id)}`)
                      }
                    />
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
