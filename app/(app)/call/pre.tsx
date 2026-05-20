import { useState } from "react";
import { Pressable, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
import { useAuthStore } from "@/auth/store";
import { ContactsPicker } from "@/features/calls/ContactsPicker";
import { StylePicker } from "@/features/calls/StylePicker";
import { TemplatePicker } from "@/features/calls/TemplatePicker";
import { isE164 } from "@/utils/phone";

export default function PreCallScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ prefillPhone?: string }>();

  const preferredStyleId = useAuthStore((s) => s.user?.preferredStyleId ?? null);
  const [phone, setPhone] = useState(params.prefillPhone || "+380");
  const [templateId, setTemplateId] = useState<string | null>(null);
  // Default to the user's saved preferred style — they can override per call.
  const [styleId, setStyleId] = useState<string | null>(preferredStyleId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState<{
    secondsNeeded?: number;
    secondsRemaining?: number;
  } | null>(null);
  const [pickingContact, setPickingContact] = useState(false);

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

  // Compute remaining seconds the user has under their current plan. Free
  // counts free-seconds left; paid converts balance to seconds. Returns null
  // when billing isn't loaded yet so the UI can skip the warning entirely.
  const secondsRemaining = (() => {
    const b = billingQuery.data;
    if (!b) return null;
    if (b.plan.code === "free") return b.freeSecondsRemaining;
    return Math.floor(b.balanceCents / Math.max(b.plan.pricePerSecondCents, 1));
  })();
  const lowBalance =
    secondsRemaining !== null && secondsRemaining > 0 && secondsRemaining < 30;

  async function onStart() {
    if (!phoneOk) return;
    setSubmitting(true);
    setError(null);
    setInsufficient(null);
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
        setInsufficient({
          secondsNeeded: payload.secondsNeeded,
          secondsRemaining: payload.secondsRemaining,
        });
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
          message={
            typeof insufficient.secondsNeeded === "number"
              ? t("preCall.insufficientBalanceDetailed", {
                  needed: insufficient.secondsNeeded,
                  remaining: insufficient.secondsRemaining ?? 0,
                })
              : t("preCall.insufficientBalance")
          }
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
        <Banner
          tone="warning"
          message={t("preCall.lowBalanceWarnDetailed", {
            seconds: secondsRemaining ?? 0,
          })}
        />
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <TextField
            label={t("preCall.phoneLabel")}
            placeholder={t("preCall.phonePlaceholder")}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            error={phone.length > 4 && !phoneOk ? t("preCall.phoneError") : undefined}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("preCall.contactsTitle")}
          onPress={() => setPickingContact(true)}
          style={{
            width: 52,
            height: 52,
            marginBottom: 22,
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="people-outline"
            size={22}
            color={theme.colors.text}
          />
        </Pressable>
      </View>

      <ContactsPicker
        visible={pickingContact}
        onClose={() => setPickingContact(false)}
        onPick={(e164) => setPhone(e164)}
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
