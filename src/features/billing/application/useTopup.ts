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

  async function execute(amountCents: number): Promise<TopupOk | TopupFail> {
    setSubmitting(true);
    if (!keyRef.current) keyRef.current = newIdempotencyKey();
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
