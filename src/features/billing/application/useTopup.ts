import { useRef, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { useQueryClient } from "@tanstack/react-query";

import { topup } from "@/api/billing";
import { newIdempotencyKey } from "@/utils/idempotency-key";
import type { BillingSummary } from "@/types/api";

import { mapTopupError, type TopupErrorMapping } from "./mapTopupError";
import { BILLING_ME_KEY, refreshBillingUntil } from "./refreshBilling";

export type TopupOk = {
  ok: true;
  reused: boolean;
};

export type TopupFail = {
  ok: false;
  error: TopupErrorMapping;
};

// Starts a top-up, opens the provider checkout in an in-app browser, and
// refreshes the balance when the user returns (the wallet is credited
// server-side on provider confirmation, not synchronously here).
export function useTopup() {
  const [submitting, setSubmitting] = useState(false);
  const keyRef = useRef<string | null>(null);
  const keyAmountRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  async function execute(amountCents: number): Promise<TopupOk | TopupFail> {
    setSubmitting(true);
    // The idempotency key is bound to the amount — changing the amount mints a
    // fresh key so a retry can't replay the previous sum's checkout.
    if (!keyRef.current || keyAmountRef.current !== amountCents) {
      keyRef.current = newIdempotencyKey();
      keyAmountRef.current = amountCents;
    }
    try {
      const balanceBefore =
        queryClient.getQueryData<BillingSummary>(BILLING_ME_KEY)?.balanceCents ?? 0;
      const resp = await topup({
        amountCents,
        idempotencyKey: keyRef.current,
      });
      keyRef.current = null;
      await WebBrowser.openBrowserAsync(resp.paymentUrl);
      // Settlement is async — poll until the wallet actually grows (covers the
      // subscriber bonus too) so the balance the user sees is the real one.
      await refreshBillingUntil(queryClient, (s) => s.balanceCents > balanceBefore);
      return { ok: true, reused: resp.reused };
    } catch (err) {
      return { ok: false, error: mapTopupError(err) };
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, execute };
}
