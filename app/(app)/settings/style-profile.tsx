import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { getStyleProfile, resetStyleProfile } from "@/api/styleProfile";

export default function StyleProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
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
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg }}>
        <Text variant="title">{t("settings.styleProfile")}</Text>
        <Text variant="body" color="textMuted">
          {t("settings.styleProfileDescription")}
        </Text>

        {profileQuery.isLoading ? (
          <Spinner />
        ) : profileQuery.error ? (
          <Banner tone="danger" message={t("common.offline")} />
        ) : profileQuery.data?.summary ? (
          <Card>
            <View style={{ gap: theme.spacing.sm }}>
              <Row
                label={t("settings.styleProfileSamples")}
                value={String(profileQuery.data.summary.sampleCount)}
              />
              <Row
                label={t("settings.styleProfileAvgLen")}
                value={`${Math.round(
                  profileQuery.data.summary.avgMessageLength,
                )} chars`}
              />
              <Row
                label={t("settings.styleProfileTotal")}
                value={String(profileQuery.data.summary.totalChars)}
              />
              <Row
                label={t("settings.styleProfileLastUpdated")}
                value={dateFormatter.format(
                  new Date(profileQuery.data.summary.lastUpdatedAt),
                )}
              />
            </View>

            {profileQuery.data.summary.exemplars.length > 0 ? (
              <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.xs }}>
                <Text variant="label" color="textMuted">
                  {t("settings.styleProfileExemplars")}
                </Text>
                {profileQuery.data.summary.exemplars.slice(0, 5).map((e) => (
                  <Text key={e.createdAt} variant="caption" color="textMuted">
                    “{e.content}”
                  </Text>
                ))}
              </View>
            ) : null}
          </Card>
        ) : (
          <Banner
            tone="info"
            title={t("settings.styleProfileColdStartTitle")}
            message={t("settings.styleProfileColdStartBody")}
          />
        )}

        {profileQuery.data ? (
          <Card>
            <Text variant="label" color="textMuted">
              {t("settings.styleProfilePolicy")}
            </Text>
            <Text variant="caption" color="textMuted">
              {t("settings.styleProfilePolicyText", {
                min: profileQuery.data.policy.minContentLength,
                cap: profileQuery.data.policy.exemplarCap,
              })}
            </Text>
          </Card>
        ) : null}

        {profileQuery.data?.summary ? (
          <Button
            label={t("settings.styleProfileReset")}
            variant="danger"
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
              onPress={() => setConfirming(false)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("settings.styleProfileReset")}
              variant="danger"
              loading={resetMut.isPending}
              onPress={() => resetMut.mutate()}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text variant="body" color="textMuted">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}
