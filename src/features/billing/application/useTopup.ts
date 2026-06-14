import { useRef, useState } from "react";

import { topup } from "@/api/billing";
import { newIdempotencyKey } from "@/utils/idempotency-key";

import { mapTopupError, type TopupErrorMapping } from "./mapTopupError";

export type TopupOk = {
  ok: true;
  balanceCents: number;
  reused: boolean;
};

export type TopupFail = {
  ok: false;
  error: TopupErrorMapping;
};

export function useTopup() {
  const [submitting, setSubmitting] = useState(false);
  const keyRef = useRef<string | null>(null);
  const keyAmountRef = useRef<number | null>(null);

  async function execute(amountCents: number): Promise<TopupOk | TopupFail> {
    setSubmitting(true);
    // The idempotency key must be tied to the amount: reusing a key minted for a
    // different amount would let the server return its cached (original-amount)
    // result on retry, applying a sum different from what the user now intends.
    if (!keyRef.current || keyAmountRef.current !== amountCents) {
      keyRef.current = newIdempotencyKey();
      keyAmountRef.current = amountCents;
    }
    try {
      const resp = await topup({
        amountCents,
        idempotencyKey: keyRef.current,
      });
      keyRef.current = null;
      return { ok: true, balanceCents: resp.balanceCents, reused: resp.reused };
    } catch (err) {
      return { ok: false, error: mapTopupError(err) };
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, execute };
}
