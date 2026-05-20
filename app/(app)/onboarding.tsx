import { useState } from "react";
import { Pressable, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { getMe } from "@/api/auth";
import { listStyles, setPreferredStyle } from "@/api/styles";
import { useAuthStore } from "@/auth/store";
import { useOnboardingStore } from "@/onboarding/store";

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const completeOnboarding = useOnboardingStore((s) => s.complete);
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [styleId, setStyleId] = useState<string | null>(null);

  const stylesQuery = useQuery({
    queryKey: ["styles"],
    queryFn: listStyles,
    enabled: step === 3,
  });

  const finishMut = useMutation({
    mutationFn: async () => {
      if (styleId) await setPreferredStyle(styleId);
      const me = await getMe();
      setUser(me);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      await completeOnboarding();
    },
    onSuccess: () => router.replace("/home"),
  });

  async function skip() {
    await completeOnboarding();
    router.replace("/home");
  }

  const slides = [
    {
      icon: "call-outline" as const,
      title: t("onboarding.slide1Title"),
      body: t("onboarding.slide1Body"),
    },
    {
      icon: "chatbubbles-outline" as const,
      title: t("onboarding.slide2Title"),
      body: t("onboarding.slide2Body"),
    },
    {
      icon: "color-palette-outline" as const,
      title: t("onboarding.slide3Title"),
      body: t("onboarding.slide3Body"),
    },
  ];

  return (
    <Screen>
      <View
        style={{ flex: 1, justifyContent: "space-between", padding: theme.spacing.md }}
      >
        {/* Header with Skip and step dots */}
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <View style={{ flexDirection: "row", gap: 6 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: idx === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    idx === step ? theme.colors.primary : theme.colors.surfaceMuted,
                }}
              />
            ))}
          </View>
          <Pressable onPress={skip} hitSlop={8}>
            <Text variant="label" color="textMuted">
              {t("onboarding.skip")}
            </Text>
          </Pressable>
        </View>

        {/* Slide body */}
        {step < 3 ? (
          <View style={{ alignItems: "center", gap: theme.spacing.lg }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: theme.colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={slides[step]!.icon}
                size={44}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="title" align="center">
              {slides[step]!.title}
            </Text>
            <Text
              variant="body"
              color="textMuted"
              align="center"
              style={{ maxWidth: 320 }}
            >
              {slides[step]!.body}
            </Text>
          </View>
        ) : (
          <View style={{ gap: theme.spacing.lg, alignItems: "stretch" }}>
            <Text variant="title" align="center">
              {t("onboarding.stylePickerTitle")}
            </Text>
            {stylesQuery.isLoading || !stylesQuery.data ? (
              <Spinner />
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, justifyContent: "center" }}>
                {stylesQuery.data.builtin.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.name}
                    selected={styleId === s.id}
                    onPress={() => setStyleId(s.id)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={{ gap: theme.spacing.sm }}>
          {step < TOTAL_STEPS - 1 ? (
            <Button
              label={t("onboarding.next")}
              onPress={() => setStep((s) => s + 1)}
            />
          ) : (
            <Button
              label={t("onboarding.done")}
              loading={finishMut.isPending}
              onPress={() => finishMut.mutate()}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}
