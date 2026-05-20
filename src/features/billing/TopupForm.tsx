import { useRef, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { topup } from "@/api/billing";
import { newIdempotencyKey } from "@/utils/idempotency-key";

type Props = {
  onSuccess: (info: { balanceCents: number; reused: boolean }) => void;
};

const QUICK_AMOUNTS = [50, 100, 500];

export function TopupForm({ onSuccess }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [amount, setAmount] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Idempotency-Key is generated ONCE for the entire submit attempt, and is
  // reused across retries until the call succeeds. The next clean submit
  // mints a fresh key.
  const keyRef = useRef<string | null>(null);

  async function submit() {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric < 1) return;
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
      />

      <Button label={t("billing.topupCta")} loading={submitting} onPress={submit} />
    </View>
  );
}
