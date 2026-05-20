import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { KeyboardScreen } from "@/components/KeyboardScreen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { startCall } from "@/api/calls";
import { listTemplates } from "@/api/templates";
import { listStyles } from "@/api/styles";
import { getBillingSummary } from "@/api/billing";
import { extractErrorPayload } from "@/api/client";
import { StylePicker } from "@/features/calls/StylePicker";
import { TemplatePicker } from "@/features/calls/TemplatePicker";
import { isE164 } from "@/utils/phone";

export default function PreCallScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ prefillPhone?: string }>();

  const [phone, setPhone] = useState(params.prefillPhone || "+380");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState(false);

  const templatesQuery = useQuery({
    queryKey: ["templates"],
    queryFn: listTemplates,
  });
  const stylesQuery = useQuery({ queryKey: ["styles"], queryFn: listStyles });
  const billingQuery = useQuery({
    queryKey: ["billing", "me"],
    queryFn: getBillingSummary,
  });

  const phoneOk = isE164(phone);

  const lowBalance = (() => {
    const b = billingQuery.data;
    if (!b) return false;
    if (b.plan.code === "free") return b.freeSecondsRemaining < 30;
    return (
      b.balanceCents > 0 &&
      b.balanceCents / Math.max(b.plan.pricePerSecondCents, 1) < 30
    );
  })();

  async function onStart() {
    if (!phoneOk) return;
    setSubmitting(true);
    setError(null);
    setInsufficient(false);
    try {
      const resp = await startCall({
        targetPhone: phone.trim(),
        templateId: templateId ?? undefined,
      });
      // Forward the styleId hint to the live screen so it can apply it via
      // a user.change_style command after connection.
      router.replace({
        pathname: "/call/live",
        params: {
          conversationId: resp.conversationId,
          maxDuration: String(resp.maxCallDurationSeconds),
          initialStyleId: styleId ?? "",
        },
      });
    } catch (err) {
      const payload = extractErrorPayload(err);
      if (payload?.error === "INSUFFICIENT_BALANCE") {
        setInsufficient(true);
      } else {
        setError(t("preCall.errorGeneric"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardScreen>
      <Text variant="title">{t("preCall.title")}</Text>

      {error ? <Banner tone="danger" message={error} /> : null}
      {insufficient ? (
        <Banner
          tone="danger"
          message={t("preCall.insufficientBalance")}
          action={
            <Button
              label={t("preCall.topupCta")}
              variant="secondary"
              onPress={() => router.push("/billing")}
            />
          }
        />
      ) : null}
      {lowBalance && !insufficient ? (
        <Banner tone="warning" message={t("preCall.lowBalanceWarn")} />
      ) : null}

      <TextField
        label={t("preCall.phoneLabel")}
        placeholder={t("preCall.phonePlaceholder")}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        error={phone.length > 4 && !phoneOk ? t("preCall.phoneError") : undefined}
      />

      {templatesQuery.isLoading ? (
        <Spinner size="small" />
      ) : (
        <TemplatePicker
          templates={templatesQuery.data ?? []}
          selectedId={templateId}
          onChange={setTemplateId}
        />
      )}

      {stylesQuery.isLoading || !stylesQuery.data ? (
        <Spinner size="small" />
      ) : (
        <StylePicker
          styles={stylesQuery.data}
          selectedId={styleId}
          onChange={setStyleId}
        />
      )}

      <View style={{ marginTop: theme.spacing.lg }}>
        <Button
          label={t("preCall.startCta")}
          disabled={!phoneOk}
          loading={submitting}
          onPress={onStart}
        />
      </View>
    </KeyboardScreen>
  );
}
