import { useRef, useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { getBillingSummary, topup } from "@/api/billing";
import { newIdempotencyKey } from "@/utils/idempotency-key";

type Props = {
  onSuccess: (info: { balanceCents: number; reused: boolean }) => void;
};

// Backend allows 100..100_000 cents — i.e. 1..1000 UAH per topup.
const QUICK_AMOUNTS = [50, 100, 500];
const MIN_UAH = 1;
const MAX_UAH = 1000;

export function TopupForm({ onSuccess }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [amount, setAmount] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pull the plan from the shared TanStack cache (already populated by the
  // parent's overview tab) so we can estimate minutes from the entered amount.
  const summary = useQuery({
    queryKey: ["billing", "me"],
    queryFn: getBillingSummary,
  }).data;

  // Idempotency-Key is generated ONCE for the entire submit attempt, and is
  // reused across retries until the call succeeds. The next clean submit
  // mints a fresh key.
  const keyRef = useRef<string | null>(null);

  const numeric = Number(amount);
  const validRange =
    Number.isFinite(numeric) && numeric >= MIN_UAH && numeric <= MAX_UAH;
  const validationError =
    amount.length > 0 && !validRange
      ? t("billing.topupRange", { min: MIN_UAH, max: MAX_UAH })
      : undefined;

  // Estimate minutes the user would get from this top-up. Only meaningful
  // on the paid plan (per-second pricing). Free plan ignores balance.
  const estimateMinutes = (() => {
    if (!summary || summary.plan.code === "free") return null;
    if (!validRange) return null;
    const price = Math.max(summary.plan.pricePerSecondCents, 1);
    return Math.floor((numeric * 100) / price / 60);
  })();

  async function submit() {
    if (!validRange) return;
    setSubmitting(true);
    setError(null);
    if (!keyRef.current) keyRef.current = newIdempotencyKey();
    try {
      const resp = await topup({
        amountCents: Math.round(numeric * 100),
        idempotencyKey: keyRef.current,
      });
      keyRef.current = null;
      onSuccess({ balanceCents: resp.balanceCents, reused: resp.reused });
    } catch {
      setError(t("auth.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ gap: theme.spacing.md }}>
      {error ? <Banner tone="danger" message={error} /> : null}

      <Text variant="label">{t("billing.quickAmounts")}</Text>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm, flexWrap: "wrap" }}>
        {QUICK_AMOUNTS.map((a) => (
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
        disabled={!validRange}
        onPress={submit}
      />
    </View>
  );
}
