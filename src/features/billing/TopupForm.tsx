import { useEffect, useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { getBillingSummary } from "@/api/billing";

import {
  estimateMinutesFromTopup,
  TOPUP_MAX_UAH,
  TOPUP_MIN_UAH,
  TOPUP_QUICK_AMOUNTS,
  validateTopupAmount,
} from "./application/validateTopupAmount";
import { useTopup } from "./application/useTopup";

type Props = {
  onSuccess: (info: { balanceCents: number; reused: boolean }) => void;
  initialAmountUah?: number;
  onConsumePrefill?: () => void;
};

export function TopupForm({ onSuccess, initialAmountUah, onConsumePrefill }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [amount, setAmount] = useState(
    initialAmountUah ? String(initialAmountUah) : "100",
  );
  const [error, setError] = useState<string | null>(null);

  const { submitting, execute } = useTopup();

  useEffect(() => {
    if (initialAmountUah) {
      setAmount(String(initialAmountUah));
      onConsumePrefill?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAmountUah]);

  const summary = useQuery({
    queryKey: ["billing", "me"],
    queryFn: getBillingSummary,
  }).data;

  const validation = validateTopupAmount(amount);
  const validationError =
    !validation.ok && validation.reason === "out-of-range"
      ? t("billing.topupRange", { min: TOPUP_MIN_UAH, max: TOPUP_MAX_UAH })
      : undefined;

  const estimateMinutes =
    validation.ok && summary && summary.plan.code !== "free"
      ? estimateMinutesFromTopup(
          validation.amountUah,
          summary.plan.pricePerSecondCents,
        )
      : null;

  async function submit() {
    if (!validation.ok) return;
    setError(null);
    const result = await execute(validation.amountCents);
    if (result.ok) {
      onSuccess({ balanceCents: result.balanceCents, reused: result.reused });
      return;
    }
    switch (result.error.kind) {
      case "rate-limited":
        setError(t("billing.topupRateLimited"));
        break;
      case "bad-amount":
        setError(
          result.error.serverMessage ||
            t("billing.topupRange", { min: TOPUP_MIN_UAH, max: TOPUP_MAX_UAH }),
        );
        break;
      case "generic":
        setError(t("auth.errorGeneric"));
        break;
    }
  }

  return (
    <View style={{ gap: theme.spacing.md }}>
      {error ? <Banner tone="danger" message={error} /> : null}

      <Text variant="label">{t("billing.quickAmounts")}</Text>
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.sm,
          flexWrap: "wrap",
        }}
      >
        {TOPUP_QUICK_AMOUNTS.map((a) => (
          <Chip
            key={a}
            label={`₴ ${a}`}
            selected={String(a) === amount}
            onPress={() => setAmount(String(a))}
          />
        ))}
      </View>

      <TextField
        label={t("billing.topupLabel")}
        keyboardType="numeric"
        value={amount}
        onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
        error={validationError}
        helperText={
          estimateMinutes !== null && !validationError
            ? t("billing.topupEstimate", { minutes: estimateMinutes })
            : undefined
        }
      />

      <Button
        label={t("billing.topupCta")}
        loading={submitting}
        disabled={!validation.ok}
        onPress={submit}
      />
    </View>
  );
}
