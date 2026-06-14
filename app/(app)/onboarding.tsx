import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
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
import { getMe, patchMe } from "@/api/auth";
import { listStyles, setPreferredStyle } from "@/api/styles";
import { useAuthStore } from "@/auth/store";
import { useOnboardingStore } from "@/onboarding/store";

const TOTAL_STEPS = 5;
const CAPABILITY_STEP = 3;
const STYLE_STEP = 4;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const completeOnboarding = useOnboardingStore((s) => s.complete);
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [isDeafMute, setIsDeafMute] = useState(true);

  const stylesQuery = useQuery({
    queryKey: ["styles"],
    queryFn: listStyles,
    enabled: step === STYLE_STEP,
  });

  const finishMut = useMutation({
    mutationFn: async () => {
      await patchMe({ isDeafMute });
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
      <View style={{ flex: 1, justifyContent: "space-between", paddingVertical: theme.spacing.md }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", gap: 6 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: idx === step ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    idx === step ? theme.colors.primary : theme.colors.surfaceMuted,
                }}
              />
            ))}
          </View>
          <Pressable onPress={skip} hitSlop={8}>
            <Text variant="button" color="textMuted">
              {t("onboarding.skip")}
            </Text>
          </Pressable>
        </View>

        {step < 3 ? (
          <Animated.View
            key={`slide-${step}`}
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(120)}
            style={{ alignItems: "center", gap: theme.spacing.lg }}
          >
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: theme.colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={slides[step]!.icon}
                size={48}
                color={theme.colors.accentText}
              />
            </View>
            <Text variant="display" align="center" style={{ fontSize: 38, lineHeight: 38 }}>
              {slides[step]!.title}
            </Text>
            <Text
              variant="bodyLarge"
              color="textMuted"
              align="center"
              style={{ maxWidth: 320 }}
            >
              {slides[step]!.body}
            </Text>
          </Animated.View>
        ) : step === CAPABILITY_STEP ? (
          <Animated.View
            key="capability"
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(120)}
            style={{ gap: theme.spacing.lg, alignItems: "stretch" }}
          >
            <Text variant="title" align="center">
              Як ви спілкуєтесь?
            </Text>
            <Text variant="body" color="textMuted" align="center" style={{ maxWidth: 320, alignSelf: "center" }}>
              Це визначає, хто може телефонувати вам, а кому телефонуєте ви. Можна змінити пізніше в налаштуваннях.
            </Text>
            <View style={{ gap: theme.spacing.sm }}>
              <CapabilityOption
                icon="hand-left-outline"
                title="Я глухонімий(а)"
                body="Спілкуюсь текстом, асистент озвучує. Інші можуть телефонувати мені."
                selected={isDeafMute}
                onPress={() => setIsDeafMute(true)}
              />
              <CapabilityOption
                icon="ear-outline"
                title="Я чую і розмовляю"
                body="Розмовляю голосом. Я можу телефонувати тим, хто користується асистентом."
                selected={!isDeafMute}
                onPress={() => setIsDeafMute(false)}
              />
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            key="picker"
            entering={FadeIn.duration(220)}
            style={{ gap: theme.spacing.lg, alignItems: "stretch" }}
          >
            <Text variant="title" align="center">
              {t("onboarding.stylePickerTitle")}
            </Text>
            {stylesQuery.isLoading || !stylesQuery.data ? (
              <Spinner />
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
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
          </Animated.View>
        )}

        <View style={{ gap: theme.spacing.sm }}>
          {step < TOTAL_STEPS - 1 ? (
            <Button
              label={t("onboarding.next")}
              variant="primary"
              onPress={() => setStep((s) => s + 1)}
            />
          ) : (
            <Button
              label={t("onboarding.done")}
              variant="accent"
              loading={finishMut.isPending}
              onPress={() => finishMut.mutate()}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

function CapabilityOption({
  icon,
  title,
  body,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        gap: theme.spacing.md,
        alignItems: "center",
        padding: theme.spacing.lg,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected
          ? theme.colors.surfaceMuted
          : theme.colors.surface,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: selected
            ? theme.colors.accent
            : theme.colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color={theme.colors.accentText} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="button">{title}</Text>
        <Text variant="caption" color="textMuted">
          {body}
        </Text>
      </View>
    </Pressable>
  );
}
