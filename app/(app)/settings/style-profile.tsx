import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Modal } from "@/components/Modal";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { getStyleProfile, resetStyleProfile } from "@/api/styleProfile";

/**
 * Style-profile dashboard. Shows aggregate stats (sample count, avg len,
 * total chars, last-updated) plus a few exemplar snippets, with a
 * destructive "reset" gated by a confirmation modal. Empty state when
 * the user hasn't typed enough yet for adaptation to kick in.
 */
export default function StyleProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["styleProfile"],
    queryFn: getStyleProfile,
  });

  const resetMut = useMutation({
    mutationFn: resetStyleProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["styleProfile"] });
      setConfirming(false);
    },
  });

  const dateFormatter = new Intl.DateTimeFormat(
    i18n.language === "en" ? "en-US" : "uk-UA",
    { dateStyle: "medium", timeStyle: "short" },
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.spacing.lg,
          paddingTop: 4,
          paddingBottom: 140,
        }}
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
        </View>

        <View style={{ gap: 4 }}>
          <Text variant="label" color="textMuted">
            {t("settings.title")}
          </Text>
          <Text variant="title">{t("settings.styleProfile")}</Text>
        </View>

        <Text variant="body" color="textMuted">
          {t("settings.styleProfileDescription")}
        </Text>

        {profileQuery.isLoading ? (
          <Spinner />
        ) : profileQuery.error ? (
          <Banner tone="danger" message={t("common.offline")} />
        ) : profileQuery.data?.summary ? (
          <View
            style={{
              backgroundColor: theme.colors.surfaceInverse,
              borderRadius: theme.radii.xxl,
              padding: theme.spacing.lg,
              gap: 12,
            }}
          >
            <StatRow
              label={t("settings.styleProfileSamples")}
              value={String(profileQuery.data.summary.sampleCount)}
              inverse
            />
            <StatRow
              label={t("settings.styleProfileAvgLen")}
              value={`${Math.round(
                profileQuery.data.summary.avgMessageLength,
              )} chars`}
              inverse
            />
            <StatRow
              label={t("settings.styleProfileTotal")}
              value={String(profileQuery.data.summary.totalChars)}
              inverse
            />
            <StatRow
              label={t("settings.styleProfileLastUpdated")}
              value={dateFormatter.format(
                new Date(profileQuery.data.summary.lastUpdatedAt),
              )}
              inverse
            />

            {profileQuery.data.summary.exemplars.length > 0 ? (
              <View style={{ marginTop: theme.spacing.sm, gap: 6 }}>
                <Text
                  variant="label"
                  color="textOnInverse"
                  style={{ opacity: 0.65, textTransform: "uppercase" }}
                >
                  {t("settings.styleProfileExemplars")}
                </Text>
                {profileQuery.data.summary.exemplars.slice(0, 5).map((e) => (
                  <Text
                    key={e.createdAt}
                    variant="caption"
                    color="textOnInverse"
                    style={{ opacity: 0.75 }}
                  >
                    “{e.content}”
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <Banner
            tone="info"
            title={t("settings.styleProfileColdStartTitle")}
            message={t("settings.styleProfileColdStartBody")}
          />
        )}

        {profileQuery.data ? (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.xxl,
              padding: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              gap: 4,
            }}
          >
            <Text variant="label" color="textMuted" style={{ textTransform: "uppercase" }}>
              {t("settings.styleProfilePolicy")}
            </Text>
            <Text variant="caption" color="textMuted">
              {t("settings.styleProfilePolicyText", {
                min: profileQuery.data.policy.minContentLength,
                cap: profileQuery.data.policy.exemplarCap,
              })}
            </Text>
          </View>
        ) : null}

        {profileQuery.data?.summary ? (
          <Button
            label={t("settings.styleProfileReset")}
            variant="ghost"
            size="md"
            onPress={() => setConfirming(true)}
          />
        ) : null}
      </ScrollView>

      <Modal
        visible={confirming}
        onClose={() => setConfirming(false)}
        title={t("settings.styleProfileResetConfirmTitle")}
      >
        <Text variant="body">
          {t("settings.styleProfileResetConfirmBody")}
        </Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t("common.cancel")}
              variant="secondary"
              size="md"
              onPress={() => setConfirming(false)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("settings.styleProfileReset")}
              variant="danger"
              size="md"
              loading={resetMut.isPending}
              onPress={() => resetMut.mutate()}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function StatRow({
  label,
  value,
  inverse,
}: {
  label: string;
  value: string;
  inverse?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text
        variant="body"
        color={inverse ? "textOnInverse" : "textMuted"}
        style={inverse ? { opacity: 0.65 } : undefined}
      >
        {label}
      </Text>
      <Text variant="body" weight="bold" color={inverse ? "textOnInverse" : "text"}>
        {value}
      </Text>
    </View>
  );
}
